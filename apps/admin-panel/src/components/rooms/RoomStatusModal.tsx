import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface Room {
  id: string;
  roomNumber: string;
  status: string;
}

interface RoomStatusModalProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChanged: () => void;
}

const ROOM_STATUSES = [
  { value: 'AVAILABLE', label: 'Available', color: 'bg-green-100 text-green-800' },
  { value: 'OCCUPIED', label: 'Occupied', color: 'bg-red-100 text-red-800' },
  { value: 'CLEANING', label: 'Cleaning', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'MAINTENANCE', label: 'Maintenance', color: 'bg-orange-100 text-orange-800' },
  { value: 'OUT_OF_ORDER', label: 'Out of Order', color: 'bg-gray-100 text-gray-800' },
];

export function RoomStatusModal({ room, isOpen, onClose, onStatusChanged }: RoomStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState(room?.status || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!room) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth-storage');
      if (!token) throw new Error('No authentication token');

      const parsed = JSON.parse(token);

      const response = await fetch(`http://localhost:4000/api/v1/rooms/${room.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${parsed.state.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: selectedStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }

      onStatusChanged();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update room status');
    } finally {
      setLoading(false);
    }
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                <div className="bg-primary-600 px-6 py-4 text-white">
                  <Dialog.Title className="text-lg font-semibold">
                    Update Room Status
                  </Dialog.Title>
                  <p className="text-sm text-primary-100 mt-1">
                    Room {room.roomNumber}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select New Status
                    </label>
                    {ROOM_STATUSES.map((status) => (
                      <label
                        key={status.value}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedStatus === status.value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="status"
                          value={status.value}
                          checked={selectedStatus === status.value}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          className="mr-3"
                        />
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || selectedStatus === room.status}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      {loading ? 'Updating...' : 'Update Status'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
