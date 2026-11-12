import { useState, type FormEvent } from 'react';
import { apiFetch } from '../lib/api/http';

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city?: string;
  country?: string;
  nationality?: string;
  address?: string;
  idType?: string;
  idNumber?: string;
}

export function Guests() {
  const [query, setQuery] = useState('');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [selected, setSelected] = useState<Guest | null>(null);

  const search = async () => {
    setError('');
    const response = await apiFetch('/api/v1/guests/search', {
      method: 'POST',
      body: JSON.stringify({ query: query.trim() }),
    });
    if (!response.ok) {
      setError('Search failed');
      setGuests([]);
      return;
    }
    setGuests((await response.json()) as Guest[]);
  };

  const createGuest = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const response = await apiFetch('/api/v1/guests', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    if (!response.ok) {
      setError('Guest could not be saved');
      return;
    }
    setForm({ firstName: '', lastName: '', email: '', phone: '' });
    setQuery(form.phone);
  };

  const openGuest = async (guest: Guest) => {
    setError('');
    const response = await apiFetch(`/api/v1/guests/${guest.id}`);
    if (!response.ok) {
      setError('Guest record could not be loaded');
      return;
    }
    setSelected((await response.json()) as Guest);
  };

  const saveIdentity = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setError('');
    const response = await apiFetch(`/api/v1/guests/${selected.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        idType: selected.idType,
        idNumber: selected.idNumber,
        nationality: selected.nationality,
        address: selected.address,
        city: selected.city,
        country: selected.country,
      }),
    });
    if (!response.ok) {
      setError('Identity could not be saved');
      return;
    }
    setSelected((await response.json()) as Guest);
  };

  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Guests</h1>
      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={(event) => void createGuest(event)} className="mb-8 grid gap-3 rounded-lg bg-white p-4 shadow md:grid-cols-5">
        <input className="input" placeholder="First name" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} required />
        <input className="input" placeholder="Last name" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} required />
        <input className="input" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        <input className="input" placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required />
        <button className="btn btn-primary" type="submit">Add guest</button>
      </form>

      <div className="mb-4 flex gap-2">
        <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, or phone" />
        <button className="btn btn-primary" type="button" onClick={() => void search()}>Search</button>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {guests.map((guest) => (
              <tr key={guest.id}>
                <td className="px-6 py-4 text-sm text-gray-900">{guest.firstName} {guest.lastName}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{guest.phone}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{guest.email}</td>
                <td className="px-6 py-4 text-right text-sm">
                  <button type="button" className="text-primary-600" onClick={() => void openGuest(guest)}>Identity</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <form onSubmit={(event) => void saveIdentity(event)} className="mt-6 grid gap-3 rounded-lg bg-white p-4 shadow md:grid-cols-2">
          <h2 className="md:col-span-2 text-lg font-semibold text-gray-900">
            Identity for {selected.firstName} {selected.lastName}
          </h2>
          <p className="md:col-span-2 text-sm text-gray-600">Check-in is refused until an identity type and number are saved.</p>
          <input className="input" placeholder="ID type" value={selected.idType ?? ''} onChange={(event) => setSelected({ ...selected, idType: event.target.value })} />
          <input className="input" placeholder="ID number" value={selected.idNumber ?? ''} onChange={(event) => setSelected({ ...selected, idNumber: event.target.value })} />
          <input className="input" placeholder="Nationality" value={selected.nationality ?? ''} onChange={(event) => setSelected({ ...selected, nationality: event.target.value })} />
          <input className="input" placeholder="City" value={selected.city ?? ''} onChange={(event) => setSelected({ ...selected, city: event.target.value })} />
          <input className="input" placeholder="Country" value={selected.country ?? ''} onChange={(event) => setSelected({ ...selected, country: event.target.value })} />
          <input className="input" placeholder="Address" value={selected.address ?? ''} onChange={(event) => setSelected({ ...selected, address: event.target.value })} />
          <div className="md:col-span-2">
            <button className="btn btn-primary" type="submit">Save identity</button>
          </div>
        </form>
      )}
    </div>
  );
}
