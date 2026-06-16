import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import ShopDetail from './page';
import { bookService } from '../../lib/api';

vi.mock('../../hooks/useCart', () => ({
  useCart: () => ({ addToCart: vi.fn().mockResolvedValue({}), removeFromCart: vi.fn() }),
}));

vi.mock('../../lib/api', () => ({
  bookService: {
    getById: vi.fn(),
    getSimilar: vi.fn().mockResolvedValue({ data: [] }),
  },
  wishlistService: { addToWishlist: vi.fn().mockResolvedValue({}) },
  reviewService: {
    getByBookId: vi.fn().mockResolvedValue({ data: [] }),
    addReview: vi.fn(),
  },
  reviewCommentService: {
    getByReviewId: vi.fn().mockResolvedValue({ data: [] }),
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockSwal = vi.fn();
vi.mock('sweetalert2', () => ({
  default: Object.assign(vi.fn(), { fire: (...args) => mockSwal(...args) }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ id: '12' }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('../../components/features/NewsLetter', () => ({ default: () => null }));
vi.mock('../../components/features/ReportButton', () => ({ default: () => null }));
vi.mock('../../components/features/Review/ReviewCard', () => ({ default: () => null }));

const baseBook = {
  id: 12, title: 'abc', author: 'dse', price: 12, stock: 2, coverUrl: '', description: 'd',
  category: { name: 'Self-help' },
};

describe('ShopDetail stock guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bookService.getById.mockResolvedValue({ data: baseBook });
  });

  test('+ button is disabled when count reaches stock', async () => {
    render(<ShopDetail />);
    await waitFor(() => screen.getByText(/Only 2 in stock/i));
    const plusBtn = document.querySelector('.btn-plus');
    expect(plusBtn).toBeTruthy();
    fireEvent.click(plusBtn); // 1 -> 2 (== stock)
    expect(plusBtn).toBeDisabled();
  });

  test('shows "Only N in stock" hint when stock <= 5', async () => {
    render(<ShopDetail />);
    await waitFor(() => {
      expect(screen.getByText(/Only 2 in stock/i)).toBeInTheDocument();
    });
  });

  test('shows "Out of stock" and disables cart button when stock = 0', async () => {
    bookService.getById.mockResolvedValue({ data: { ...baseBook, stock: 0 } });
    render(<ShopDetail />);
    await waitFor(() => {
      expect(screen.getAllByText(/Out of stock/i).length).toBeGreaterThan(0);
    });
    const addToCart = screen.getAllByRole('button').find(b => /Add to cart|Out of stock/.test(b.textContent || ''));
    expect(addToCart).toBeDisabled();
  });

  test('+ click when count is below stock increments', async () => {
    render(<ShopDetail />);
    await waitFor(() => screen.getByText(/Only 2 in stock/i));
    const input = document.querySelector('.quantity-input');
    expect(input.value).toBe('1');
    const plusBtn = document.querySelector('.btn-plus');
    fireEvent.click(plusBtn);
    expect(input.value).toBe('2');
  });

  test('does not let count go below 1', async () => {
    render(<ShopDetail />);
    await waitFor(() => screen.getByText(/Only 2 in stock/i));
    const minusBtn = document.querySelector('.btn-minus');
    fireEvent.click(minusBtn);
    const input = document.querySelector('.quantity-input');
    expect(input.value).toBe('1');
  });
});
