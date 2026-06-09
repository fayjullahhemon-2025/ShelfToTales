import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import BookGridCard from './BookGridCard';

const sampleBook = {
  id: 42,
  title: 'The Pragmatic Programmer',
  author: 'Andrew Hunt',
  coverUrl: 'https://example.com/cover.jpg',
  price: 19.99,
  categoryName: 'Programming',
  categoryId: 7,
};

describe('BookGridCard', () => {
  test('renders the book title and price', () => {
    render(
      <BookGridCard
        book={sampleBook}
        onAddToWishlist={vi.fn()}
        onAddToCart={vi.fn()}
      />
    );
    expect(screen.getByText('The Pragmatic Programmer')).toBeInTheDocument();
    expect(screen.getByText('$19.99')).toBeInTheDocument();
  });

  test('cover image is lazy-loaded with explicit dimensions', () => {
    render(
      <BookGridCard
        book={sampleBook}
        onAddToWishlist={vi.fn()}
        onAddToCart={vi.fn()}
      />
    );
    const img = screen.getByRole('img', { name: /the pragmatic programmer/i });
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
    expect(img).toHaveAttribute('src', sampleBook.coverUrl);
  });

  test('Add to cart click invokes the handler with the book id', () => {
    const onAddToCart = vi.fn();
    render(
      <BookGridCard
        book={sampleBook}
        onAddToWishlist={vi.fn()}
        onAddToCart={onAddToCart}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    expect(onAddToCart).toHaveBeenCalledTimes(1);
    expect(onAddToCart).toHaveBeenCalledWith(42);
  });

  test('Quick View click invokes the handler with the book object', () => {
    const onQuickView = vi.fn();
    render(
      <BookGridCard
        book={sampleBook}
        onAddToWishlist={vi.fn()}
        onAddToCart={vi.fn()}
        onQuickView={onQuickView}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /quick view/i }));
    expect(onQuickView).toHaveBeenCalledTimes(1);
    expect(onQuickView).toHaveBeenCalledWith(sampleBook);
  });

  test('Wishlist toggle invokes the handler with the book id', () => {
    const onAddToWishlist = vi.fn();
    render(
      <BookGridCard
        book={sampleBook}
        onAddToWishlist={onAddToWishlist}
        onAddToCart={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onAddToWishlist).toHaveBeenCalledWith(42);
  });

  test('renders a category link when categoryAsLink is set', () => {
    render(
      <BookGridCard
        book={sampleBook}
        onAddToWishlist={vi.fn()}
        onAddToCart={vi.fn()}
        categoryAsLink
        categoryHrefBuilder={(b) => `/cat/${b.categoryId}`}
      />
    );
    const link = screen.getByRole('link', { name: 'Programming' });
    expect(link).toHaveAttribute('href', '/cat/7');
  });

  test('falls back to provided fallbackCover when no coverUrl', () => {
    const noCover = { ...sampleBook, coverUrl: undefined, imageUrl: undefined };
    render(
      <BookGridCard
        book={noCover}
        onAddToWishlist={vi.fn()}
        onAddToCart={vi.fn()}
        fallbackCover="https://example.com/placeholder.png"
      />
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/placeholder.png');
  });
});
