import axios from 'axios';
import { getApiUrl } from './config';
import { Booking, CreateBookingDto } from '../../types/booking.types';

const getAuthHeader = () => {
  const token = localStorage.getItem('auth-storage');
  if (!token) return {};
  
  try {
    const parsed = JSON.parse(token);
    return {
      Authorization: `Bearer ${parsed.state.token}`,
    };
  } catch {
    return {};
  }
};

export const bookingsApi = {
  getAll: async () => {
    const response = await axios.get<Booking[]>(
      getApiUrl('/bookings'),
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await axios.get<Booking>(
      getApiUrl(`/bookings/${id}`),
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  create: async (data: CreateBookingDto) => {
    const response = await axios.post<Booking>(
      getApiUrl('/bookings'),
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  checkIn: async (id: string) => {
    const response = await axios.post<Booking>(
      getApiUrl(`/bookings/${id}/check-in`),
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  checkOut: async (id: string) => {
    const response = await axios.post<Booking>(
      getApiUrl(`/bookings/${id}/check-out`),
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  cancel: async (id: string) => {
    const response = await axios.post<Booking>(
      getApiUrl(`/bookings/${id}/cancel`),
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  },
};
