import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { calendarDateInTimeZone, paiseToRupeeString } from '../../common/money/money';

export interface DeskMovement {
  bookingId: string;
  confirmationNumber: string;
  roomNumber: string;
  guestName: string;
}

export interface DeskReport {
  date: string;
  timeZone: string;
  arrivalsDue: number;
  departuresDue: number;
  inHouse: number;
  occupiedRooms: number;
  sellableRooms: number;
  cleaningRooms: number;
  occupancyPercent: string;
  receivedToday: string;
  arrivals: DeskMovement[];
  departures: DeskMovement[];
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  async desk(now = new Date()): Promise<DeskReport> {
    const timeZone = this.config.getOrThrow<string>('PROPERTY_TIMEZONE');
    const date = calendarDateInTimeZone(timeZone, now);

    const [counts] = await this.dataSource.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'CONFIRMED' AND check_in_date = $1::date)::int AS arrivals,
         COUNT(*) FILTER (WHERE status = 'CHECKED_IN' AND check_out_date = $1::date)::int AS departures,
         COUNT(*) FILTER (WHERE status = 'CHECKED_IN')::int AS in_house
       FROM bookings`,
      [date],
    );
    const [rooms] = await this.dataSource.query(
      `SELECT
         COUNT(*) FILTER (WHERE is_active AND status = 'OCCUPIED')::int AS occupied,
         COUNT(*) FILTER (WHERE is_active AND status NOT IN ('OUT_OF_ORDER', 'MAINTENANCE'))::int AS sellable,
         COUNT(*) FILTER (WHERE is_active AND status = 'CLEANING')::int AS cleaning
       FROM rooms`,
    );
    const [money] = await this.dataSource.query(
      `SELECT COALESCE(SUM(
         CASE WHEN entry_type = 'REVERSAL' THEN -amount_paise ELSE amount_paise END
       ), 0)::text AS received
       FROM payments
       WHERE (created_at AT TIME ZONE 'UTC' AT TIME ZONE $2)::date = $1::date`,
      [date, timeZone],
    );
    const arrivals = await this.movements(date, 'CONFIRMED', 'check_in_date');
    const departures = await this.movements(date, 'CHECKED_IN', 'check_out_date');

    const occupiedRooms = Number(rooms?.occupied ?? 0);
    const sellableRooms = Number(rooms?.sellable ?? 0);

    return {
      date,
      timeZone,
      arrivalsDue: Number(counts?.arrivals ?? 0),
      departuresDue: Number(counts?.departures ?? 0),
      inHouse: Number(counts?.in_house ?? 0),
      occupiedRooms,
      sellableRooms,
      cleaningRooms: Number(rooms?.cleaning ?? 0),
      occupancyPercent: percent(occupiedRooms, sellableRooms),
      receivedToday: signedRupees(money?.received ?? '0'),
      arrivals,
      departures,
    };
  }

  private async movements(date: string, status: string, column: 'check_in_date' | 'check_out_date'): Promise<DeskMovement[]> {
    const rows = await this.dataSource.query(
      `SELECT b.id AS booking_id,
              b.confirmation_number,
              r.room_number,
              g.first_name,
              g.last_name
       FROM bookings b
       JOIN rooms r ON r.id = b.room_id
       JOIN guests g ON g.id = b.guest_id
       WHERE b.status = $2 AND b.${column} = $1::date
       ORDER BY r.room_number
       LIMIT 50`,
      [date, status],
    );
    return rows.map((row: Record<string, string>) => ({
      bookingId: row.booking_id,
      confirmationNumber: row.confirmation_number,
      roomNumber: row.room_number,
      guestName: `${row.first_name} ${row.last_name}`.trim(),
    }));
  }
}

function percent(part: number, whole: number): string {
  if (!Number.isSafeInteger(part) || !Number.isSafeInteger(whole) || whole <= 0) return '0.0';
  const tenths = Math.round((part * 1000) / whole);
  return `${Math.floor(tenths / 10)}.${tenths % 10}`;
}

function signedRupees(raw: string): string {
  const negative = raw.trim().startsWith('-');
  const digits = raw.trim().replace(/^-/, '');
  const paise = Number(digits);
  const formatted = paiseToRupeeString(paise);
  return negative ? `-${formatted}` : formatted;
}
