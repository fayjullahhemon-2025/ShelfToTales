'use client';

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CartProvider, useCartContext } from './CartContext';

// Mock the API services used by CartContext.
vi.mock('@/lib/api', () => ({
  cartService: {
    getCart: vi.fn(),
    addToCart: vi.fn(),
    updateQuantity: vi.fn(),
    removeFromCart: vi.fn(),
  },
}));

// Mock useAuthContext — return authenticated by default.
vi.mock('./AuthContext', () => ({
  useAuthContext: vi.fn(() => ({
    isAuthenticated: true,
    loading: false,
  })),
}));

import { cartService } from '@/lib/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal consumer component that surfaces context values for assertions. */
function Consumer() {
  const {
    items,
    count,
    total,
    loading,
    refreshCart,
    addToCart,
    updateQuantity,
    removeFromCart,
  } = useCartContext();

  return (
    <div>
      <span data-testid="items">{JSON.stringify(items)}</span>
      <span data-testid="count">{String(count)}</span>
      <span data-testid="total">{String(total)}</span>
      <span data-testid="loading">{String(loading)}</span>
      <button data-testid="refresh-btn" onClick={() => refreshCart().catch(() => {})}>
        Refresh
      </button>
      <button
        data-testid="add-btn"
        onClick={() => addToCart(1, 2).catch(() => {})}
      >
        Add
      </button>
      <button
        data-testid="update-btn"
        onClick={() => updateQuantity(1, 5).catch(() => {})}
      >
        Update
      </button>
      <button
        data-testid="remove-btn"
        onClick={() => removeFromCart(1).catch(() => {})}
      >
        Remove
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <CartProvider>
      <Consumer />
    </CartProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CartContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock so auto-fetch on mount resolves silently
    cartService.getCart.mockResolvedValue({ data: { items: [], count: 0, total: 0 } });
  });

  it('starts with empty cart', () => {
    renderWithProvider();

    expect(screen.getByTestId('items').textContent).toBe('[]');
    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(screen.getByTestId('total').textContent).toBe('0');
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  it('refreshCart fetches and updates state', async () => {
    const cartPayload = {
      items: [{ bookId: 1, title: 'Dune', quantity: 1, price: 19.99 }],
      totalItems: 1,
      totalPrice: 19.99,
    };
    cartService.getCart.mockResolvedValue({ data: cartPayload });

    renderWithProvider();

    await act(async () => {
      screen.getByTestId('refresh-btn').click();
    });

    expect(cartService.getCart).toHaveBeenCalled();
    expect(screen.getByTestId('items').textContent).toBe(
      JSON.stringify(cartPayload.items),
    );
    expect(screen.getByTestId('count').textContent).toBe('1');
    expect(screen.getByTestId('total').textContent).toBe('19.99');
  });

  it('addToCart calls API and updates state', async () => {
    const cartPayload = {
      items: [{ bookId: 1, title: 'Dune', quantity: 2, price: 19.99 }],
      totalItems: 2,
      totalPrice: 39.98,
    };
    cartService.addToCart.mockResolvedValue({ data: cartPayload });

    renderWithProvider();

    await act(async () => {
      screen.getByTestId('add-btn').click();
    });

    expect(cartService.addToCart).toHaveBeenCalledWith(1, 2);
    expect(screen.getByTestId('items').textContent).toBe(
      JSON.stringify(cartPayload.items),
    );
    expect(screen.getByTestId('count').textContent).toBe('2');
    expect(screen.getByTestId('total').textContent).toBe('39.98');
  });

  it('updateQuantity calls API and updates state', async () => {
    const cartPayload = {
      items: [{ bookId: 1, title: 'Dune', quantity: 5, price: 19.99 }],
      totalItems: 5,
      totalPrice: 99.95,
    };
    cartService.updateQuantity.mockResolvedValue({ data: cartPayload });

    renderWithProvider();

    await act(async () => {
      screen.getByTestId('update-btn').click();
    });

    expect(cartService.updateQuantity).toHaveBeenCalledWith(1, 5);
    expect(screen.getByTestId('items').textContent).toBe(
      JSON.stringify(cartPayload.items),
    );
    expect(screen.getByTestId('count').textContent).toBe('5');
    expect(screen.getByTestId('total').textContent).toBe('99.95');
  });

  it('removeFromCart calls API and updates state', async () => {
    const cartPayload = {
      items: [],
      totalItems: 0,
      totalPrice: 0,
    };
    cartService.removeFromCart.mockResolvedValue({ data: cartPayload });

    renderWithProvider();

    await act(async () => {
      screen.getByTestId('remove-btn').click();
    });

    expect(cartService.removeFromCart).toHaveBeenCalledWith(1);
    expect(screen.getByTestId('items').textContent).toBe('[]');
    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(screen.getByTestId('total').textContent).toBe('0');
  });

  it('resets loading to false when API fails', async () => {
    cartService.getCart.mockRejectedValue(new Error('Network error'));

    renderWithProvider();

    // Initially not loading
    expect(screen.getByTestId('loading').textContent).toBe('false');

    // Trigger an action that will fail; suppress unhandled rejection
    await act(async () => {
      try {
        screen.getByTestId('refresh-btn').click();
      } catch {
        // click handler catches via .catch(() => {})
      }
    });

    // Loading should be reset to false after the failure
    expect(screen.getByTestId('loading').textContent).toBe('false');
    // Cart should remain unchanged
    expect(screen.getByTestId('items').textContent).toBe('[]');
    expect(screen.getByTestId('count').textContent).toBe('0');
  });
});
