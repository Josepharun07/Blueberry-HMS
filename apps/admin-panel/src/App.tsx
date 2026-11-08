import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Bookings } from './pages/Bookings';
import { Rooms } from './pages/Rooms';
import { Guests } from './pages/Guests';
import { Layout } from './components/layout/Layout';
import { useAuthStore } from './lib/store/authStore';
import { apiFetch } from './lib/api/http';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setSession = useAuthStore((s) => s.setSession);
  const [ready, setReady] = useState(isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      setReady(true);
      return;
    }
    let cancelled = false;
    apiFetch('/api/v1/auth/me')
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) setSession(data.user, data.csrfToken);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, setSession]);

  if (!ready) return null;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/guests" element={<Guests />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
