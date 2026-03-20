import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

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

interface RoomDetailsModalProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RoomDetailsModal({ room, isOpen, onClose }: RoomDetailsModalProps) {
  if (!room) return null;

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

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                <div className="bg-primary-600 px-6 py-4 text-white">
                  <Dialog.Title className="text-xl font-semibold">
                    Room {room.roomNumber}
                  </Dialog.Title>
                  <p className="text-sm text-primary-100 mt-1">
                    Floor {room.floor} - {room.type}
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Current Status</h3>
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(room.status)}`}>
                        {room.status}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Active</h3>
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        room.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {room.isActive ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Room Information</h3>
                    <dl className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-xs text-gray-500">Room Type</dt>
                        <dd className="text-sm font-medium text-gray-900 mt-1">{room.type}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Max Occupancy</dt>
                        <dd className="text-sm font-medium text-gray-900 mt-1">{room.maxOccupancy} guests</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Base Price</dt>
                        <dd className="text-sm font-medium text-gray-900 mt-1">₹{room.basePrice} / night</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">View Type</dt>
                        <dd className="text-sm font-medium text-gray-900 mt-1">{room.viewType || 'Not specified'}</dd>
                      </div>
                    </dl>
                  </div>

                  {room.description && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        {room.description}
                      </p>
                    </div>
                  )}

                  {room.amenities && room.amenities.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Amenities</h3>
                      <div className="flex flex-wrap gap-2">
                        {room.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    onClick={onClose}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700"
                  >
                    Edit Room
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
