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
  const { user, token, isAuthenticated, loading, logout } = useAuthContext();
  return (
    <div>
      <span data-testid="user">{user ? JSON.stringify(user) : 'null'}</span>
      <span data-testid="token">{token ?? 'null'}</span>
      <span data-testid="isAuthenticated">{String(isAuthenticated)}</span>
      <span data-testid="loading">{String(loading)}</span>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
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
});
