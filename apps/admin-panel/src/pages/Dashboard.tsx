import { useState } from 'react';
import { apiFetch } from '../lib/api/http';
import { useAuthStore } from '../lib/store/authStore';
import { logger } from '../lib/logging/logger';

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [triggerError, setTriggerError] = useState(false);

  if (triggerError) {
    throw new Error('Test error from Dashboard - Error Boundary working!');
  }

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
            <button
              onClick={() => {
                void apiFetch('/api/v1/auth/logout', { method: 'POST' }).finally(clearSession);
              }}
              className="btn btn-primary"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Status Card */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">System Status</h2>
            <div className="space-y-4">
              <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
                <p className="font-medium text-success-700">✅ Logging System Active</p>
                <p className="text-sm text-success-600 mt-1">
                  All actions are being logged and tracked
                </p>
              </div>
              <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <p className="font-medium text-primary-700">📝 Features Enabled</p>
                <ul className="mt-2 space-y-1 text-sm text-primary-600">
                  <li>✓ Backend: HTTP, Error, Audit logging</li>
                  <li>✓ Frontend: console logging in development</li>
                  <li>✓ Error boundary for crash protection</li>
                  <li>✓ Daily log file rotation</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Test Logging Card */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🧪 Test Logging System</h2>
            <p className="text-sm text-gray-600 mb-4">
              Open DevTools (F12) → Console tab to see colored logs
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  logger.info('Test info message from Dashboard', 'Dashboard', { 
                    timestamp: new Date().toISOString() 
                  });
                }}
                className="btn btn-primary w-full"
              >
                ✅ Test Info Log (Green)
              </button>
              
              <button
                onClick={() => {
                  logger.warn('Test warning message', 'Dashboard', { 
                    reason: 'Just testing' 
                  });
                }}
                className="btn btn-secondary w-full"
              >
                ⚠️ Test Warning (Orange)
              </button>
              
              <button
                onClick={() => {
                  logger.error(
                    'Test error message', 
                    new Error('This is a test error'), 
                    'Dashboard'
                  );
                }}
                className="btn btn-secondary w-full"
              >
                ❌ Test Error Log (Red)
              </button>
              
              <button
                onClick={() => setTriggerError(true)}
                className="btn btn-secondary w-full bg-red-100 text-red-700 hover:bg-red-200 border-red-300"
              >
                💥 Test Error Boundary (Crash Page)
              </button>
              
              <button
                onClick={() => {
                  const logs = logger.getLogs();
                  console.log('📊 Stored Logs:', logs);
                  console.table(logs);
                  alert(`Found ${logs.length} stored logs. Check console!`);
                }}
                className="btn btn-secondary w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-300"
              >
                📊 View Stored Logs (Console)
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
