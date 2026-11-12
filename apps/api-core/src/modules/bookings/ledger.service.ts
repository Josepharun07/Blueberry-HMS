import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { CustomLoggerService } from '../../common/logging/logger.service';
import {
  assertReceiptFits,
  assertSafePaymentReference,
  decimalToPaise,
  MoneyError,
  paiseToRupeeString,
  paymentStatusFor,
  rupeesToPaise,
  subtractPaise,
} from '../../common/money/money';
import { Booking, BookingStatus, PaymentStatus } from './entities/booking.entity';
import { Payment, PaymentEntryType, PaymentMethod } from './entities/payment.entity';

const IDEMPOTENCY_KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface LedgerResult {
  paymentId: string;
  bookingId: string;
  entryType: PaymentEntryType;
  amount: string;
  paidAmount: string;
  totalAmount: string;
  paymentStatus: PaymentStatus;
  idempotentReplay: boolean;
}

@Injectable()
export class LedgerService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: CustomLoggerService,
  ) {}

  async recordReceipt(input: {
    bookingId: string;
    amount: string;
    paymentMethod: PaymentMethod;
    reference?: string;
    notes?: string;
    idempotencyKey: string;
    userId: string;
  }): Promise<LedgerResult> {
    const idempotencyKey = this.requireIdempotencyKey(input.idempotencyKey);
    this.assertTextSafe(input.reference, input.notes);
    let receiptPaise: number;
    try {
      receiptPaise = rupeesToPaise(input.amount);
    } catch (error) {
      throw this.asBadRequest(error);
    }

    try {
      return await this.dataSource.transaction((manager) =>
        this.insertReceipt(manager, { ...input, idempotencyKey, receiptPaise }),
      );
    } catch (error) {
      if (!this.isUniqueViolation(error)) {
        throw error;
      }
      return this.replayOrConflict(input.bookingId, idempotencyKey, receiptPaise, PaymentEntryType.RECEIPT);
    }
  }

  async reverseReceipt(input: {
    bookingId: string;
    paymentId: string;
    reason: string;
    idempotencyKey: string;
    userId: string;
  }): Promise<LedgerResult> {
    const idempotencyKey = this.requireIdempotencyKey(input.idempotencyKey);
    const reason = input.reason?.trim();
    if (!reason || reason.length < 3 || reason.length > 200) {
      throw new BadRequestException('A reversal reason is required');
    }
    this.assertTextSafe(undefined, reason);

    try {
      return await this.dataSource.transaction((manager) =>
        this.insertReversal(manager, { ...input, idempotencyKey, reason }),
      );
    } catch (error) {
      if (!this.isUniqueViolation(error)) {
        throw error;
      }
      const existing = await this.dataSource.getRepository(Payment).findOne({
        where: { idempotencyKey },
      });
      if (!existing) {
        throw new ConflictException('This reversal conflicts with an existing ledger entry');
      }
      return this.replayOrConflict(
        input.bookingId,
        idempotencyKey,
        Number(existing.amountPaise),
        PaymentEntryType.REVERSAL,
      );
    }
  }

  private async insertReceipt(
    manager: EntityManager,
    input: {
      bookingId: string;
      paymentMethod: PaymentMethod;
      reference?: string;
      notes?: string;
      idempotencyKey: string;
      userId: string;
      receiptPaise: number;
    },
  ): Promise<LedgerResult> {
    const replay = await this.findReplay(manager, input.idempotencyKey, input.bookingId, input.receiptPaise, PaymentEntryType.RECEIPT);
    if (replay) {
      return replay;
    }

    const booking = await this.lockBooking(manager, input.bookingId);
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cannot record a receipt on a cancelled booking');
    }

    const paidPaise = await this.sumPaise(manager, booking.id);
    const totalPaise = this.totalPaise(booking);
    let nextPaid: number;
    try {
      nextPaid = assertReceiptFits(paidPaise, input.receiptPaise, totalPaise);
    } catch (error) {
      throw this.asBadRequest(error);
    }

    const payment = manager.create(Payment, {
      bookingId: booking.id,
      amount: paiseToRupeeString(input.receiptPaise),
      amountPaise: String(input.receiptPaise),
      paymentMethod: input.paymentMethod,
      entryType: PaymentEntryType.RECEIPT,
      idempotencyKey: input.idempotencyKey,
      reference: input.reference?.trim() || null,
      notes: input.notes?.trim() || null,
      recordedBy: input.userId,
    });
    const saved = await manager.save(payment);
    const status = await this.persistPaid(manager, booking, nextPaid, totalPaise);

    this.logger.audit('RECEIPT_RECORDED', input.userId, {
      bookingId: booking.id,
      paymentId: saved.id,
      amountPaise: input.receiptPaise,
      idempotencyKey: input.idempotencyKey,
    });

    return this.result(saved, booking, status, false);
  }

  private async insertReversal(
    manager: EntityManager,
    input: {
      bookingId: string;
      paymentId: string;
      reason: string;
      idempotencyKey: string;
      userId: string;
    },
  ): Promise<LedgerResult> {
    const booking = await this.lockBooking(manager, input.bookingId);
    const original = await manager.findOne(Payment, {
      where: { id: input.paymentId, bookingId: booking.id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!original) {
      throw new NotFoundException('Receipt not found on this booking');
    }
    if (original.entryType !== PaymentEntryType.RECEIPT) {
      throw new BadRequestException('Only a receipt can be reversed');
    }

    const already = await manager.findOne(Payment, {
      where: { reversalOfPaymentId: original.id },
    });
    if (already) {
      throw new ConflictException('This receipt has already been reversed');
    }

    const replay = await this.findReplay(
      manager,
      input.idempotencyKey,
      booking.id,
      Number(original.amountPaise),
      PaymentEntryType.REVERSAL,
    );
    if (replay) {
      return replay;
    }

    const reversalPaise = Number(original.amountPaise);
    const paidPaise = await this.sumPaise(manager, booking.id);
    let nextPaid: number;
    try {
      nextPaid = subtractPaise(paidPaise, reversalPaise);
    } catch (error) {
      throw this.asBadRequest(error);
    }

    const payment = manager.create(Payment, {
      bookingId: booking.id,
      amount: paiseToRupeeString(reversalPaise),
      amountPaise: String(reversalPaise),
      paymentMethod: original.paymentMethod,
      entryType: PaymentEntryType.REVERSAL,
      idempotencyKey: input.idempotencyKey,
      reversalOfPaymentId: original.id,
      notes: input.reason,
      recordedBy: input.userId,
    });
    const saved = await manager.save(payment);
    const status = await this.persistPaid(manager, booking, nextPaid, this.totalPaise(booking));

    this.logger.audit('RECEIPT_REVERSED', input.userId, {
      bookingId: booking.id,
      paymentId: saved.id,
      reverses: original.id,
      amountPaise: reversalPaise,
      idempotencyKey: input.idempotencyKey,
    });

    return this.result(saved, booking, status, false);
  }

  private async findReplay(
    manager: EntityManager,
    idempotencyKey: string,
    bookingId: string,
    amountPaise: number,
    entryType: PaymentEntryType,
  ): Promise<LedgerResult | null> {
    const existing = await manager.findOne(Payment, { where: { idempotencyKey } });
    if (!existing) {
      return null;
    }
    if (
      existing.bookingId !== bookingId ||
      Number(existing.amountPaise) !== amountPaise ||
      existing.entryType !== entryType
    ) {
      throw new ConflictException('Idempotency key was already used for a different ledger entry');
    }
    const booking = await manager.findOne(Booking, { where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return this.result(existing, booking, booking.paymentStatus, true);
  }

  private async replayOrConflict(
    bookingId: string,
    idempotencyKey: string,
    amountPaise: number,
    entryType: PaymentEntryType,
  ): Promise<LedgerResult> {
    const existing = await this.dataSource.getRepository(Payment).findOne({
      where: { idempotencyKey },
    });
    if (
      !existing ||
      existing.bookingId !== bookingId ||
      Number(existing.amountPaise) !== amountPaise ||
      existing.entryType !== entryType
    ) {
      throw new ConflictException('Idempotency key was already used for a different ledger entry');
    }
    const booking = await this.dataSource.getRepository(Booking).findOne({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return this.result(existing, booking, booking.paymentStatus, true);
  }

  private async lockBooking(manager: EntityManager, bookingId: string): Promise<Booking> {
    const booking = await manager.findOne(Booking, {
      where: { id: bookingId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  private async sumPaise(manager: EntityManager, bookingId: string): Promise<number> {
    const rows = await manager.query(
      `
      SELECT COALESCE(SUM(
        CASE
          WHEN entry_type = 'REVERSAL' THEN -amount_paise
          ELSE amount_paise
        END
      ), 0)::text AS paid
      FROM payments
      WHERE booking_id = $1
      `,
      [bookingId],
    );
    const paid = Number(rows[0]?.paid ?? 0);
    if (!Number.isSafeInteger(paid) || paid < 0) {
      throw new ConflictException('Ledger balance is inconsistent');
    }
    return paid;
  }

  private totalPaise(booking: Booking): number {
    try {
      return decimalToPaise(booking.totalAmount);
    } catch (error) {
      throw this.asBadRequest(error);
    }
  }

  private async persistPaid(
    manager: EntityManager,
    booking: Booking,
    paidPaise: number,
    totalPaise: number,
  ): Promise<PaymentStatus> {
    const status = paymentStatusFor(paidPaise, totalPaise) as PaymentStatus;
    booking.paidAmount = paiseToRupeeString(paidPaise);
    booking.paymentStatus = status;
    await manager.save(booking);
    return status;
  }

  private result(
    payment: Payment,
    booking: Booking,
    status: PaymentStatus,
    idempotentReplay: boolean,
  ): LedgerResult {
    return {
      paymentId: payment.id,
      bookingId: booking.id,
      entryType: payment.entryType,
      amount: paiseToRupeeString(Number(payment.amountPaise)),
      paidAmount: booking.paidAmount,
      totalAmount: booking.totalAmount,
      paymentStatus: status,
      idempotentReplay,
    };
  }

  private requireIdempotencyKey(value: string | undefined): string {
    const key = value?.trim() ?? '';
    if (!IDEMPOTENCY_KEY.test(key)) {
      throw new BadRequestException('Idempotency-Key header must be a UUID');
    }
    return key;
  }

  private assertTextSafe(reference?: string, notes?: string): void {
    try {
      assertSafePaymentReference(reference);
      assertSafePaymentReference(notes);
    } catch (error) {
      throw this.asBadRequest(error);
    }
  }

  private asBadRequest(error: unknown): BadRequestException {
    if (error instanceof MoneyError) {
      return new BadRequestException(error.message);
    }
    if (error instanceof BadRequestException) {
      return error;
    }
    return new BadRequestException('Payment could not be applied');
  }

  private isUniqueViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';
  }
}
