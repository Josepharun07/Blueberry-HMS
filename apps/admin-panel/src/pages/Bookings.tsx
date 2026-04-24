import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../lib/store/authStore';
import type { Booking } from '../types/booking.types';
import { bookingActions } from '../lib/api/bookings';
import { BookingDetailsModal } from '../components/bookings/BookingDetailsModal';
import { PaymentModal } from '../components/bookings/PaymentModal';

export function Bookings() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const { data: bookings, isLoading, error } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const response = await fetch('http://localhost:4000/api/v1/bookings', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return response.json() as Promise<Booking[]>;
    },
  });

  const checkInMutation = useMutation({
    mutationFn: bookingActions.checkIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setActionLoading(null);
    },
    onError: (error: Error) => {
      alert(`Check-in failed: ${error.message}`);
      setActionLoading(null);
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: bookingActions.checkOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setActionLoading(null);
    },
    onError: (error: Error) => {
      alert(`Check-out failed: ${error.message}`);
      setActionLoading(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: bookingActions.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setActionLoading(null);
    },
    onError: (error: Error) => {
      alert(`Cancellation failed: ${error.message}`);
      setActionLoading(null);
    },
  });

  const handleCheckIn = (id: string) => {
    if (confirm('Check in this guest?')) {
      setActionLoading(id);
      checkInMutation.mutate(id);
    }
  };

  const handleCheckOut = (id: string) => {
    if (confirm('Check out this guest? This will finalize the booking.')) {
      setActionLoading(id);
      checkOutMutation.mutate(id);
    }
  };

  const handleCancel = (id: string, confirmationNumber: string) => {
    if (confirm(`Cancel booking ${confirmationNumber}? This action cannot be undone.`)) {
      setActionLoading(id);
      cancelMutation.mutate(id);
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDetailsModalOpen(true);
  };

  const handleRecordPayment = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentRecorded = () => {
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      CONFIRMED: 'bg-blue-100 text-blue-800',
      CHECKED_IN: 'bg-green-100 text-green-800',
      CHECKED_OUT: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentBadge = (status: string) => {
    const colors = {
      PAID: 'bg-green-100 text-green-800',
      PARTIAL: 'bg-yellow-100 text-yellow-800',
      PENDING: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          Error loading bookings: {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header with New Booking Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage reservations and guest check-ins
          </p>
        </div>
        <button 
          onClick={() => navigate('/bookings/create')}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors duration-150"
        >
          <svg 
            className="-ml-1 mr-2 h-5 w-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 4v16m8-8H4" 
            />
          </svg>
          New Booking
        </button>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Confirmation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Guest
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Room
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Check-in / Check-out
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings?.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {booking.confirmationNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {booking.guest.firstName} {booking.guest.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{booking.guest.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    Room {booking.room.roomNumber}
                  </div>
                  <div className="text-sm text-gray-500">{booking.room.type}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{booking.checkInDate}</div>
                  <div className="text-sm text-gray-500">{booking.checkOutDate}</div>
                  <div className="text-xs text-gray-400">{booking.numberOfNights} nights</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(booking.status)}`}>
                    {booking.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentBadge(booking.paymentStatus)}`}>
                    {booking.paymentStatus}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    ₹{booking.paidAmount} / ₹{booking.totalAmount}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ₹{booking.totalAmount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex flex-col gap-1 items-end">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleViewDetails(booking)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        View
                      </button>
                      {booking.paymentStatus !== 'PAID' && booking.status !== 'CANCELLED' && (
                        <button 
                          onClick={() => handleRecordPayment(booking)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Payment
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {booking.status === 'CONFIRMED' && (
                        <button 
                          onClick={() => handleCheckIn(booking.id)}
                          disabled={actionLoading === booking.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          {actionLoading === booking.id ? 'Processing...' : 'Check In'}
                        </button>
                      )}
                      {booking.status === 'CHECKED_IN' && (
                        <button 
                          onClick={() => handleCheckOut(booking.id)}
                          disabled={actionLoading === booking.id}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                        >
                          {actionLoading === booking.id ? 'Processing...' : 'Check Out'}
                        </button>
                      )}
                      {(booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN') && (
                        <button 
                          onClick={() => handleCancel(booking.id, booking.confirmationNumber)}
                          disabled={actionLoading === booking.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {actionLoading === booking.id ? 'Processing...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {bookings?.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new booking.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/bookings/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Booking
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />

      <PaymentModal
        booking={selectedBooking}
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentRecorded={handlePaymentRecorded}
      />
    </div>
  );
}