import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api/http';

interface Room {
  id: string;
  roomNumber: string;
  type: string;
  status: string;
}

const NEXT_STATUS = ['AVAILABLE', 'CLEANING', 'MAINTENANCE', 'OUT_OF_ORDER'];

export function Housekeeping() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState('');

  const load = async () => {
    const response = await apiFetch('/api/v1/rooms');
    if (!response.ok) {
      setError('Rooms could not be loaded');
      return;
    }
    setRooms((await response.json()) as Room[]);
  };

  useEffect(() => {
    void load();
  }, []);

  const changeStatus = async (room: Room, status: string) => {
    setError('');
    const response = await apiFetch(`/api/v1/rooms/${room.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      setError('That status change was refused');
      return;
    }
    await load();
  };

  const groups = NEXT_STATUS.concat('OCCUPIED').map((status) => ({
    status,
    rooms: rooms.filter((room) => room.status === status),
  }));

  return (
    <div className="p-8">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Housekeeping</h1>
      <p className="mb-6 text-sm text-gray-600">Occupied rooms are released only by checkout.</p>
      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <section key={group.status} className="rounded-lg bg-white p-4 shadow">
            <h2 className="mb-3 font-semibold text-gray-900">{group.status} ({group.rooms.length})</h2>
            {group.rooms.length === 0 && <p className="text-sm text-gray-500">None</p>}
            <ul className="space-y-3">
              {group.rooms.map((room) => (
                <li key={room.id} className="flex items-center justify-between gap-3 text-sm">
                  <span>Room {room.roomNumber} · {room.type}</span>
                  {room.status === 'OCCUPIED' ? (
                    <span className="text-gray-500">Checkout releases this room</span>
                  ) : (
                    <select
                      className="input"
                      value={room.status}
                      onChange={(event) => void changeStatus(room, event.target.value)}
                    >
                      {NEXT_STATUS.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
