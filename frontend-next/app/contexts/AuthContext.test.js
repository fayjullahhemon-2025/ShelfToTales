'use client';

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuthContext } from './AuthContext';

// Mock the API services used by AuthContext.
vi.mock('@/lib/api', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    googleAuth: vi.fn(),
  },
  userService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

import { authService, userService } from '@/lib/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal consumer component that surfaces context values for assertions. */
function Consumer() {
  const { user, token, isAuthenticated, loading, logout, login, googleAuth, updateProfile } =
    useAuthContext();
  return (
    <div>
      <span data-testid="user">{user ? JSON.stringify(user) : 'null'}</span>
      <span data-testid="token">{token ?? 'null'}</span>
      <span data-testid="isAuthenticated">{String(isAuthenticated)}</span>
      <span data-testid="loading">{String(loading)}</span>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
      <button
        data-testid="login-btn"
        onClick={() => login('alice@test.com', 'pass123').catch(() => {})}
      >
        Login
      </button>
      <button
        data-testid="google-btn"
        onClick={() => googleAuth('google-id-token').catch(() => {})}
      >
        Google
      </button>
      <button
        data-testid="update-profile-btn"
        onClick={() => updateProfile({ id: 1, name: 'Updated', email: 'alice@test.com' })}
      >
        Update
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('starts with no auth when localStorage is empty', async () => {
    renderWithProvider();

    // Wait for the initial loading phase to finish (effect fires, sets loading=false).
    await act(async () => {});

    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('token').textContent).toBe('null');
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  it('restores auth from localStorage on mount', async () => {
    const storedUser = { id: 1, name: 'Alice', email: 'alice@test.com' };
    const storedToken = 'jwt-abc';
    localStorage.setItem('user', JSON.stringify(storedUser));
    localStorage.setItem('token', storedToken);

    renderWithProvider();

    // Let the init effect resolve.
    await act(async () => {});

    expect(screen.getByTestId('user').textContent).toBe(
      JSON.stringify(storedUser),
    );
    expect(screen.getByTestId('token').textContent).toBe(storedToken);
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  it('logout clears state and localStorage', async () => {
    // Pre-populate so the component boots authenticated.
    const storedUser = { id: 1, name: 'Alice', email: 'alice@test.com' };
    localStorage.setItem('user', JSON.stringify(storedUser));
    localStorage.setItem('token', 'jwt-abc');

    renderWithProvider();

    // Let init settle.
    await act(async () => {});
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');

    // Click logout.
    await act(async () => {
      screen.getByTestId('logout-btn').click();
    });

    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('token').textContent).toBe('null');
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('login fetches profile, dispatches, and persists to localStorage', async () => {
    const fakeUser = { id: 1, name: 'Alice', email: 'alice@test.com' };
    authService.login.mockResolvedValue({ data: { token: 'login-jwt' } });
    userService.getProfile.mockResolvedValue({ data: fakeUser });

    renderWithProvider();
    await act(async () => {}); // settle init

    await act(async () => {
      screen.getByTestId('login-btn').click();
    });

    expect(authService.login).toHaveBeenCalledWith({
      email: 'alice@test.com',
      password: 'pass123',
    });
    expect(userService.getProfile).toHaveBeenCalled();
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
    expect(screen.getByTestId('user').textContent).toBe(JSON.stringify(fakeUser));
    expect(screen.getByTestId('token').textContent).toBe('login-jwt');
    expect(localStorage.getItem('token')).toBe('login-jwt');
    expect(localStorage.getItem('user')).toBe(JSON.stringify(fakeUser));
  });

  it('googleAuth fetches profile, dispatches, and persists to localStorage', async () => {
    const fakeUser = { id: 2, name: 'Bob', email: 'bob@test.com' };
    authService.googleAuth.mockResolvedValue({ data: { token: 'google-jwt' } });
    userService.getProfile.mockResolvedValue({ data: fakeUser });

    renderWithProvider();
    await act(async () => {}); // settle init

    await act(async () => {
      screen.getByTestId('google-btn').click();
    });

    expect(authService.googleAuth).toHaveBeenCalledWith('google-id-token');
    expect(userService.getProfile).toHaveBeenCalled();
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
    expect(screen.getByTestId('user').textContent).toBe(JSON.stringify(fakeUser));
    expect(screen.getByTestId('token').textContent).toBe('google-jwt');
    expect(localStorage.getItem('token')).toBe('google-jwt');
    expect(localStorage.getItem('user')).toBe(JSON.stringify(fakeUser));
  });

  it('updateProfile updates localStorage and state', async () => {
    const storedUser = { id: 1, name: 'Alice', email: 'alice@test.com' };
    localStorage.setItem('user', JSON.stringify(storedUser));
    localStorage.setItem('token', 'jwt-abc');

    renderWithProvider();
    await act(async () => {}); // settle init

    await act(async () => {
      screen.getByTestId('update-profile-btn').click();
    });

    const expected = { id: 1, name: 'Updated', email: 'alice@test.com' };
    expect(screen.getByTestId('user').textContent).toBe(JSON.stringify(expected));
    expect(localStorage.getItem('user')).toBe(JSON.stringify(expected));
  });

  it('cleans up token when profile fetch fails during login', async () => {
    authService.login.mockResolvedValue({ data: { token: 'bad-jwt' } });
    userService.getProfile.mockRejectedValue(new Error('Network error'));

    renderWithProvider();
    await act(async () => {}); // settle init

    await act(async () => {
      try {
        screen.getByTestId('login-btn').click();
      } catch {
        // The click itself won't throw; the promise rejection is handled inside.
      }
    });

    // Let the rejected promise settle.
    await act(async () => {});

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
  });
});
