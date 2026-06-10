import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import ReadingRoomDetail from './page';
import { readingRoomService } from '../../lib/api';

// Mock next/navigation
const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
  replace: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: '1' }),
}));

// Mock api service
vi.mock('../../lib/api', () => ({
  readingRoomService: {
    getAll: vi.fn(),
    getMessages: vi.fn(),
  },
}));

// Mock LofiContext (used by MusicPlayerPanel internally)
vi.mock('../../contexts/LofiContext', () => ({
  useLofi: () => ({
    isPlaying: false,
    currentTime: 0,
    duration: 180,
    volume: 0.5,
    currentTrack: { title: 'Autumn Rainfall', artist: 'Lofi Girl & Study Beats', coverUrl: '' },
    ambientStates: {},
    ambientSounds: [],
    nextTrack: vi.fn(),
    prevTrack: vi.fn(),
    togglePlay: vi.fn(),
    setVolume: vi.fn(),
    toggleAmbient: vi.fn(),
  }),
}));

describe('ReadingRoomDetail Component tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('user', JSON.stringify({ email: 'user@example.com', fullName: 'Test User' }));

    readingRoomService.getMessages.mockResolvedValue({ data: [] });
  });

  test('renders page with 2-column layout and room details', async () => {
    readingRoomService.getAll.mockResolvedValue({
      data: [
        {
          id: 1,
          name: 'Book Lovers Corner',
          description: 'A cozy corner to read and discuss books.',
          bookTitle: 'The Great Gatsby',
          pdfUrl: 'http://example.com/gatsby.pdf'
        }
      ]
    });

    render(<ReadingRoomDetail />);

    await waitFor(() => {
      expect(screen.getAllByText('Book Lovers Corner').length).toBeGreaterThanOrEqual(1);
    });

    // Book title appears in header meta and BookPreviewPanel
    expect(screen.getAllByText('The Great Gatsby').length).toBe(2);

    // Book preview panel renders the room name
    const roomNames = screen.getAllByText('Book Lovers Corner');
    expect(roomNames.length).toBe(2);

    // Open Reader button in BookPreviewPanel
    expect(screen.getByText('Open Reader')).toBeInTheDocument();

    // Chat input
    expect(screen.getByPlaceholderText('Type a message…')).toBeInTheDocument();
  });

  test('Open Reader shows PDF iframe overlay', async () => {
    readingRoomService.getAll.mockResolvedValue({
      data: [
        {
          id: 1,
          name: 'Silent Library',
          description: 'Reading room with PDF.',
          bookTitle: 'The Great Gatsby',
          pdfUrl: 'http://example.com/gatsby.pdf'
        }
      ]
    });

    render(<ReadingRoomDetail />);

    await waitFor(() => {
      expect(screen.getAllByText('Silent Library').length).toBeGreaterThanOrEqual(1);
    });

    // Click Open Reader in BookPreviewPanel
    const openReaderBtn = screen.getByText('Open Reader');
    fireEvent.click(openReaderBtn);

    // Verify iframe IS rendered
    await waitFor(() => {
      expect(screen.getByTitle('The Great Gatsby')).toBeInTheDocument();
      expect(screen.getByTitle('The Great Gatsby')).toHaveAttribute('src', 'http://example.com/gatsby.pdf');
    });

    // Close via the overlay close button
    const closeBtn = screen.getByLabelText('Close reader');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByTitle('The Great Gatsby')).not.toBeInTheDocument();
      expect(screen.getByText('Open Reader')).toBeInTheDocument();
    });
  });
});
