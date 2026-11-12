import {
  applyBasisPoints,
  assertReceiptFits,
  assertSafePaymentReference,
  decimalToPaise,
  MoneyError,
  nightsBetween,
  paiseToRupeeString,
  paymentStatusFor,
  quoteStay,
  rupeesToPaise,
  staysOverlap,
  subtractPaise,
} from './money';

describe('money', () => {
  it('converts rupee strings to paise without binary float drift', () => {
    expect(rupeesToPaise('3500')).toBe(350000);
    expect(rupeesToPaise('10.10')).toBe(1010);
    expect(rupeesToPaise('0.01')).toBe(1);
    expect(paiseToRupeeString(1010)).toBe('10.10');
    expect(paiseToRupeeString(350000)).toBe('3500.00');
  });

  it('rejects numbers, extra precision, zero, and junk', () => {
    expect(() => rupeesToPaise(10.1 as unknown as string)).toThrow(MoneyError);
    expect(() => rupeesToPaise('10.101')).toThrow(MoneyError);
    expect(() => rupeesToPaise('0')).toThrow(MoneyError);
    expect(() => rupeesToPaise('-5.00')).toThrow(MoneyError);
    expect(() => rupeesToPaise('1e2')).toThrow(MoneyError);
  });

  it('rounds half-up tax on leftover paise', () => {
    expect(applyBasisPoints(1, 5000)).toBe(1);
    expect(applyBasisPoints(1, 4999)).toBe(0);
    expect(applyBasisPoints(10000, 1200)).toBe(1200);
  });

  it('quotes a stay from server inputs only', () => {
    const quote = quoteStay({
      nightlyRatePaise: 550000,
      nights: 2,
      taxBasisPoints: 1200,
      discountBasisPoints: 0,
    });
    expect(quote.roomPaise).toBe(1_100_000);
    expect(quote.taxPaise).toBe(132_000);
    expect(quote.totalPaise).toBe(1_232_000);
    expect(paiseToRupeeString(quote.totalPaise)).toBe('12320.00');
  });

  it('refuses a discount that would make the balance negative', () => {
    expect(() =>
      quoteStay({
        nightlyRatePaise: 100,
        nights: 1,
        taxBasisPoints: 0,
        discountBasisPoints: 10_000,
      }),
    ).not.toThrow();
    const freeRoom = quoteStay({
      nightlyRatePaise: 100,
      nights: 1,
      taxBasisPoints: 0,
      discountBasisPoints: 10_000,
    });
    expect(freeRoom.totalPaise).toBe(0);
  });

  it('counts hotel nights on the calendar, not the clock', () => {
    expect(nightsBetween('2026-12-24', '2026-12-26')).toBe(2);
    expect(() => nightsBetween('2026-12-26', '2026-12-26')).toThrow(MoneyError);
    expect(() => nightsBetween('2026-02-31', '2026-03-02')).toThrow(MoneyError);
  });

  it('detects overlapping stays and allows a same-day turnover', () => {
    expect(staysOverlap('2026-01-01', '2026-01-05', '2026-01-04', '2026-01-08')).toBe(true);
    expect(staysOverlap('2026-01-01', '2026-01-05', '2026-01-05', '2026-01-07')).toBe(false);
    expect(staysOverlap('2026-01-10', '2026-01-12', '2026-01-01', '2026-01-20')).toBe(true);
  });

  it('keeps a receipt inside the amount due', () => {
    expect(decimalToPaise('0.00')).toBe(0);
    expect(assertReceiptFits(0, 5000, 10000)).toBe(5000);
    expect(paymentStatusFor(5000, 10000)).toBe('PARTIAL');
    expect(paymentStatusFor(10000, 10000)).toBe('PAID');
    expect(() => assertReceiptFits(8000, 3000, 10000)).toThrow(MoneyError);
  });

  it('rejects card-shaped references and overdrafts', () => {
    expect(() => assertSafePaymentReference('4111111111111111')).toThrow(MoneyError);
    expect(() => assertSafePaymentReference('4111-1111-1111-1111')).toThrow(MoneyError);
    expect(() => assertSafePaymentReference('UPI-998877')).not.toThrow();
    expect(() => subtractPaise(100, 101)).toThrow(MoneyError);
  });
});
