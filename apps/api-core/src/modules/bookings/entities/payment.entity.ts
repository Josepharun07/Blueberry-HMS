import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Booking } from './booking.entity';

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  UPI = 'UPI',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
}

/**
 * RECEIPT records money the guest handed the desk.
 * REVERSAL corrects a receipt in the ledger. It does not send money anywhere.
 */
export enum PaymentEntryType {
  RECEIPT = 'RECEIPT',
  REVERSAL = 'REVERSAL',
}

@Entity('payments')
@Index(['idempotencyKey'], { unique: true })
@Index(['reversalOfPaymentId'], { unique: true })
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Booking, (booking) => booking.payments, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'booking_id' })
  bookingId: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: string;

  /** Source of truth. Integer paise, always positive. */
  @Column({ type: 'bigint', name: 'amount_paise' })
  amountPaise: string;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    name: 'payment_method',
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentEntryType,
    name: 'entry_type',
    default: PaymentEntryType.RECEIPT,
  })
  entryType: PaymentEntryType;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 64, nullable: true })
  idempotencyKey: string | null;

  @Column({ name: 'reversal_of_payment_id', type: 'uuid', nullable: true })
  reversalOfPaymentId: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  reference?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes?: string | null;

  @Column({ name: 'recorded_by', type: 'uuid', nullable: true })
  recordedBy?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
