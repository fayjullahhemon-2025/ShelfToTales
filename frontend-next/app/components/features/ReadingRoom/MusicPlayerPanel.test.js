import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import MusicPlayerPanel from './MusicPlayerPanel';

const mockTogglePlay = vi.fn();
const mockNextTrack = vi.fn();
const mockPrevTrack = vi.fn();
const mockSetVolume = vi.fn();
const mockToggleAmbient = vi.fn();

const defaultLofi = {
  isPlaying: false,
  currentTrack: { title: 'Autumn Rainfall', artist: 'Lofi Girl', coverUrl: '' },
  tracks: [
    { title: 'Autumn Rainfall', artist: 'Lofi Girl' },
    { title: 'Chill Beats', artist: 'Study Vibes' },
  ],
  currentTrackIndex: 0,
  nextTrack: mockNextTrack,
  prevTrack: mockPrevTrack,
  togglePlay: mockTogglePlay,
  volume: 0.5,
  setVolume: mockSetVolume,
  ambientStates: { rain: { active: false }, fire: { active: true } },
  ambientSounds: [
    { id: 'rain', name: 'Rain', icon: 'fa-cloud-rain' },
    { id: 'fire', name: 'Fireplace', icon: 'fa-fire' },
  ],
  toggleAmbient: mockToggleAmbient,
};

vi.mock('../../../contexts/LofiContext', () => ({
  useLofi: () => defaultLofi,
}));

describe('MusicPlayerPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders current track title and artist', () => {
    render(<MusicPlayerPanel isAdmin={false} onOpenAdmin={vi.fn()} />);
    expect(screen.getByText('Autumn Rainfall')).toBeInTheDocument();
    expect(screen.getByText('Lofi Girl')).toBeInTheDocument();
  });

  test('shows Play button when not playing', () => {
    render(<MusicPlayerPanel isAdmin={false} onOpenAdmin={vi.fn()} />);
    expect(screen.getByLabelText('Play')).toBeInTheDocument();
    expect(screen.queryByLabelText('Pause')).not.toBeInTheDocument();
  });

  test('shows Pause button when playing', () => {
    defaultLofi.isPlaying = true;
    render(<MusicPlayerPanel isAdmin={false} onOpenAdmin={vi.fn()} />);
    expect(screen.getByLabelText('Pause')).toBeInTheDocument();
    expect(screen.queryByLabelText('Play')).not.toBeInTheDocument();
    defaultLofi.isPlaying = false;
  });

  test('calls togglePlay when play/pause clicked', () => {
    render(<MusicPlayerPanel isAdmin={false} onOpenAdmin={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Play'));
    expect(mockTogglePlay).toHaveBeenCalledTimes(1);
  });

  test('calls nextTrack and prevTrack', () => {
    render(<MusicPlayerPanel isAdmin={false} onOpenAdmin={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Next track'));
    expect(mockNextTrack).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByLabelText('Previous track'));
    expect(mockPrevTrack).toHaveBeenCalledTimes(1);
  });

  test('shows volume slider with correct value', () => {
    render(<MusicPlayerPanel isAdmin={false} onOpenAdmin={vi.fn()} />);
    const slider = screen.getByLabelText('Volume');
    expect(slider).toHaveValue('0.5');
  });

  test('calls setVolume when volume changes', () => {
    render(<MusicPlayerPanel isAdmin={false} onOpenAdmin={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Volume'), { target: { value: '0.8' } });
    expect(mockSetVolume).toHaveBeenCalledWith(0.8);
  });

  test('renders ambient sound buttons', () => {
    render(<MusicPlayerPanel isAdmin={false} onOpenAdmin={vi.fn()} />);
    expect(screen.getByText('Rain')).toBeInTheDocument();
    expect(screen.getByText('Fireplace')).toBeInTheDocument();
  });

  test('ambient button shows active class when active', () => {
    render(<MusicPlayerPanel isAdmin={false} onOpenAdmin={vi.fn()} />);
    const fireBtn = screen.getByLabelText('Disable Fireplace ambient sound');
    expect(fireBtn.className).toContain('active');
  });

  test('calls toggleAmbient when ambient button clicked', () => {
    render(<MusicPlayerPanel isAdmin={false} onOpenAdmin={vi.fn()} />);
    fireEvent.click(screen.getByText('Rain'));
    expect(mockToggleAmbient).toHaveBeenCalledWith('rain');
  });

  test('shows Manage button only for admins', () => {
    const { rerender } = render(<MusicPlayerPanel isAdmin={false} onOpenAdmin={vi.fn()} />);
    expect(screen.queryByText('Manage')).not.toBeInTheDocument();
    rerender(<MusicPlayerPanel isAdmin={true} onOpenAdmin={vi.fn()} />);
    expect(screen.getByText('Manage')).toBeInTheDocument();
  });

  test('calls onOpenAdmin when Manage clicked', () => {
    const onOpen = vi.fn();
    render(<MusicPlayerPanel isAdmin={true} onOpenAdmin={onOpen} />);
    fireEvent.click(screen.getByText('Manage'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  test('toggles tracklist visibility', () => {
    render(<MusicPlayerPanel isAdmin={false} onOpenAdmin={vi.fn()} />);
    const toggle = screen.getByText(/Playlist/);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.getAllByText('Autumn Rainfall').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Chill Beats')).toBeInTheDocument();
  });

  test('shows "No tracks available" when tracks empty', () => {
    defaultLofi.tracks = [];
    render(<MusicPlayerPanel isAdmin={false} onOpenAdmin={vi.fn()} />);
    fireEvent.click(screen.getByText(/Playlist/));
    expect(screen.getByText('No tracks available')).toBeInTheDocument();
    defaultLofi.tracks = [
      { title: 'Autumn Rainfall', artist: 'Lofi Girl' },
      { title: 'Chill Beats', artist: 'Study Vibes' },
    ];
  });
});
