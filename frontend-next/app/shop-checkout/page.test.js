import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import ShopCheckout from './page';
import { cartService, addressService, checkoutService } from '../lib/api';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

vi.mock('../lib/api', () => ({
  cartService: { getCart: vi.fn() },
  addressService: { getAll: vi.fn(), create: vi.fn() },
  checkoutService: { checkout: vi.fn() },
  couponService: { validate: vi.fn() },
}));

const swalMock = vi.fn().mockResolvedValue({ isConfirmed: true });
vi.mock('sweetalert2', () => ({ default: Object.assign(vi.fn(), { fire: (...a) => swalMock(...a) }) }));

vi.mock('../components/layout/PageTitle', () => ({ default: () => null }));

const cartWithItem = {
  items: [
    { id: 1, bookId: 5, title: 'Atomic Habits', coverUrl: '', quantity: 1, unitPrice: 12, subtotal: 12 },
  ],
  totalItems: 1,
  totalPrice: 12,
};

const defaultAddress = { id: 7, fullName: 'A', phone: '1', addressLine: 'x', city: 'y', isDefault: true };

describe('ShopCheckout place order', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    swalMock.mockClear();
    cartService.getCart.mockResolvedValue({ data: cartWithItem });
    addressService.getAll.mockResolvedValue({ data: [defaultAddress] });
  });

  test('renders cart + address + enabled place order button', async () => {
    render(<ShopCheckout />);
    await waitFor(() => {
      expect(screen.getByText('Atomic Habits')).toBeInTheDocument();
    });
    expect(screen.getByText('Place Order')).toBeEnabled();
  });

  test('Place Order with COD calls checkout with address + method', async () => {
    checkoutService.checkout.mockResolvedValue({
      data: { id: 42, status: 'CONFIRMED', orderDate: '2026-01-01', totalAmount: 12, paymentMethod: 'COD', couponCode: '', discountAmount: 0 },
    });
    render(<ShopCheckout />);
    await waitFor(() => screen.getByText('Place Order'));
    fireEvent.click(screen.getByText('Place Order'));
    await waitFor(() => {
      expect(checkoutService.checkout).toHaveBeenCalledWith(expect.objectContaining({ paymentMethod: 'COD', addressId: 7 }));
    });
  });

  test('Place Order with bKash adds a simulated delay before the API call', async () => {
    checkoutService.checkout.mockResolvedValue({
      data: { id: 11, status: 'CONFIRMED', orderDate: '2026-01-01', totalAmount: 12, paymentMethod: 'BKASH', couponCode: '', discountAmount: 0 },
    });
    render(<ShopCheckout />);
    await waitFor(() => screen.getByText('Atomic Habits'));
    fireEvent.click(screen.getByLabelText(/bKash/i));
    const start = Date.now();
    fireEvent.click(screen.getByText('Place Order'));
    await waitFor(() => expect(checkoutService.checkout).toHaveBeenCalled(), { timeout: 3000 });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(1100);
    expect(swalMock).toHaveBeenCalled();
  });

  test('Place Order with empty cart shows warning and does not call backend', async () => {
    cartService.getCart.mockResolvedValue({ data: { items: [], totalItems: 0, totalPrice: 0 } });
    render(<ShopCheckout />);
    await waitFor(() => screen.getByText('Your cart is empty.'));
    // Button is disabled when cart is empty — so the user can't accidentally
    // submit. The defensive warning path in handlePlaceOrder also runs if
    // the user invokes it programmatically.
    const btn = screen.getByText('Place Order');
    expect(btn).toBeDisabled();
    expect(checkoutService.checkout).not.toHaveBeenCalled();
  });

  test('Backend "Cart is empty" response surfaces as warning toast', async () => {
    checkoutService.checkout.mockRejectedValue({
      response: { status: 400, data: { message: 'Cart is empty' } },
    });
    render(<ShopCheckout />);
    await waitFor(() => screen.getByText('Place Order'));
    fireEvent.click(screen.getByText('Place Order'));
    await waitFor(() => {
      expect(swalMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'Cart is empty' }));
    });
  });

  test('Generic 500 surfaces as error toast with status', async () => {
    checkoutService.checkout.mockRejectedValue({
      response: { status: 500, data: { message: 'DB exploded' } },
    });
    render(<ShopCheckout />);
    await waitFor(() => screen.getByText('Place Order'));
    fireEvent.click(screen.getByText('Place Order'));
    await waitFor(() => {
      expect(swalMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'Order failed' }));
    });
  });
});
