import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the append-only ledger columns to an existing database.
 * Fresh databases can still be created with DB_SYNCHRONIZE=true in development,
 * then switched off. Production must stay at DB_SYNCHRONIZE=false and run this.
 */
export class LedgerHardening1740000000000 implements MigrationInterface {
  name = 'LedgerHardening1740000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
          RETURN;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payments_entry_type_enum') THEN
          CREATE TYPE payments_entry_type_enum AS ENUM ('RECEIPT', 'REVERSAL');
        END IF;

        ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount_paise bigint;
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS entry_type payments_entry_type_enum DEFAULT 'RECEIPT';
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS idempotency_key varchar(64);
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS reversal_of_payment_id uuid;

        UPDATE payments
        SET amount_paise = ROUND(amount * 100)
        WHERE amount_paise IS NULL;

        IF EXISTS (SELECT 1 FROM payments WHERE amount_paise IS NULL) THEN
          RAISE EXCEPTION 'payments.amount_paise could not be backfilled';
        END IF;

        ALTER TABLE payments ALTER COLUMN amount_paise SET NOT NULL;
        ALTER TABLE payments ALTER COLUMN entry_type SET NOT NULL;

        CREATE UNIQUE INDEX IF NOT EXISTS payments_idempotency_key_uq
          ON payments (idempotency_key);

        CREATE UNIQUE INDEX IF NOT EXISTS payments_reversal_of_payment_id_uq
          ON payments (reversal_of_payment_id);
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
          RETURN;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'CHK_booking_paid_lte_total'
        ) THEN
          ALTER TABLE bookings
            ADD CONSTRAINT CHK_booking_paid_lte_total
            CHECK (paid_amount <= total_amount);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'CHK_booking_amounts_non_negative'
        ) THEN
          ALTER TABLE bookings
            ADD CONSTRAINT CHK_booking_amounts_non_negative
            CHECK (paid_amount >= 0 AND total_amount >= 0);
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE bookings DROP CONSTRAINT IF EXISTS CHK_booking_paid_lte_total`);
    await queryRunner.query(`ALTER TABLE bookings DROP CONSTRAINT IF EXISTS CHK_booking_amounts_non_negative`);
    await queryRunner.query(`DROP INDEX IF EXISTS payments_idempotency_key_uq`);
    await queryRunner.query(`DROP INDEX IF EXISTS payments_reversal_of_payment_id_uq`);
    await queryRunner.query(`ALTER TABLE payments DROP COLUMN IF EXISTS reversal_of_payment_id`);
    await queryRunner.query(`ALTER TABLE payments DROP COLUMN IF EXISTS idempotency_key`);
    await queryRunner.query(`ALTER TABLE payments DROP COLUMN IF EXISTS entry_type`);
    await queryRunner.query(`ALTER TABLE payments DROP COLUMN IF EXISTS amount_paise`);
  }
}
