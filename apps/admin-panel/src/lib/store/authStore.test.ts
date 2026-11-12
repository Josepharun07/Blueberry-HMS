import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
    });
    localStorage.clear();
  });

  it('starts signed out and does not store a token', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('keeps the session in memory', () => {
    const mockUser = {
      id: '1',
      email: 'staff@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'FRONT_DESK',
    };

    useAuthStore.getState().setSession(mockUser, 'csrf-token');

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('clears the session on logout', () => {
    useAuthStore.getState().setSession(
      { id: '1', email: 'staff@example.com', firstName: 'Test', lastName: 'User', role: 'FRONT_DESK' },
      'csrf-token',
    );
    useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
