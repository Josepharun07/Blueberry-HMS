import { useAuthStore } from '../lib/store/authStore';

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Blueberry HMS</h1>
              <p className="text-sm text-gray-600">
                Welcome, {user?.firstName} {user?.lastName}
              </p>
            </div>
            <button onClick={logout} className="btn btn-primary">
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
          <div className="space-y-4">
            <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
              <p className="font-medium text-success-700">✅ Frontend is working!</p>
              <p className="text-sm text-success-600 mt-1">
                You're successfully logged in and connected to the API.
              </p>
            </div>
            <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <p className="font-medium text-primary-700">Phase 5 Progress</p>
              <ul className="mt-2 space-y-1 text-sm text-primary-600">
                <li>✓ Login system working</li>
                <li>✓ Authentication with JWT</li>
                <li>✓ Basic layout created</li>
                <li>→ Next: Build booking, guest, and room management pages</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
