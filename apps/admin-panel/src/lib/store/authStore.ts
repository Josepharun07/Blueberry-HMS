import { create } from 'zustand';
import { setCsrfToken } from '../api/http';

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  user: SessionUser | null;
  isAuthenticated: boolean;
  setSession: (user: SessionUser, csrfToken: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  setSession: (user, csrfToken) => {
    setCsrfToken(csrfToken);
    set({ user, isAuthenticated: true });
  },
  clearSession: () => {
    setCsrfToken(null);
    set({ user: null, isAuthenticated: false });
  },
}));
