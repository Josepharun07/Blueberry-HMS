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
  bedType: string;
  viewType: string;
}

interface Room {
  id: string;
  roomNumber: string;
  floorNumber: number;
  status: string;
}

export default function CreateBooking() {
  const navigate = useNavigate();
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  
  // Data lists
  const [guests, setGuests] = useState<Guest[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  
  // UI state
  const [guestSearch, setGuestSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Calculated values
  const [numberOfNights, setNumberOfNights] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Load initial data
  useEffect(() => {
    fetchGuests();
    fetchRoomTypes();
  }, []);

  // Calculate pricing
  useEffect(() => {
    if (checkInDate && checkOutDate && selectedRoomType) {
      calculatePricing();
    }
  }, [checkInDate, checkOutDate, selectedRoomType]);

  const fetchGuests = async () => {
    try {
      const response = await api.get('/guests');
      setGuests(response.data);
      logger.info('Guests loaded', { count: response.data.length });
    } catch (err: any) {
      logger.error('Failed to fetch guests', err);
      setError('Failed to load guests');
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const response = await api.get('/room-types');
      setRoomTypes(response.data);
      logger.info('Room types loaded', { count: response.data.length });
    } catch (err: any) {
      logger.error('Failed to fetch room types', err);
      setError('Failed to load room types');
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

      logger.info('Availability checked', response.data);

      if (response.data.available) {
        // Fetch available rooms for this room type
        const roomsResponse = await api.get('/rooms', {
          params: {
            status: 'AVAILABLE',
          },
        });
        
        // Filter rooms by room type
        const filtered = roomsResponse.data.filter(
          (room: Room & { roomType: { id: string } }) => 
            room.roomType.id === selectedRoomType.id
        );
        
        setAvailableRooms(filtered);
        
        if (filtered.length > 0) {
          setCurrentStep(4);
        } else {
          setError('No rooms available for selected room type and dates');
        }
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
        checkInDate,
        checkOutDate,
        numberOfGuests,
        specialRequests: specialRequests || undefined,
      };

      const response = await api.post('/bookings', bookingData);
      
      // Assign room to booking
      await api.patch(`/bookings/${response.data.id}/assign-room/${selectedRoom.id}`);
      
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
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Booking</h1>
            <p className="mt-2 text-gray-600">Complete the steps below to create a reservation</p>
          </div>
          <button
            onClick={() => navigate('/bookings')}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'Guest' },
            { num: 2, label: 'Room Type' },
            { num: 3, label: 'Dates' },
            { num: 4, label: 'Room' },
            { num: 5, label: 'Confirm' },
          ].map((step, idx) => (
            <div key={step.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    currentStep >= step.num
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-500'
                  }`}
                >
                  {currentStep > step.num ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="font-semibold">{step.num}</span>
                  )}
                </div>
                <span className={`mt-2 text-xs font-medium ${
                  currentStep >= step.num ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
              </div>
              {idx < 4 && (
                <div className={`h-0.5 flex-1 mx-2 ${
                  currentStep > step.num ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="ml-auto -mx-1.5 -my-1.5 text-red-500 hover:text-red-700"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        
        {/* STEP 1: Select Guest */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Select Guest</h2>
            
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, email, or phone number..."
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredGuests.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No guests found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your search or create a new guest.</p>
                  <div className="mt-6">
                    <button
                      onClick={() => navigate('/guests/create')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      New Guest
                    </button>
                  </div>
                </div>
              ) : (
                filteredGuests.map((guest) => (
                  <div
                    key={guest.id}
                    onClick={() => {
                      setSelectedGuest(guest);
                      setCurrentStep(2);
                    }}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedGuest?.id === guest.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {guest.firstName.charAt(0)}{guest.lastName.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-semibold text-gray-900">
                              {guest.firstName} {guest.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{guest.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{guest.phone}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {guests.length > 0 && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => navigate('/guests/create')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Guest
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Choose Room Type */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Choose Room Type</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {roomTypes.map((roomType) => (
                <div
                  key={roomType.id}
                  onClick={() => {
                    setSelectedRoomType(roomType);
                    setCurrentStep(3);
                  }}
                  className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                    selectedRoomType?.id === roomType.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {selectedRoomType?.id === roomType.id && (
                    <div className="absolute top-4 right-4">
                      <div className="bg-blue-600 rounded-full p-1">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{roomType.name}</h3>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{roomType.description}</p>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span>{roomType.bedType} Bed • {roomType.viewType} View</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Up to {roomType.maxOccupancy} guests</span>
                    </div>
                  </div>
                  
                  <div className="flex items-baseline justify-between pt-4 border-t border-gray-200">
                    <div>
                      <span className="text-3xl font-bold text-blue-600">₹{roomType.basePrice.toLocaleString()}</span>
                      <span className="text-gray-500 ml-2">/ night</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Select Dates */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Select Dates & Guests</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-in Date *
                </label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-out Date *
                </label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  min={checkInDate || format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Guests *
              </label>
              <input
                type="number"
                value={numberOfGuests}
                onChange={(e) => setNumberOfGuests(parseInt(e.target.value) || 1)}
                min={1}
                max={selectedRoomType?.maxOccupancy || 10}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                Maximum occupancy for {selectedRoomType?.name}: {selectedRoomType?.maxOccupancy} guests
              </p>
            </div>

            {/* Price Summary */}
            {numberOfNights > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      ₹{selectedRoomType?.basePrice.toLocaleString()} × {numberOfNights} {numberOfNights === 1 ? 'night' : 'nights'}
                    </span>
                    <span className="text-gray-900 font-medium">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">GST (12%)</span>
                    <span className="text-gray-900 font-medium">₹{taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-blue-300">
                    <span className="text-base font-semibold text-gray-900">Total Amount</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ₹{totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Back
              </button>
              <button
                onClick={checkAvailability}
                disabled={!checkInDate || !checkOutDate || loading}
                className="px-8 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Checking Availability...
                  </span>
                ) : (
                  'Check Availability'
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Select Room */}
        {currentStep === 4 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Select Room Number</h2>
            
            {availableRooms.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No rooms available</h3>
                <p className="mt-1 text-sm text-gray-500">Try different dates or room type</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {availableRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => {
                      setSelectedRoom(room);
                      setCurrentStep(5);
                    }}
                    className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md text-center ${
                      selectedRoom?.id === room.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      {room.roomNumber}
                    </div>
                    <div className="text-xs text-gray-500">Floor {room.floorNumber}</div>
                    <div className="mt-3">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                        Available
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Confirm Booking */}
        {currentStep === 5 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Review & Confirm</h2>
            
            <div className="space-y-6">
              {/* Guest Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Guest Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <p className="text-gray-900 font-medium">{selectedGuest?.firstName} {selectedGuest?.lastName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="text-gray-900 font-medium">{selectedGuest?.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <p className="text-gray-900 font-medium">{selectedGuest?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Room Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Room Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Room Type:</span>
                    <p className="text-gray-900 font-medium">{selectedRoomType?.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Room Number:</span>
                    <p className="text-gray-900 font-medium">{selectedRoom?.roomNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Floor:</span>
                    <p className="text-gray-900 font-medium">{selectedRoom?.floorNumber}</p>
                  </div>
                </div>
              </div>

              {/* Stay Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Stay Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Check-in:</span>
                    <p className="text-gray-900 font-medium">{format(new Date(checkInDate), 'PPP')}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Check-out:</span>
                    <p className="text-gray-900 font-medium">{format(new Date(checkOutDate), 'PPP')}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Number of Nights:</span>
                    <p className="text-gray-900 font-medium">{numberOfNights}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Number of Guests:</span>
                    <p className="text-gray-900 font-medium">{numberOfGuests}</p>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Payment Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Room charges ({numberOfNights} nights)</span>
                    <span className="text-gray-900 font-medium">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">GST (12%)</span>
                    <span className="text-gray-900 font-medium">₹{taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t-2 border-blue-300">
                    <span className="text-lg font-bold text-gray-900">Total Amount</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ₹{totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requests (Optional)
                </label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={4}
                  placeholder="Any special requests or preferences (e.g., early check-in, high floor, extra pillows)..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
              <button
                onClick={() => setCurrentStep(4)}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Back
              </button>
              <button
                onClick={createBooking}
                disabled={loading}
                className="px-8 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Booking...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Confirm Booking
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
