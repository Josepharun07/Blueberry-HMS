export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  type: 'STANDARD' | 'DELUXE' | 'SUITE' | 'FAMILY' | 'PRESIDENTIAL';
  status: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE' | 'OUT_OF_ORDER';
  basePrice: string;
  maxOccupancy: number;
  description?: string;
  amenities?: string[];
  viewType?: string;
}

export interface Booking {
  id: string;
  guest: Guest;
  guestId: string;
  room: Room;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  actualCheckInTime?: string;
  actualCheckOutTime?: string;
  roomRate: string;
  numberOfNights: number;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  paidAmount: string;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW';
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED';
  numberOfGuests: number;
  specialRequests?: string;
  internalNotes?: string;
  bookingSource?: string;
  confirmationNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingDto {
  guestId: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  roomRate: number;
  totalAmount: number;
  numberOfGuests: number;
  specialRequests?: string;
  bookingSource?: string;
}