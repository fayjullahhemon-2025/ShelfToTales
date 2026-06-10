import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import AdminSongManager from './AdminSongManager';
import { playlistService } from '../../../lib/api';

vi.mock('../../../lib/api', () => ({
  playlistService: {
    getAll: vi.fn(),
    addSong: vi.fn(),
    deleteSong: vi.fn(),
  },
}));

vi.spyOn(window, 'confirm').mockImplementation(() => true);

describe('AdminSongManager', () => {
  const mockClose = vi.fn();
  const mockUpdated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    playlistService.getAll.mockResolvedValue({ data: [] });
  });

  test('renders modal with title and close button', async () => {
    render(<AdminSongManager onClose={mockClose} onSongsUpdated={mockUpdated} />);
    expect(screen.getByText('Manage Playlist')).toBeInTheDocument();
    expect(screen.getByLabelText('Close')).toBeInTheDocument();
  });

  test('loads songs on mount and displays empty state', async () => {
    render(<AdminSongManager onClose={mockClose} onSongsUpdated={mockUpdated} />);
    await waitFor(() => {
      expect(playlistService.getAll).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText('No songs yet')).toBeInTheDocument();
  });

  test('displays songs in the list', async () => {
    playlistService.getAll.mockResolvedValue({
      data: [
        { id: 1, title: 'Song One', artist: 'Artist A' },
        { id: 2, title: 'Song Two', artist: 'Artist B' },
      ],
    });
    render(<AdminSongManager onClose={mockClose} onSongsUpdated={mockUpdated} />);
    await waitFor(() => {
      expect(screen.getByText('Song One')).toBeInTheDocument();
    });
    expect(screen.getByText('Song Two')).toBeInTheDocument();
    expect(screen.getByText('Current Playlist (2)')).toBeInTheDocument();
  });

  test('calls onClose when close button clicked', () => {
    render(<AdminSongManager onClose={mockClose} onSongsUpdated={mockUpdated} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  test('shows error when uploading without file', async () => {
    render(<AdminSongManager onClose={mockClose} onSongsUpdated={mockUpdated} />);
    const titleInput = screen.getByPlaceholderText('Song title…');
    fireEvent.change(titleInput, { target: { value: 'My Song' } });
    fireEvent.submit(document.querySelector('form'));
    await waitFor(() => {
      expect(screen.getByText('Title and file are required')).toBeInTheDocument();
    });
  });

  test('uploads song successfully', async () => {
    playlistService.addSong.mockResolvedValue({});
    render(<AdminSongManager onClose={mockClose} onSongsUpdated={mockUpdated} />);

    fireEvent.change(screen.getByPlaceholderText('Song title…'), { target: { value: 'New Song' } });
    fireEvent.change(screen.getByPlaceholderText('Artist name…'), { target: { value: 'New Artist' } });

    const fileInput = screen.getByLabelText('Audio file');
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    Object.defineProperty(fileInput, 'files', { value: [file], writable: false });
    fireEvent.change(fileInput);

    fireEvent.submit(document.querySelector('form'));

    await waitFor(() => {
      expect(playlistService.addSong).toHaveBeenCalledTimes(1);
      expect(mockUpdated).toHaveBeenCalled();
    });
  });

  test('deletes song after confirmation', async () => {
    playlistService.getAll.mockResolvedValue({
      data: [{ id: 42, title: 'Delete Me', artist: 'Artist' }],
    });
    playlistService.deleteSong.mockResolvedValue({});

    render(<AdminSongManager onClose={mockClose} onSongsUpdated={mockUpdated} />);

    await waitFor(() => {
      expect(screen.getByText('Delete Me')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Delete Delete Me'));

    await waitFor(() => {
      expect(playlistService.deleteSong).toHaveBeenCalledWith(42);
      expect(mockUpdated).toHaveBeenCalled();
    });
  });

  test('shows upload error from server', async () => {
    playlistService.addSong.mockRejectedValue({
      response: { data: { error: 'File too large' } },
    });

    render(<AdminSongManager onClose={mockClose} onSongsUpdated={mockUpdated} />);

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
