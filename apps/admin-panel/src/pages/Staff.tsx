import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch } from '../lib/api/http';
import { useAuthStore } from '../lib/store/authStore';
import { roleAtLeast } from '../lib/roles';

interface StaffUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
}

const ROLES = ['FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE', 'KITCHEN', 'MANAGER', 'OWNER'];

export function Staff() {
  const role = useAuthStore((s) => s.user?.role);
  const canCreate = roleAtLeast(role, 'OWNER');
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'FRONT_DESK',
  });

  const load = async () => {
    const response = await apiFetch('/api/v1/users');
    if (!response.ok) {
      setError('Staff could not be loaded');
      return;
    }
    setStaff((await response.json()) as StaffUser[]);
  };

  useEffect(() => {
    void load();
  }, []);

  const createStaff = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const response = await apiFetch('/api/v1/users', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    if (!response.ok) {
      setError('The account could not be created. Use a password of at least 12 characters with upper case, lower case, and a number.');
      return;
    }
    setForm({ firstName: '', lastName: '', email: '', password: '', role: 'FRONT_DESK' });
    await load();
  };

  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Staff</h1>
      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {canCreate && (
        <form onSubmit={(event) => void createStaff(event)} className="mb-8 grid gap-3 rounded-lg bg-white p-4 shadow md:grid-cols-3">
          <input className="input" required placeholder="First name" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
          <input className="input" required placeholder="Last name" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
          <input className="input" required type="email" placeholder="Work email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <input className="input" required type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          <select className="input" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
            {ROLES.map((item) => <option key={item} value={item}>{item}</option>)}
            {role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">SUPER_ADMIN</option>}
          </select>
          <button className="btn btn-primary" type="submit">Create account</button>
        </form>
      )}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {staff.map((person) => (
              <tr key={person.id}>
                <td className="px-6 py-4 text-sm text-gray-900">{person.firstName} {person.lastName}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{person.email}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{person.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
