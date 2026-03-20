import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../lib/store/authStore';
import { RoomStatusModal } from '../components/rooms/RoomStatusModal';
import { RoomDetailsModal } from '../components/rooms/RoomDetailsModal';

interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  type: string;
  status: string;
  basePrice: string;
  maxOccupancy: number;
  description: string;
  amenities: string[];
  viewType: string;
  isActive: boolean;
}

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All Rooms', color: 'bg-gray-100 text-gray-800' },
  { value: 'AVAILABLE', label: 'Available', color: 'bg-green-100 text-green-800' },
  { value: 'OCCUPIED', label: 'Occupied', color: 'bg-red-100 text-red-800' },
  { value: 'CLEANING', label: 'Cleaning', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'MAINTENANCE', label: 'Maintenance', color: 'bg-orange-100 text-orange-800' },
];

export function Rooms() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const response = await fetch('http://localhost:4000/api/v1/rooms', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch rooms');
      return response.json() as Promise<Room[]>;
    },
  });

  const filteredRooms = useMemo(() => {
    if (!rooms) return [];
    if (statusFilter === 'ALL') return rooms;
    return rooms.filter(room => room.status === statusFilter);
  }, [rooms, statusFilter]);

  const statusCounts = useMemo(() => {
    if (!rooms) return {};
    return rooms.reduce((acc, room) => {
      acc[room.status] = (acc[room.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [rooms]);

  const handleChangeStatus = (room: Room) => {
    setSelectedRoom(room);
    setIsStatusModalOpen(true);
  };

  const handleViewDetails = (room: Room) => {
    setSelectedRoom(room);
    setIsDetailsModalOpen(true);
  };

  const handleStatusChanged = () => {
    queryClient.invalidateQueries({ queryKey: ['rooms'] });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      AVAILABLE: 'bg-green-100 text-green-800',
      OCCUPIED: 'bg-red-100 text-red-800',
      CLEANING: 'bg-yellow-100 text-yellow-800',
      MAINTENANCE: 'bg-orange-100 text-orange-800',
      OUT_OF_ORDER: 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Rooms</h1>
        <button className="btn btn-primary">+ Add Room</button>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {STATUS_FILTERS.map((filter) => {
          const count = filter.value === 'ALL' 
            ? rooms?.length 
            : statusCounts[filter.value] || 0;
          
          return (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === filter.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
              <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filteredRooms.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No rooms found with status: {statusFilter}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Room {room.roomNumber}
                  </h3>
                  <p className="text-sm text-gray-500">Floor {room.floor}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    room.status
                  )}`}
                >
                  {room.status}
                </span>
              </div>

              <div className="space-y-1 text-sm text-gray-600">
                <p>Type: {room.type}</p>
                <p>Capacity: {room.maxOccupancy} guests</p>
                <p className="font-semibold text-gray-900">₹{room.basePrice}/night</p>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleViewDetails(room)}
                  className="flex-1 text-xs py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  View Details
                </button>
                <button
                  onClick={() => handleChangeStatus(room)}
                  className="flex-1 text-xs py-2 px-3 bg-primary-100 text-primary-700 hover:bg-primary-200 rounded"
                >
                  Change Status
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <RoomStatusModal
        room={selectedRoom}
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onStatusChanged={handleStatusChanged}
      />

      <RoomDetailsModal
        room={selectedRoom}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />
    </div>
  );
}
