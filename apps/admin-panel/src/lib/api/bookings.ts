import { apiFetch } from './http';
import type { Booking, BookingQuote, CreateBookingDto } from '../../types/booking.types';

async function parse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'Request failed';
    try {
      const body = await response.json();
      if (typeof body?.message === 'string') message = body.message;
      if (Array.isArray(body?.message)) message = body.message.join(', ');
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export const bookingsApi = {
  getAll: async () => parse<Booking[]>(await apiFetch('/api/v1/bookings')),

  getById: async (id: string) => parse<Booking>(await apiFetch(`/api/v1/bookings/${id}`)),

  quote: async (data: CreateBookingDto) =>
    parse<BookingQuote>(
      await apiFetch('/api/v1/bookings/quote', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    ),

  create: async (data: CreateBookingDto) =>
    parse<Booking>(
      await apiFetch('/api/v1/bookings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    ),

  checkIn: async (id: string) =>
    parse<Booking>(await apiFetch(`/api/v1/bookings/${id}/check-in`, { method: 'POST' })),

  checkOut: async (id: string) =>
    parse<Booking>(await apiFetch(`/api/v1/bookings/${id}/check-out`, { method: 'POST' })),

  cancel: async (id: string) =>
    parse<Booking>(await apiFetch(`/api/v1/bookings/${id}/cancel`, { method: 'POST' })),

  recordPayment: async (
    bookingId: string,
    data: { amount: string; paymentMethod: string; reference?: string; notes?: string },
    idempotencyKey: string,
  ) =>
    parse(
      await apiFetch(`/api/v1/bookings/${bookingId}/payments`, {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(data),
      }),
    ),
};

export const bookingActions = {
  checkIn: bookingsApi.checkIn,
  checkOut: bookingsApi.checkOut,
  cancel: bookingsApi.cancel,
};
