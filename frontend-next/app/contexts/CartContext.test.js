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
      count: 1,
      total: 19.99,
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
      count: 2,
      total: 39.98,
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
});
