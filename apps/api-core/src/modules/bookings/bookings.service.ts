import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { UserRole, RoleHierarchy } from '../../common/enums/user-role.enum';
import { CustomLoggerService } from '../../common/logging/logger.service';
import {
  calendarDateInTimeZone,
  decimalToPaise,
  MoneyError,
  nightsBetween,
  paiseToRupeeString,
  paymentStatusFor,
  quoteStay,
  StayQuote,
} from '../../common/money/money';
import { Guest } from '../guests/entities/guest.entity';
import { Room, RoomStatus } from '../rooms/entities/room.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Booking, BookingStatus, PaymentStatus } from './entities/booking.entity';
import { Payment } from './entities/payment.entity';
import { LedgerResult, LedgerService } from './ledger.service';

export interface DeskActor {
  id: string;
  role: UserRole;
}

export interface BookingQuote extends StayQuote {
  roomId: string;
  nightlyRate: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  currency: 'INR';
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly logger: CustomLoggerService,
    private readonly ledger: LedgerService,
  ) {}

  async quote(dto: CreateBookingDto, actor: DeskActor): Promise<BookingQuote> {
    const room = await this.roomRepository.findOne({ where: { id: dto.roomId } });
    if (!room || !room.isActive) {
      throw new NotFoundException('Room not found');
    }
    return this.priceStay(dto, actor, {
      nightlyRatePaise: decimalToPaise(room.basePrice),
      maxOccupancy: room.maxOccupancy,
      blocked: room.status === RoomStatus.OUT_OF_ORDER || room.status === RoomStatus.MAINTENANCE,
    }).quote;
  }

  async create(dto: CreateBookingDto, actor: DeskActor): Promise<Booking> {
    return this.dataSource.transaction(async (manager) => {
      const guest = await manager.findOne(Guest, { where: { id: dto.guestId } });
      if (!guest) {
        throw new NotFoundException('Guest not found');
      }

      const room = await manager.findOne(Room, {
        where: { id: dto.roomId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!room || !room.isActive) {
        throw new NotFoundException('Room not found');
      }

      const priced = this.priceStay(dto, actor, {
        nightlyRatePaise: decimalToPaise(room.basePrice),
        maxOccupancy: room.maxOccupancy,
        blocked: room.status === RoomStatus.OUT_OF_ORDER || room.status === RoomStatus.MAINTENANCE,
      });

      await this.assertNoOverlap(manager, room.id, dto.checkInDate, dto.checkOutDate);

      const booking = manager.create(Booking, {
        guestId: guest.id,
        roomId: room.id,
        checkInDate: dto.checkInDate,
        checkOutDate: dto.checkOutDate,
        numberOfGuests: dto.numberOfGuests,
        numberOfNights: priced.quote.nights,
        roomRate: priced.quote.nightlyRate,
        taxAmount: priced.quote.taxAmount,
        discountAmount: priced.quote.discountAmount,
        totalAmount: priced.quote.totalAmount,
        paidAmount: paiseToRupeeString(0),
        status: BookingStatus.CONFIRMED,
        paymentStatus: paymentStatusFor(0, priced.quote.totalPaise) as PaymentStatus,
        specialRequests: dto.specialRequests?.trim() || null,
        internalNotes: this.withDiscountNote(dto.internalNotes, priced.discountReason),
        bookingSource: dto.bookingSource?.trim() || null,
        createdBy: actor.id,
        confirmationNumber: this.confirmationNumber(dto.checkInDate),
      });
      const saved = await manager.save(booking);

      this.logger.audit('BOOKING_CREATED', actor.id, {
        bookingId: saved.id,
        confirmationNumber: saved.confirmationNumber,
        roomId: room.id,
        totalPaise: priced.quote.totalPaise,
      });

      return saved;
    });
  }

  findAll(): Promise<Booking[]> {
    return this.bookingRepository.find({
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['payments'],
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  async update(id: string, dto: UpdateBookingDto, actor: DeskActor): Promise<Booking> {
    return this.dataSource.transaction(async (manager) => {
      const booking = await manager.findOne(Booking, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      const scheduleChange =
        dto.roomId !== undefined ||
        dto.checkInDate !== undefined ||
        dto.checkOutDate !== undefined ||
        dto.numberOfGuests !== undefined ||
        dto.discountBasisPoints !== undefined;

      if (scheduleChange && ![BookingStatus.CONFIRMED, BookingStatus.PENDING].includes(booking.status)) {
        throw new BadRequestException('Stay details can only change before check-in');
      }

      if (dto.specialRequests !== undefined) {
        booking.specialRequests = dto.specialRequests.trim();
      }
      if (dto.internalNotes !== undefined) {
        booking.internalNotes = dto.internalNotes.trim();
      }

      if (scheduleChange) {
        const roomId = dto.roomId ?? booking.roomId;
        const room = await manager.findOne(Room, {
          where: { id: roomId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!room || !room.isActive) {
          throw new NotFoundException('Room not found');
        }

        const next: CreateBookingDto = {
          guestId: booking.guestId,
          roomId,
          checkInDate: dto.checkInDate ?? this.asCalendarDate(booking.checkInDate),
          checkOutDate: dto.checkOutDate ?? this.asCalendarDate(booking.checkOutDate),
          numberOfGuests: dto.numberOfGuests ?? booking.numberOfGuests,
          discountBasisPoints: dto.discountBasisPoints,
          discountReason: dto.discountReason,
          specialRequests: booking.specialRequests ?? undefined,
          internalNotes: booking.internalNotes ?? undefined,
        };

        const priced = this.priceStay(next, actor, {
          nightlyRatePaise: decimalToPaise(room.basePrice),
          maxOccupancy: room.maxOccupancy,
          blocked: room.status === RoomStatus.OUT_OF_ORDER || room.status === RoomStatus.MAINTENANCE,
        });
        const paidPaise = decimalToPaise(booking.paidAmount);
        if (priced.quote.totalPaise < paidPaise) {
          throw new ConflictException('The new total is below the amount already received');
        }

        await this.assertNoOverlap(manager, room.id, next.checkInDate, next.checkOutDate, booking.id);

        booking.roomId = room.id;
        booking.checkInDate = next.checkInDate as unknown as Date;
        booking.checkOutDate = next.checkOutDate as unknown as Date;
        booking.numberOfGuests = next.numberOfGuests;
        booking.numberOfNights = priced.quote.nights;
        booking.roomRate = priced.quote.nightlyRate;
        booking.taxAmount = priced.quote.taxAmount;
        booking.discountAmount = priced.quote.discountAmount;
        booking.totalAmount = priced.quote.totalAmount;
        booking.paymentStatus = paymentStatusFor(paidPaise, priced.quote.totalPaise) as PaymentStatus;
        if (priced.discountReason) {
          booking.internalNotes = this.withDiscountNote(booking.internalNotes, priced.discountReason);
        }
      }

      const saved = await manager.save(booking);
      this.logger.audit('BOOKING_UPDATED', actor.id, { bookingId: saved.id });
      return saved;
    });
  }

  async checkIn(id: string, actor: DeskActor): Promise<Booking> {
    return this.dataSource.transaction(async (manager) => {
      const booking = await this.lockBooking(manager, id);
      if (booking.status !== BookingStatus.CONFIRMED) {
        throw new BadRequestException('Only confirmed bookings can be checked in');
      }

      const today = calendarDateInTimeZone(this.timeZone());
      const checkIn = this.asCalendarDate(booking.checkInDate);
      const checkOut = this.asCalendarDate(booking.checkOutDate);
      if (today < checkIn || today >= checkOut) {
        throw new BadRequestException('Check-in is only allowed during the booked stay');
      }

      const room = await manager.findOne(Room, {
        where: { id: booking.roomId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!room) {
        throw new NotFoundException('Room not found');
      }
      if (room.status === RoomStatus.OCCUPIED || room.status === RoomStatus.OUT_OF_ORDER || room.status === RoomStatus.MAINTENANCE) {
        throw new ConflictException('Room cannot be occupied in its current state');
      }

      booking.status = BookingStatus.CHECKED_IN;
      booking.actualCheckInTime = new Date();
      room.status = RoomStatus.OCCUPIED;
      await manager.save(room);
      const saved = await manager.save(booking);
      this.logger.audit('BOOKING_CHECKED_IN', actor.id, { bookingId: id, roomId: room.id });
      return saved;
    });
  }

  async checkOut(id: string, actor: DeskActor): Promise<Booking> {
    return this.dataSource.transaction(async (manager) => {
      const booking = await this.lockBooking(manager, id);
      if (booking.status !== BookingStatus.CHECKED_IN) {
        throw new BadRequestException('Only checked-in bookings can be checked out');
      }
      const paid = decimalToPaise(booking.paidAmount);
      const total = decimalToPaise(booking.totalAmount);
      if (paid < total) {
        throw new ConflictException('Balance is still due');
      }

      booking.status = BookingStatus.CHECKED_OUT;
      booking.actualCheckOutTime = new Date();
      await manager.update(Room, booking.roomId, { status: RoomStatus.CLEANING });
      const saved = await manager.save(booking);
      this.logger.audit('BOOKING_CHECKED_OUT', actor.id, { bookingId: id });
      return saved;
    });
  }

  async cancel(id: string, actor: DeskActor): Promise<Booking> {
    return this.dataSource.transaction(async (manager) => {
      const booking = await this.lockBooking(manager, id);
      if (booking.status === BookingStatus.CHECKED_OUT || booking.status === BookingStatus.CANCELLED) {
        throw new BadRequestException('This booking can no longer be cancelled');
      }
      if (booking.status === BookingStatus.CHECKED_IN) {
        await manager.update(Room, booking.roomId, { status: RoomStatus.CLEANING });
      }
      booking.status = BookingStatus.CANCELLED;
      const saved = await manager.save(booking);
      this.logger.audit('BOOKING_CANCELLED', actor.id, {
        bookingId: id,
        paidAmount: saved.paidAmount,
      });
      return saved;
    });
  }

  async markNoShow(id: string, actor: DeskActor): Promise<Booking> {
    return this.dataSource.transaction(async (manager) => {
      const booking = await this.lockBooking(manager, id);
      if (booking.status !== BookingStatus.CONFIRMED) {
        throw new BadRequestException('Only a confirmed booking can be marked as a no-show');
      }
      const today = calendarDateInTimeZone(this.timeZone());
      if (today <= this.asCalendarDate(booking.checkInDate)) {
        throw new BadRequestException('A no-show can be recorded only after the check-in date');
      }
      booking.status = BookingStatus.NO_SHOW;
      const saved = await manager.save(booking);
      this.logger.audit('BOOKING_NO_SHOW', actor.id, { bookingId: id });
      return saved;
    });
  }

  recordPayment(bookingId: string, dto: CreatePaymentDto, idempotencyKey: string, actor: DeskActor): Promise<LedgerResult> {
    return this.ledger.recordReceipt({
      bookingId,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      reference: dto.reference,
      notes: dto.notes,
      idempotencyKey,
      userId: actor.id,
    });
  }

  reversePayment(
    bookingId: string,
    paymentId: string,
    reason: string,
    idempotencyKey: string,
    actor: DeskActor,
  ): Promise<LedgerResult> {
    this.assertManager(actor);
    return this.ledger.reverseReceipt({
      bookingId,
      paymentId,
      reason,
      idempotencyKey,
      userId: actor.id,
    });
  }

  async getPayments(bookingId: string): Promise<Payment[]> {
    await this.findOne(bookingId);
    return this.paymentRepository.find({
      where: { bookingId },
      order: { createdAt: 'DESC' },
    });
  }

  remove(): never {
    throw new ForbiddenException('Bookings are part of the financial record and cannot be deleted');
  }

  private priceStay(
    dto: Pick<CreateBookingDto, 'roomId' | 'checkInDate' | 'checkOutDate' | 'numberOfGuests' | 'discountBasisPoints' | 'discountReason'>,
    actor: DeskActor,
    room: { nightlyRatePaise: number; maxOccupancy: number; blocked: boolean },
  ): { quote: BookingQuote; discountReason?: string } {
    if (room.blocked) {
      throw new ConflictException('Room is blocked and cannot be sold');
    }
    if (dto.numberOfGuests > room.maxOccupancy) {
      throw new BadRequestException('Party size exceeds the room occupancy');
    }

    let nights = 0;
    try {
      nights = nightsBetween(dto.checkInDate, dto.checkOutDate);
    } catch (error) {
      throw this.moneyError(error);
    }

    if (room.nightlyRatePaise <= 0) {
      throw new BadRequestException('Room rate is not configured');
    }

    const discountBasisPoints = dto.discountBasisPoints ?? 0;
    let discountReason: string | undefined;
    if (discountBasisPoints > 0) {
      this.assertManager(actor);
      if (discountBasisPoints > this.discountCap()) {
        throw new BadRequestException('Discount exceeds the configured maximum');
      }
      discountReason = dto.discountReason?.trim();
      if (!discountReason) {
        throw new BadRequestException('A discount reason is required');
      }
    }

    let stay: StayQuote;
    try {
      stay = quoteStay({
        nightlyRatePaise: room.nightlyRatePaise,
        nights,
        taxBasisPoints: this.taxRate(),
        discountBasisPoints,
      });
    } catch (error) {
      throw this.moneyError(error);
    }

    return {
      discountReason,
      quote: {
        ...stay,
        roomId: dto.roomId,
        nightlyRate: paiseToRupeeString(room.nightlyRatePaise),
        taxAmount: paiseToRupeeString(stay.taxPaise),
        discountAmount: paiseToRupeeString(stay.discountPaise),
        totalAmount: paiseToRupeeString(stay.totalPaise),
        currency: 'INR',
      },
    };
  }

  private async assertNoOverlap(
    manager: EntityManager,
    roomId: string,
    checkIn: string,
    checkOut: string,
    ignoreBookingId?: string,
  ): Promise<void> {
    const query = manager
      .createQueryBuilder(Booking, 'booking')
      .where('booking.roomId = :roomId', { roomId })
      .andWhere('booking.status NOT IN (:...open)', {
        open: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW],
      })
      .andWhere('booking.checkInDate < :checkOut', { checkOut })
      .andWhere('booking.checkOutDate > :checkIn', { checkIn });

    if (ignoreBookingId) {
      query.andWhere('booking.id != :ignoreBookingId', { ignoreBookingId });
    }

    const conflicts = await query.getCount();
    if (conflicts > 0) {
      throw new ConflictException('Room is not available for the selected dates');
    }
  }

  private async lockBooking(manager: EntityManager, id: string): Promise<Booking> {
    const booking = await manager.findOne(Booking, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  private assertManager(actor: DeskActor): void {
    if ((RoleHierarchy[actor.role] ?? 0) < RoleHierarchy[UserRole.MANAGER]) {
      throw new ForbiddenException('A manager must approve this');
    }
  }

  private taxRate(): number {
    return Number(this.config.getOrThrow('TAX_ROOM_BASIS_POINTS'));
  }

  private discountCap(): number {
    return Number(this.config.getOrThrow('MAX_DISCOUNT_BASIS_POINTS'));
  }

  private timeZone(): string {
    return this.config.getOrThrow<string>('PROPERTY_TIMEZONE');
  }

  private moneyError(error: unknown): BadRequestException {
    if (error instanceof MoneyError) {
      return new BadRequestException(error.message);
    }
    throw error;
  }

  private withDiscountNote(notes: string | null | undefined, reason?: string): string | null {
    if (!reason) {
      return notes?.trim() || null;
    }
    const line = `Discount reason: ${reason}`;
    return notes?.trim() ? `${notes.trim()}\n${line}` : line;
  }

  private confirmationNumber(checkIn: string): string {
    return `BH${checkIn.replace(/-/g, '')}${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  private asCalendarDate(value: Date | string): string {
    if (typeof value === 'string') {
      return value.slice(0, 10);
    }
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
