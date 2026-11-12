import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { apiFetch } from '../../lib/api/http';

interface Invoice {
  confirmationNumber: string;
  propertyLegalName: string | null;
  propertyGstin: string | null;
  guest: { firstName: string; lastName: string };
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  lines: { description: string; amount: string }[];
  totalAmount: string;
  paidAmount: string;
  balanceAmount: string;
  currency: string;
  payments: { id: string; entryType: string; paymentMethod: string; amount: string }[];
}

export function InvoiceModal({
  bookingId,
  isOpen,
  onClose,
}: {
  bookingId: string | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !bookingId) return;
    setInvoice(null);
    setError('');
    apiFetch(`/api/v1/bookings/${bookingId}/invoice`)
      .then(async (response) => {
        if (!response.ok) {
          setError('The bill could not be loaded');
          return;
        }
        setInvoice((await response.json()) as Invoice);
      })
      .catch(() => setError('The bill could not be loaded'));
  }, [isOpen, bookingId]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/25" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-lg rounded-lg bg-white p-6 shadow">
              <Dialog.Title className="text-lg font-semibold text-gray-900">Bill</Dialog.Title>
              {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
              {invoice && (
                <div className="mt-4 space-y-2 text-sm text-gray-800">
                  {invoice.propertyLegalName && <div className="font-semibold">{invoice.propertyLegalName}</div>}
                  {invoice.propertyGstin && <div>GSTIN {invoice.propertyGstin}</div>}
                  <div>{invoice.confirmationNumber}</div>
                  <div>{invoice.guest.firstName} {invoice.guest.lastName} · Room {invoice.roomNumber}</div>
                  <div>{invoice.checkInDate} to {invoice.checkOutDate} · {invoice.nights} nights</div>
                  <div className="border-t pt-2">
                    {invoice.lines.map((line) => (
                      <div key={line.description} className="flex justify-between">
                        <span>{line.description}</span>
                        <span>{line.amount}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{invoice.totalAmount} {invoice.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Received</span>
                    <span>{invoice.paidAmount}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Balance</span>
                    <span>{invoice.balanceAmount}</span>
                  </div>
                  <ul className="border-t pt-2">
                    {invoice.payments.map((payment) => (
                      <li key={payment.id}>{payment.entryType} {payment.paymentMethod} {payment.amount}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" className="btn" onClick={() => window.print()}>Print</button>
                <button type="button" className="btn btn-primary" onClick={onClose}>Close</button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
