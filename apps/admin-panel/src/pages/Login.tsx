import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api/http';
import { useAuthStore } from '../lib/store/authStore';
import { logger } from '../lib/logging/logger';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    logger.info('Login attempt', 'Login');

    try {
      const response = await apiFetch('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      setSession(data.user, data.csrfToken);

      logger.info('Login successful', 'Login');
      navigate('/');
    } catch (err: any) {
      const errorMsg = err.message || 'Login failed';
      setError(errorMsg);
      logger.error('Login failed', err, 'Login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full card">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-lg mx-auto flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">B</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Blueberry HMS</h2>
          <p className="text-gray-600 mt-2">Staff sign in</p>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Work email"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" disabled={loading} className="w-full btn btn-primary py-3">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
