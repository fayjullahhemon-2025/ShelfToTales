import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import BooksListViewSidebar from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => '/books-list-view-sidebar',
}));

vi.mock('../lib/api', () => ({
  bookService: {
    getAll: vi.fn().mockResolvedValue({
      data: {
        content: [
          { id: 1, title: 'Sample Book Title 1', author: 'Author One', price: 9.99, coverUrl: '' },
          { id: 2, title: 'Sample Book Title 2', author: 'Author Two', price: 12.99, coverUrl: '' }
        ],
        totalPages: 1,
        totalElements: 2
      }
    }),
  },
  categoryService: {
    getAll: vi.fn().mockResolvedValue({
      data: [
        { id: 1, name: 'Fiction' },
        { id: 2, name: 'Science' }
      ]
    }),
  },
  wishlistService: {
    addToWishlist: vi.fn(),
  }
}));

vi.mock('../hooks/useCart', () => ({
  useCart: () => ({
    addToCart: vi.fn(),
  }),
}));

vi.mock('../components/ClientOnly', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

describe('BooksListViewSidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders and displays retrieved books', async () => {
    render(<BooksListViewSidebar />);
    
    // Wait for the books to load and verify rendering
    await waitFor(() => {
      expect(screen.getByText('Sample Book Title 1')).toBeDefined();
      expect(screen.getByText('Sample Book Title 2')).toBeDefined();
      expect(screen.getByText('Author One')).toBeDefined();
    });
  });
});
