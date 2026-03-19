import { useEffect, useState } from 'react';
import { useAuthStore } from '../lib/store/authStore';
import { bookingsApi } from '../lib/api/bookings';
import { Booking } from '../types/booking.types';
import { logger } from '../lib/logging/logger';

export function Bookings() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingsApi.getAll();
      setBookings(data);
      logger.info('Bookings loaded', 'Bookings', { count: data.length });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to load bookings';
      setError(errorMsg);
      logger.error('Failed to load bookings', err, 'Bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (id: string) => {
    if (!confirm('Check in this guest?')) return;
    
    try {
      await bookingsApi.checkIn(id);
      logger.info('Guest checked in', 'Bookings', { bookingId: id });
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to check in');
      logger.error('Check-in failed', err, 'Bookings');
    }
  };

  const handleCheckOut = async (id: string) => {
    if (!confirm('Check out this guest?')) return;
    
    try {
      await bookingsApi.checkOut(id);
      logger.info('Guest checked out', 'Bookings', { bookingId: id });
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to check out');
      logger.error('Check-out failed', err, 'Bookings');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      CHECKED_IN: 'bg-green-100 text-green-800',
      CHECKED_OUT: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
      NO_SHOW: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'text-red-600',
      PARTIAL: 'text-orange-600',
      PAID: 'text-green-600',
      REFUNDED: 'text-gray-600',
    };
    return colors[status] || 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Blueberry HMS</h1>
              <p className="text-sm text-gray-600">
                Welcome, {user?.firstName} {user?.lastName}
              </p>
            </div>
            <button onClick={logout} className="btn btn-primary">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <a href="/" className="border-b-2 border-transparent py-4 px-1 text-gray-500 hover:text-gray-700">
              Dashboard
            </a>
            <a href="/bookings" className="border-b-2 border-primary-600 py-4 px-1 text-primary-600 font-medium">
              Bookings
            </a>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">All Bookings</h2>
          <button className="btn btn-primary">
            + New Booking
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">No bookings found</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
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
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.confirmationNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </div>
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
                      <div className="text-sm text-gray-900">
                        {new Date(booking.checkInDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        to {new Date(booking.checkOutDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.numberOfNights} {booking.numberOfNights === 1 ? 'night' : 'nights'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{parseFloat(booking.totalAmount).toLocaleString()}
                      </div>
                      <div className={`text-sm font-medium ${getPaymentColor(booking.paymentStatus)}`}>
                        {booking.paymentStatus}
                      </div>
                      {booking.paymentStatus === 'PARTIAL' && (
                        <div className="text-xs text-gray-500">
                          Paid: ₹{parseFloat(booking.paidAmount).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        {booking.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleCheckIn(booking.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Check In
                          </button>
                        )}
                        {booking.status === 'CHECKED_IN' && (
                          <button
                            onClick={() => handleCheckOut(booking.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Check Out
                          </button>
                        )}
                        <button className="text-primary-600 hover:text-primary-900">
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
