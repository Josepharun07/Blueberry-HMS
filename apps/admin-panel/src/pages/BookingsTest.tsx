import { useEffect, useState } from 'react';
import { useAuthStore } from '../lib/store/authStore';

export function BookingsTest() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) {
      setError('No auth token - please login first');
      return;
    }

    console.log('📡 Fetching bookings with token:', token.substring(0, 20) + '...');

    fetch('http://localhost:4000/api/v1/bookings', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(res => {
        console.log('📥 Response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('✅ Bookings data received:', data);
        setData(data);
      })
      .catch(err => {
        console.error('❌ Error:', err);
        setError(err.message);
      });
  }, [token]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Bookings API Test</h1>
      
      {!token && (
        <div className="bg-yellow-100 border border-yellow-400 p-4 rounded mb-4">
          ⚠️ No token found. Please <a href="/login" className="underline">login</a> first.
        </div>
      )}

      {token && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-4 font-mono text-xs">
          🔑 Token: {token.substring(0, 30)}...
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 p-4 rounded mb-4">
          ❌ {error}
        </div>
      )}

      {data && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Response:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
