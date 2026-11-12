import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch } from '../lib/api/http';

interface Property {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  gstin?: string;
}

export function PropertySettings() {
  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    apiFetch('/api/v1/property/active')
      .then(async (response) => {
        if (response.status === 404) {
          setError('No active property record yet');
          return;
        }
        if (!response.ok) {
          setError('Property settings could not be loaded');
          return;
        }
        setProperty((await response.json()) as Property);
      })
      .catch(() => setError('Property settings could not be loaded'));
  }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!property) return;
    setSaved('');
    setError('');
    const response = await apiFetch(`/api/v1/property/${property.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: property.name,
        phone: property.phone,
        email: property.email,
        city: property.city,
      }),
    });
    if (!response.ok) {
      setError('The property could not be saved');
      return;
    }
    setSaved('Saved');
  };

  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Property</h1>
      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {saved && <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{saved}</div>}
      {property && (
        <form onSubmit={(event) => void save(event)} className="max-w-lg space-y-3 rounded-lg bg-white p-4 shadow">
          <label className="label">Name</label>
          <input className="input" value={property.name} onChange={(event) => setProperty({ ...property, name: event.target.value })} />
          <label className="label">Phone</label>
          <input className="input" value={property.phone ?? ''} onChange={(event) => setProperty({ ...property, phone: event.target.value })} />
          <label className="label">Email</label>
          <input className="input" value={property.email ?? ''} onChange={(event) => setProperty({ ...property, email: event.target.value })} />
          <label className="label">City</label>
          <input className="input" value={property.city ?? ''} onChange={(event) => setProperty({ ...property, city: event.target.value })} />
          <p className="text-sm text-gray-600">The bill name and GSTIN come from PROPERTY_LEGAL_NAME and PROPERTY_GSTIN.</p>
          <button className="btn btn-primary" type="submit">Save</button>
        </form>
      )}
    </div>
  );
}
