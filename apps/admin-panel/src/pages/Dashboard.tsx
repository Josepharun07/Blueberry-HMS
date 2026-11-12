import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api/http';
import { useAuthStore } from '../lib/store/authStore';
import { roleAtLeast } from '../lib/roles';

interface Movement {
  bookingId: string;
  confirmationNumber: string;
  roomNumber: string;
  guestName: string;
}

interface DeskReport {
  date: string;
  arrivalsDue: number;
  departuresDue: number;
  inHouse: number;
  occupiedRooms: number;
  sellableRooms: number;
  cleaningRooms: number;
  occupancyPercent: string;
  receivedToday: string;
  arrivals: Movement[];
  departures: Movement[];
}

export function Dashboard() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const user = useAuthStore((s) => s.user);
  const [report, setReport] = useState<DeskReport | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roleAtLeast(user?.role, 'FRONT_DESK')) return;
    apiFetch('/api/v1/reports/desk')
      .then(async (response) => {
        if (!response.ok) {
          setError('The desk report could not be loaded');
          return;
        }
        setReport((await response.json()) as DeskReport);
      })
      .catch(() => setError('The desk report could not be loaded'));
  }, [user?.role]);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Desk</h1>
          <p className="text-sm text-gray-600">{report ? report.date : 'Today'} · {user?.firstName}</p>
        </div>
        <button
          className="btn"
          onClick={() => {
            void apiFetch('/api/v1/auth/logout', { method: 'POST' }).finally(clearSession);
          }}
        >
          Log out
        </button>
      </div>

      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {user && !roleAtLeast(user.role, 'FRONT_DESK') && (
        <p className="text-sm text-gray-600">Room status is on the housekeeping board.</p>
      )}

      {report && (
        <>
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <Figure label="Arrivals due" value={String(report.arrivalsDue)} />
            <Figure label="Departures due" value={String(report.departuresDue)} />
            <Figure label="In house" value={String(report.inHouse)} />
            <Figure label="Received today" value={`₹${report.receivedToday}`} />
            <Figure label="Occupied" value={`${report.occupiedRooms} / ${report.sellableRooms}`} />
            <Figure label="Occupancy" value={`${report.occupancyPercent}%`} />
            <Figure label="Cleaning" value={String(report.cleaningRooms)} />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <MovementList title="Arrivals" rows={report.arrivals} />
            <MovementList title="Departures" rows={report.departures} />
          </div>
        </>
      )}
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function MovementList({ title, rows }: { title: string; rows: Movement[] }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">{title}</h2>
      {rows.length === 0 && <p className="text-sm text-gray-500">None</p>}
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.bookingId} className="text-sm text-gray-800">
            Room {row.roomNumber} · {row.guestName} · {row.confirmationNumber}
          </li>
        ))}
      </ul>
    </div>
  );
}
