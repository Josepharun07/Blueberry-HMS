import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { api } from '../../lib/api/client';
import { logger } from '../../lib/logging/logger';

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface RoomType {
  id: string;
  name: string;
  basePrice: number;
  maxOccupancy: number;
  description: string;
}

interface Room {
  id: string;
  roomNumber: string;
  status: string;
}

export default function CreateBooking() {
  const navigate = useNavigate();
  
  // Form Steps
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form Data
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  
  // Data Lists
  const [guests, setGuests] = useState<Guest[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  
  // UI State
  const [guestSearch, setGuestSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Calculated Values
  const [numberOfNights, setNumberOfNights] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Fetch guests on mount
  useEffect(() => {
    fetchGuests();
    fetchRoomTypes();
  }, []);

  // Calculate pricing when dates or room type change
  useEffect(() => {
    if (checkInDate && checkOutDate && selectedRoomType) {
      calculatePricing();
    }
  }, [checkInDate, checkOutDate, selectedRoomType]);

  const fetchGuests = async () => {
    try {
      const response = await api.get('/guests');
      setGuests(response.data);
    } catch (err: any) {
      logger.error('Failed to fetch guests', err);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const response = await api.get('/room-types');
      setRoomTypes(response.data);
    } catch (err: any) {
      logger.error('Failed to fetch room types', err);
    }
  };

  const calculatePricing = () => {
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (nights > 0 && selectedRoomType) {
      const sub = selectedRoomType.basePrice * nights;
      const tax = sub * 0.12; // 12% GST
      const total = sub + tax;
      
      setNumberOfNights(nights);
      setSubtotal(sub);
      setTaxAmount(tax);
      setTotalAmount(total);
    }
  };

  const checkAvailability = async () => {
    if (!selectedRoomType || !checkInDate || !checkOutDate) {
      setError('Please select room type and dates');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/bookings/check-availability', {
        roomTypeId: selectedRoomType.id,
        checkInDate,
        checkOutDate,
      });

      if (response.data.available) {
        // Fetch available rooms
        const roomsResponse = await api.get('/rooms', {
          params: {
            roomTypeId: selectedRoomType.id,
            status: 'AVAILABLE',
          },
        });
        setAvailableRooms(roomsResponse.data);
        setCurrentStep(4); // Move to room selection
      } else {
        setError('No rooms available for selected dates');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to check availability');
      logger.error('Availability check failed', err);
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async () => {
    if (!selectedGuest || !selectedRoomType || !selectedRoom) {
      setError('Please complete all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const bookingData = {
        guestId: selectedGuest.id,
        roomTypeId: selectedRoomType.id,
        roomId: selectedRoom.id,
        checkInDate,
        checkOutDate,
        numberOfGuests,
        specialRequests: specialRequests || undefined,
      };

      const response = await api.post('/bookings', bookingData);
      
      logger.info('Booking created successfully', response.data);
      
      // Navigate to bookings list
      navigate('/bookings');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create booking');
      logger.error('Booking creation failed', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredGuests = guests.filter((guest) =>
    `${guest.firstName} ${guest.lastName} ${guest.email} ${guest.phone}`
      .toLowerCase()
      .includes(guestSearch.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Booking</h1>
        <p className="mt-2 text-gray-600">Follow the steps to create a reservation</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'Select Guest' },
            { num: 2, label: 'Choose Room Type' },
            { num: 3, label: 'Select Dates' },
            { num: 4, label: 'Assign Room' },
            { num: 5, label: 'Confirm' },
          ].map((step, idx) => (
            <div key={step.num} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= step.num
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step.num}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">
                {step.label}
              </span>
              {idx < 4 && (
                <div
                  className={`w-16 h-1 mx-4 ${
                    currentStep > step.num ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Step 1: Select Guest */}
      {currentStep === 1 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Select Guest</h2>
          
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={guestSearch}
              onChange={(e) => setGuestSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredGuests.map((guest) => (
              <div
                key={guest.id}
                onClick={() => {
                  setSelectedGuest(guest);
                  setCurrentStep(2);
                }}
                className={`p-4 border rounded-lg cursor-pointer hover:bg-blue-50 ${
                  selectedGuest?.id === guest.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {guest.firstName} {guest.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{guest.email}</p>
                  </div>
                  <p className="text-sm text-gray-500">{guest.phone}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => navigate('/bookings')}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => navigate('/guests/create')}
              className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              + New Guest
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Choose Room Type */}
      {currentStep === 2 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Choose Room Type</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roomTypes.map((roomType) => (
              <div
                key={roomType.id}
                onClick={() => {
                  setSelectedRoomType(roomType);
                  setCurrentStep(3);
                }}
                className={`p-6 border rounded-lg cursor-pointer hover:border-blue-600 ${
                  selectedRoomType?.id === roomType.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <h3 className="text-lg font-semibold text-gray-900">{roomType.name}</h3>
                <p className="text-sm text-gray-600 mt-2">{roomType.description}</p>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-2xl font-bold text-blue-600">
                    ₹{roomType.basePrice.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">per night</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Max Occupancy: {roomType.maxOccupancy} guests
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Select Dates */}
      {currentStep === 3 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Select Dates</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-in Date
              </label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-out Date
              </label>
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                min={checkInDate || format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Guests
            </label>
            <input
              type="number"
              value={numberOfGuests}
              onChange={(e) => setNumberOfGuests(parseInt(e.target.value) || 1)}
              min={1}
              max={selectedRoomType?.maxOccupancy || 10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Price Summary */}
          {numberOfNights > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Price Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    ₹{selectedRoomType?.basePrice.toLocaleString()} × {numberOfNights} nights
                  </span>
                  <span className="text-gray-900">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GST (12%)</span>
                  <span className="text-gray-900">₹{taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-blue-600 text-lg">
                    ₹{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Back
            </button>
            <button
              onClick={checkAvailability}
              disabled={!checkInDate || !checkOutDate || loading}
              className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Checking...' : 'Check Availability'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Assign Room */}
      {currentStep === 4 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Select Room</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {availableRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => {
                  setSelectedRoom(room);
                  setCurrentStep(5);
                }}
                className={`p-6 border-2 rounded-lg cursor-pointer text-center hover:border-blue-600 ${
                  selectedRoom?.id === room.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="text-3xl font-bold text-gray-900">{room.roomNumber}</div>
                <div className="text-sm text-gray-500 mt-2">{room.status}</div>
              </div>
            ))}
          </div>

          {availableRooms.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No rooms available for selected dates
            </p>
          )}

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Confirm */}
      {currentStep === 5 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Confirm Booking</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Guest Details</h3>
              <p className="text-gray-700">
                {selectedGuest?.firstName} {selectedGuest?.lastName}
              </p>
              <p className="text-sm text-gray-600">{selectedGuest?.email}</p>
              <p className="text-sm text-gray-600">{selectedGuest?.phone}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Room Details</h3>
              <p className="text-gray-700">{selectedRoomType?.name}</p>
              <p className="text-sm text-gray-600">Room {selectedRoom?.roomNumber}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Stay Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Check-in:</span>
                  <p className="text-gray-900">{format(new Date(checkInDate), 'PPP')}</p>
                </div>
                <div>
                  <span className="text-gray-600">Check-out:</span>
                  <p className="text-gray-900">{format(new Date(checkOutDate), 'PPP')}</p>
                </div>
                <div>
                  <span className="text-gray-600">Nights:</span>
                  <p className="text-gray-900">{numberOfNights}</p>
                </div>
                <div>
                  <span className="text-gray-600">Guests:</span>
                  <p className="text-gray-900">{numberOfGuests}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Payment Summary</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Subtotal</span>
                  <span className="text-gray-900">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Tax (12%)</span>
                  <span className="text-gray-900">₹{taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-blue-200">
                  <span className="font-semibold text-gray-900">Total Amount</span>
                  <span className="font-bold text-blue-600 text-xl">
                    ₹{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requests (Optional)
              </label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Any special requests or notes..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setCurrentStep(4)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Back
            </button>
            <button
              onClick={createBooking}
              disabled={loading}
              className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}