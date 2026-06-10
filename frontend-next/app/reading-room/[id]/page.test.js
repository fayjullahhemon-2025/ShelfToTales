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

// Mock LofiContext
const mockNextTrack = vi.fn();
const mockPrevTrack = vi.fn();
const mockTogglePlay = vi.fn();
const mockSetVolume = vi.fn();
const mockToggleAmbient = vi.fn();

vi.mock('../../contexts/LofiContext', () => ({
  useLofi: () => ({
    isPlaying: false,
    currentTime: 0,
    duration: 180,
    volume: 0.5,
    currentTrack: { title: "Autumn Rainfall", artist: "Lofi Girl & Study Beats", coverUrl: "" },
    ambientStates: {
      rain: { active: false, volume: 0.5 },
      cafe: { active: false, volume: 0.5 },
      fire: { active: false, volume: 0.5 },
      nature: { active: false, volume: 0.5 },
    },
    ambientSounds: [
      { id: 'rain', name: 'Rain', icon: 'fa-cloud-showers-heavy' },
      { id: 'cafe', name: 'Cafe', icon: 'fa-mug-hot' },
      { id: 'fire', name: 'Fire', icon: 'fa-fire' },
      { id: 'nature', name: 'Nature', icon: 'fa-leaf' }
    ],
    nextTrack: mockNextTrack,
    prevTrack: mockPrevTrack,
    togglePlay: mockTogglePlay,
    setVolume: mockSetVolume,
    toggleAmbient: mockToggleAmbient,
  }),
}));

describe('ReadingRoomDetail Component tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('user', JSON.stringify({ email: 'user@example.com', fullName: 'Test User' }));
    
    // Default mock behavior
    readingRoomService.getMessages.mockResolvedValue({ data: [] });
  });

  test('renders page and elements including Lofi Player', async () => {
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

    // Wait for the room details to load
    await waitFor(() => {
      expect(screen.getByText('Book Lovers Corner')).toBeInTheDocument();
    });

    // Check if Lofi widget elements are rendered
    expect(screen.getByText('Lofi Session')).toBeInTheDocument();
    expect(screen.getByText('Autumn Rainfall')).toBeInTheDocument();
    expect(screen.getByText('Ambient Toggles')).toBeInTheDocument();

    // Verify ambient sounds are present
    expect(screen.getByText(/^Rain$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Cafe$/i)).toBeInTheDocument();

    // Verify button Lofi control triggers
    const ambientBtn = screen.getByText(/^Rain$/i);
    fireEvent.click(ambientBtn);
    expect(mockToggleAmbient).toHaveBeenCalledWith('rain');
  });

  test('Open/Close Reader toggles split screen layout when pdfUrl is present', async () => {
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

    // Wait for the room to render
    await waitFor(() => {
      expect(screen.getByText('Silent Library')).toBeInTheDocument();
    });

    // Expect "Open Reader" button to be visible since pdfUrl is present
    const openReaderBtn = screen.getByText('Open Reader');
    expect(openReaderBtn).toBeInTheDocument();

    // Verify iframe is NOT rendered initially
    expect(screen.queryByTitle('The Great Gatsby')).not.toBeInTheDocument();

    // Click "Open Reader"
    fireEvent.click(openReaderBtn);

    // Verify iframe IS rendered
    await waitFor(() => {
      expect(screen.getByTitle('The Great Gatsby')).toBeInTheDocument();
      expect(screen.getByTitle('The Great Gatsby')).toHaveAttribute('src', 'http://example.com/gatsby.pdf');
    });

    // Button should now say "Close Reader"
    const closeReaderBtn = screen.getByText('Close Reader');
    expect(closeReaderBtn).toBeInTheDocument();

    // Click "Close Reader"
    fireEvent.click(closeReaderBtn);

    // Verify iframe is gone
    await waitFor(() => {
      expect(screen.queryByTitle('The Great Gatsby')).not.toBeInTheDocument();
      expect(screen.getByText('Open Reader')).toBeInTheDocument();
    });
  });
});
