import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import BookPreviewPanel from './BookPreviewPanel';

describe('BookPreviewPanel', () => {
  const mockRoom = {
    id: 1,
    name: 'Book Lovers Corner',
    description: 'A cozy reading spot.',
    bookTitle: 'The Great Gatsby',
    pdfUrl: 'http://example.com/gatsby.pdf',
    createdBy: { fullName: 'Alice' },
    createdAt: '2025-01-15T10:30:00Z',
  };

  test('renders nothing when room is null', () => {
    const { container } = render(<BookPreviewPanel room={null} onOpenReader={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  test('renders book title and Open Reader button when pdfUrl exists', () => {
    render(<BookPreviewPanel room={mockRoom} onOpenReader={vi.fn()} />);
    expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
    expect(screen.getByText('Open Reader')).toBeInTheDocument();
  });

  test('calls onOpenReader when Open Reader is clicked', () => {
    const onOpen = vi.fn();
    render(<BookPreviewPanel room={mockRoom} onOpenReader={onOpen} />);
    screen.getByText('Open Reader').click();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  test('does not show Open Reader when pdfUrl is missing', () => {
    const room = { ...mockRoom, pdfUrl: null };
    render(<BookPreviewPanel room={room} onOpenReader={vi.fn()} />);
    expect(screen.queryByText('Open Reader')).not.toBeInTheDocument();
  });

  test('shows "No book selected" when bookTitle is falsy', () => {
    const room = { ...mockRoom, bookTitle: '' };
    render(<BookPreviewPanel room={room} onOpenReader={vi.fn()} />);
    expect(screen.getByText('No book selected for this room')).toBeInTheDocument();
  });

  test('renders room name and description', () => {
    render(<BookPreviewPanel room={mockRoom} onOpenReader={vi.fn()} />);
    expect(screen.getByText('Book Lovers Corner')).toBeInTheDocument();
    expect(screen.getByText('A cozy reading spot.')).toBeInTheDocument();
  });

  test('renders createdBy name', () => {
    render(<BookPreviewPanel room={mockRoom} onOpenReader={vi.fn()} />);
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
  });

  test('renders createdAt date', () => {
    render(<BookPreviewPanel room={mockRoom} onOpenReader={vi.fn()} />);
    expect(screen.getByText(/1\/15\/2025/)).toBeInTheDocument();
  });

  test('shows "Unknown" when createdBy is missing', () => {
    const room = { ...mockRoom, createdBy: null };
    render(<BookPreviewPanel room={room} onOpenReader={vi.fn()} />);
    expect(screen.getByText(/Unknown/)).toBeInTheDocument();
  });
});
