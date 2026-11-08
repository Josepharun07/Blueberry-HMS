import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { apiFetch } from '../../lib/api/http';
import { bookingsApi } from '../../lib/api/bookings';
import type { BookingQuote } from '../../types/booking.types';

interface GuestOption {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface RoomOption {
  id: string;
  roomNumber: string;
  type: string;
  basePrice: string;
  maxOccupancy: number;
  status: string;
}

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateBookingModal({ isOpen, onClose, onCreated }: CreateBookingModalProps) {
  const [guestQuery, setGuestQuery] = useState('');
  const [guests, setGuests] = useState<GuestOption[]>([]);
  const [guestId, setGuestId] = useState('');
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [roomId, setRoomId] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState('2');
  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    apiFetch('/api/v1/rooms')
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as RoomOption[];
        setRooms(data.filter((room) => room.status !== 'OUT_OF_ORDER' && room.status !== 'MAINTENANCE'));
      })
      .catch(() => setError('Rooms could not be loaded'));
  }, [isOpen]);

  const searchGuests = async () => {
    setError('');
    const response = await apiFetch('/api/v1/guests/search', {
      method: 'POST',
      body: JSON.stringify({ query: guestQuery.trim() }),
    });
    if (!response.ok) {
      setError('Guest search failed');
      return;
    }
    setGuests((await response.json()) as GuestOption[]);
  };

  const payload = () => ({
    guestId,
    roomId,
    checkInDate,
    checkOutDate,
    numberOfGuests: Number(numberOfGuests),
    bookingSource: 'desk',
  });

  const requestQuote = async () => {
    setLoading(true);
    setError('');
    setQuote(null);
    try {
      setQuote(await bookingsApi.quote(payload()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quote failed');
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async () => {
    setLoading(true);
    setError('');
    try {
      await bookingsApi.create(payload());
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/25" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-lg rounded-lg bg-white p-6 shadow">
              <Dialog.Title className="text-lg font-semibold text-gray-900">New booking</Dialog.Title>
              <p className="mt-1 text-sm text-gray-600">
                The server sets the rate, tax, and total. This form cannot type a price.
              </p>

              {error && (
                <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-4 space-y-3">
                <div>
                  <label className="label">Find guest</label>
                  <div className="flex gap-2">
                    <input className="input" value={guestQuery} onChange={(event) => setGuestQuery(event.target.value)} />
                    <button type="button" className="btn btn-primary" onClick={() => void searchGuests()}>
                      Search
                    </button>
                  </div>
                  {guests.length > 0 && (
                    <select className="input mt-2" value={guestId} onChange={(event) => setGuestId(event.target.value)}>
                      <option value="">Select a guest</option>
                      {guests.map((guest) => (
                        <option key={guest.id} value={guest.id}>
                          {guest.firstName} {guest.lastName} ({guest.phone})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="label">Room</label>
                  <select className="input" value={roomId} onChange={(event) => setRoomId(event.target.value)}>
                    <option value="">Select a room</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.roomNumber} {room.type} up to {room.maxOccupancy}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Check in</label>
                    <input className="input" type="date" value={checkInDate} onChange={(event) => setCheckInDate(event.target.value)} />
                  </div>
                  <div>
                    <label className="label">Check out</label>
                    <input className="input" type="date" value={checkOutDate} onChange={(event) => setCheckOutDate(event.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="label">Guests</label>
                  <input className="input" inputMode="numeric" value={numberOfGuests} onChange={(event) => setNumberOfGuests(event.target.value)} />
                </div>

                {quote && (
                  <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
                    <div>{quote.nights} nights at {quote.nightlyRate}</div>
                    <div>Tax {quote.taxAmount}</div>
                    <div className="font-semibold">Total {quote.totalAmount} {quote.currency}</div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button type="button" className="btn" onClick={onClose}>Close</button>
                <button type="button" className="btn" disabled={loading} onClick={() => void requestQuote()}>
                  Quote
                </button>
                <button type="button" className="btn btn-primary" disabled={loading || !quote} onClick={() => void createBooking()}>
                  Confirm
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
