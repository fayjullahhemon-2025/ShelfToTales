import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import AdminSongManager from './AdminSongManager';
import { roomPlaylistService } from '../../../lib/api';

vi.mock('../../../lib/api', () => ({
  roomPlaylistService: {
    list: vi.fn(),
    addSong: vi.fn(),
    deleteSong: vi.fn(),
  },
}));

vi.spyOn(window, 'confirm').mockImplementation(() => true);

describe('AdminSongManager (per-room)', () => {
  const mockClose = vi.fn();
  const mockUpdated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    roomPlaylistService.list.mockResolvedValue({ data: [] });
  });

  test('renders modal with title and close button', () => {
    render(<AdminSongManager roomId={1} onClose={mockClose} onSongsUpdated={mockUpdated} />);
    expect(screen.getByText('Manage Room Playlist')).toBeInTheDocument();
    expect(screen.getByLabelText('Close')).toBeInTheDocument();
  });

  test('loads room songs on mount and displays empty state', async () => {
    render(<AdminSongManager roomId={1} onClose={mockClose} onSongsUpdated={mockUpdated} />);
    await waitFor(() => {
      expect(roomPlaylistService.list).toHaveBeenCalledWith(1);
    });
    expect(screen.getByText(/No songs yet for this room/i)).toBeInTheDocument();
  });

  test('displays songs in the list', async () => {
    roomPlaylistService.list.mockResolvedValue({
      data: [
        { id: 1, title: 'Song One', artist: 'Artist A' },
        { id: 2, title: 'Song Two', artist: 'Artist B' },
      ],
    });
    render(<AdminSongManager roomId={1} onClose={mockClose} onSongsUpdated={mockUpdated} />);
    await waitFor(() => {
      expect(screen.getByText('Song One')).toBeInTheDocument();
    });
    expect(screen.getByText('Song Two')).toBeInTheDocument();
    expect(screen.getByText('Current Playlist (2)')).toBeInTheDocument();
  });

  test('uploads song to the room', async () => {
    roomPlaylistService.addSong.mockResolvedValue({});
    render(<AdminSongManager roomId={7} onClose={mockClose} onSongsUpdated={mockUpdated} />);

    fireEvent.change(screen.getByPlaceholderText('Song title…'), { target: { value: 'New Song' } });
    fireEvent.change(screen.getByPlaceholderText('Artist name…'), { target: { value: 'New Artist' } });

    const fileInput = screen.getByLabelText('Audio file');
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    Object.defineProperty(fileInput, 'files', { value: [file], writable: false });
    fireEvent.change(fileInput);

    fireEvent.submit(document.querySelector('form'));

    await waitFor(() => {
      expect(roomPlaylistService.addSong).toHaveBeenCalledTimes(1);
      const [roomId, fd] = roomPlaylistService.addSong.mock.calls[0];
      expect(roomId).toBe(7);
      expect(fd).toBeInstanceOf(FormData);
      expect(mockUpdated).toHaveBeenCalled();
    });
  });

  test('deletes song from the room after confirmation', async () => {
    roomPlaylistService.list.mockResolvedValue({
      data: [{ id: 42, title: 'Delete Me', artist: 'Artist' }],
    });
    roomPlaylistService.deleteSong.mockResolvedValue({});

    render(<AdminSongManager roomId={7} onClose={mockClose} onSongsUpdated={mockUpdated} />);

    await waitFor(() => {
      expect(screen.getByText('Delete Me')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Delete Delete Me'));

    await waitFor(() => {
      expect(roomPlaylistService.deleteSong).toHaveBeenCalledWith(7, 42);
      expect(mockUpdated).toHaveBeenCalled();
    });
  });

  test('shows upload error from server', async () => {
    roomPlaylistService.addSong.mockRejectedValue({
      response: { data: { error: 'File too large' } },
    });

    render(<AdminSongManager roomId={1} onClose={mockClose} onSongsUpdated={mockUpdated} />);

    fireEvent.change(screen.getByPlaceholderText('Song title…'), { target: { value: 'Big Song' } });
    const fileInput = screen.getByLabelText('Audio file');
    const file = new File(['audio'], 'big.mp3', { type: 'audio/mpeg' });
    Object.defineProperty(fileInput, 'files', { value: [file], writable: false });
    fireEvent.change(fileInput);

    fireEvent.submit(document.querySelector('form'));

    await waitFor(() => {
      expect(screen.getByText('File too large')).toBeInTheDocument();
    });
  });
});
