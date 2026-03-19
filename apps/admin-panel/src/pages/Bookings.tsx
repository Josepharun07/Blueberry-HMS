import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../lib/store/authStore';
import type { Booking } from '../types/booking.types';

export function Bookings() {
  const token = useAuthStore((s) => s.token);

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
          ❌ Error loading bookings: {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
        <button className="btn btn-primary">
          + New Booking
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Confirmation #
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
                  <button className="text-primary-600 hover:text-primary-900 mr-3">
                    View
                  </button>
                  {booking.status === 'CONFIRMED' && (
                    <button className="text-green-600 hover:text-green-900">
                      Check In
                    </button>
                  )}
                  {booking.status === 'CHECKED_IN' && (
                    <button className="text-blue-600 hover:text-blue-900">
                      Check Out
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {bookings?.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No bookings found. Create your first booking to get started.
        </div>
      )}
    </div>
  );
}
