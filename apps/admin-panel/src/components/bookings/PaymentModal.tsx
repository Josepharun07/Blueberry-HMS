import { Fragment, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import type { Booking } from '../../types/booking.types';
import { bookingsApi } from '../../lib/api/bookings';

function decimalStringToPaise(value: string): number {
  const raw = value.trim();
  const negative = raw.startsWith('-');
  const body = negative ? raw.slice(1) : raw;
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(body)) return 0;
  const [whole, fraction = ''] = body.split('.');
  const paise = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return negative ? -paise : paise;
}

function paiseToDecimal(paise: number): string {
  const negative = paise < 0;
  const absolute = Math.abs(paise);
  const whole = Math.floor(absolute / 100);
  const fraction = String(absolute % 100).padStart(2, '0');
  return `${negative ? '-' : ''}${whole}.${fraction}`;
}

function balanceRupees(total: string, paid: string): string {
  return paiseToDecimal(decimalStringToPaise(total) - decimalStringToPaise(paid));
}

interface PaymentModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentRecorded: () => void;
}

export function PaymentModal({ booking, isOpen, onClose, onPaymentRecorded }: PaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const idempotencyKey = useRef(crypto.randomUUID());

  if (!booking) return null;

  const balanceDue = balanceRupees(booking.totalAmount, booking.paidAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const normalized = amount.trim();
    if (!/^\d{1,10}(\.\d{1,2})?$/.test(normalized) || normalized === '0' || normalized === '0.0' || normalized === '0.00') {
      setError('Enter the amount in rupees, with at most 2 decimal places');
      setLoading(false);
      return;
    }

    try {
      await bookingsApi.recordPayment(
        booking.id,
        {
          amount: normalized,
          paymentMethod,
          reference: reference || undefined,
          notes: notes || undefined,
        },
        idempotencyKey.current,
      );
      idempotencyKey.current = crypto.randomUUID();

      setAmount('');
      setPaymentMethod('CASH');
      setReference('');
      setNotes('');
      onPaymentRecorded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const paise = decimalStringToPaise(value);
    const negative = paise < 0;
    const absolute = Math.abs(paise);
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).formatToParts(0);
    const symbol = formatted.find((part) => part.type === 'currency')?.value ?? '';
    const whole = Math.floor(absolute / 100);
    const fraction = String(absolute % 100).padStart(2, '0');
    const amount = new Intl.NumberFormat('en-IN').format(whole);
    return `${negative ? '-' : ''}${symbol}${amount}.${fraction}`;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                <div className="bg-primary-600 px-6 py-4 text-white">
                  <Dialog.Title className="text-lg font-semibold">
                    Record Payment
                  </Dialog.Title>
                  <p className="text-sm text-primary-100 mt-1">
                    {booking.confirmationNumber}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(booking.totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Amount Paid:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(booking.paidAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-base pt-2 border-t">
                      <span className="font-semibold text-gray-900">Balance Due:</span>
                      <span className="font-bold text-red-600">
                        {formatCurrency(balanceDue)}
                      </span>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Amount *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={balanceDue}
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0.00"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setAmount(balanceDue)}
                      className="mt-1 text-xs text-primary-600 hover:text-primary-700"
                    >
                      Pay full balance
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method *
                    </label>
                    <select
                      required
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Transaction ID, Cheque No., etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      {loading ? 'Recording...' : 'Record Payment'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
