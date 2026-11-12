/**
 * Money is integer paise. Floating point is never used for amounts that
 * move a balance. 1 rupee = 100 paise. Values stay inside Number.isSafeInteger.
 */

export const PAISA_PER_RUPEE = 100;
const BASIS_POINT_SCALE = 10_000;
const MAX_PAISE = 1_000_000_000_00; // 1,000,000,000.00 rupees

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoneyError';
  }
}

export function assertPaise(value: number, label = 'amount'): void {
  if (!Number.isSafeInteger(value)) {
    throw new MoneyError(`${label} must be an integer number of paise`);
  }
  if (value < 0 || value > MAX_PAISE) {
    throw new MoneyError(`${label} is outside the allowed range`);
  }
}

export function assertBasisPoints(value: number, label = 'rate'): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > BASIS_POINT_SCALE) {
    throw new MoneyError(`${label} must be an integer from 0 to 10000 basis points`);
  }
}

/**
 * Accepts a decimal rupee string with at most 2 fraction digits.
 * "3500", "3500.5", and "3500.50" are valid. Numbers are rejected so a
 * binary float cannot enter the ledger.
 */
export function rupeesToPaise(rupees: string): number {
  if (typeof rupees !== 'string') {
    throw new MoneyError('Amount must be a decimal string');
  }
  return decimalToPaise(rupees, { allowZero: false });
}

/** Database numeric values may be zero. Receipts themselves may not. */
export function decimalToPaise(
  value: string | number,
  options?: { allowZero?: boolean },
): number {
  const allowZero = options?.allowZero ?? true;
  const raw = typeof value === 'number' ? value.toFixed(2) : value.trim();
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(raw)) {
    throw new MoneyError('Amount must be a decimal with at most 2 fraction digits');
  }
  const [whole, fraction = ''] = raw.split('.');
  const paise = Number(whole) * PAISA_PER_RUPEE + Number(fraction.padEnd(2, '0'));
  assertPaise(paise);
  if (!allowZero && paise === 0) {
    throw new MoneyError('Amount must be greater than zero');
  }
  return paise;
}

export function paiseToRupeeString(paise: number): string {
  assertPaise(paise);
  const whole = Math.floor(paise / PAISA_PER_RUPEE);
  const fraction = paise % PAISA_PER_RUPEE;
  return `${whole}.${fraction.toString().padStart(2, '0')}`;
}

export function addPaise(left: number, right: number): number {
  assertPaise(left, 'left');
  assertPaise(right, 'right');
  const sum = left + right;
  assertPaise(sum, 'sum');
  return sum;
}

export function subtractPaise(left: number, right: number): number {
  assertPaise(left, 'left');
  assertPaise(right, 'right');
  if (right > left) {
    throw new MoneyError('Subtraction would go negative');
  }
  return left - right;
}

/** Half-up to the nearest paise. basis points are 1/100 of 1 percent. */
export function applyBasisPoints(amountPaise: number, basisPoints: number): number {
  assertPaise(amountPaise, 'amount');
  assertBasisPoints(basisPoints);
  return Math.floor((amountPaise * basisPoints + BASIS_POINT_SCALE / 2) / BASIS_POINT_SCALE);
}

export interface StayQuote {
  nights: number;
  roomPaise: number;
  discountPaise: number;
  taxablePaise: number;
  taxPaise: number;
  totalPaise: number;
}

export function quoteStay(input: {
  nightlyRatePaise: number;
  nights: number;
  taxBasisPoints: number;
  discountBasisPoints: number;
}): StayQuote {
  assertPaise(input.nightlyRatePaise, 'nightly rate');
  assertBasisPoints(input.taxBasisPoints, 'tax rate');
  assertBasisPoints(input.discountBasisPoints, 'discount rate');
  if (!Number.isSafeInteger(input.nights) || input.nights < 1 || input.nights > 366) {
    throw new MoneyError('Nights must be an integer from 1 to 366');
  }
  if (input.nightlyRatePaise <= 0) {
    throw new MoneyError('Nightly rate must be greater than zero');
  }

  const roomPaise = input.nightlyRatePaise * input.nights;
  assertPaise(roomPaise, 'room total');
  const discountPaise = applyBasisPoints(roomPaise, input.discountBasisPoints);
  const taxablePaise = subtractPaise(roomPaise, discountPaise);
  const taxPaise = applyBasisPoints(taxablePaise, input.taxBasisPoints);
  const totalPaise = addPaise(taxablePaise, taxPaise);

  return {
    nights: input.nights,
    roomPaise,
    discountPaise,
    taxablePaise,
    taxPaise,
    totalPaise,
  };
}

/** Hotel nights are [check-in, check-out). Dates are YYYY-MM-DD calendar dates. */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const start = parseCalendarDate(checkIn);
  const end = parseCalendarDate(checkOut);
  const diff = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  if (diff < 1 || diff > 366) {
    throw new MoneyError('Stay must be from 1 to 366 nights');
  }
  return diff;
}

export function staysOverlap(
  aCheckIn: string,
  aCheckOut: string,
  bCheckIn: string,
  bCheckOut: string,
): boolean {
  const aStart = parseCalendarDate(aCheckIn).getTime();
  const aEnd = parseCalendarDate(aCheckOut).getTime();
  const bStart = parseCalendarDate(bCheckIn).getTime();
  const bEnd = parseCalendarDate(bCheckOut).getTime();
  return aStart < bEnd && bStart < aEnd;
}

export function parseCalendarDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new MoneyError('Date must be YYYY-MM-DD');
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new MoneyError('Date is not a real calendar day');
  }
  return date;
}

export function calendarDateInTimeZone(timeZone: string, now = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
  } catch {
    throw new MoneyError('Time zone is not a valid IANA name');
  }
}

export function paymentStatusFor(paidPaise: number, totalPaise: number): 'PENDING' | 'PARTIAL' | 'PAID' {
  assertPaise(paidPaise, 'paid');
  assertPaise(totalPaise, 'total');
  if (paidPaise > totalPaise) {
    throw new MoneyError('Paid amount cannot exceed the amount due');
  }
  if (paidPaise === 0 && totalPaise > 0) {
    return 'PENDING';
  }
  if (paidPaise < totalPaise) {
    return 'PARTIAL';
  }
  return 'PAID';
}

export function assertReceiptFits(paidPaise: number, receiptPaise: number, totalPaise: number): number {
  assertPaise(receiptPaise, 'receipt');
  if (receiptPaise <= 0) {
    throw new MoneyError('Receipt must be greater than zero');
  }
  const next = addPaise(paidPaise, receiptPaise);
  if (next > totalPaise) {
    throw new MoneyError('Receipt exceeds the balance due');
  }
  return next;
}

/** Reference values are receipt ids, never card numbers. */
export function assertSafePaymentReference(reference: string | undefined): void {
  if (reference === undefined || reference === '') {
    return;
  }
  if (reference.length > 64) {
    throw new MoneyError('Reference is too long');
  }
  const digits = reference.replace(/[\s-]/g, '');
  if (/^\d{12,19}$/.test(digits)) {
    throw new MoneyError('Reference looks like a card number and was rejected');
  }
}
