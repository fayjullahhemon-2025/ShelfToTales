'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { roomPlaylistService } from '../../../lib/api';

export default function AdminSongManager({ roomId, onClose, onSongsUpdated }) {
  const [songs, setSongs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const loadSongs = useCallback(async () => {
    if (!roomId) return;
    try {
      const res = await roomPlaylistService.list(roomId);
      setSongs(res.data || []);
    } catch {
      setError('Failed to load songs');
    }
  }, [roomId]);

  useEffect(() => { loadSongs(); }, [loadSongs]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!roomId || !file || !title.trim()) {
      setError('Title and file are required');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', title.trim());
      fd.append('artist', artist.trim());
      await roomPlaylistService.addSong(roomId, fd);
      setTitle('');
      setArtist('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      await loadSongs();
      onSongsUpdated?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!roomId) return;
    if (!confirm('Remove this song from the room playlist?')) return;
    try {
      await roomPlaylistService.deleteSong(roomId, id);
      await loadSongs();
      onSongsUpdated?.();
    } catch {
      setError('Failed to delete song');
    }
  };

  return (
    <div className="rp-admin-overlay" role="dialog" aria-label="Manage room playlist">
      <div className="rp-admin-modal">
        <div className="rp-admin-header">
          <h3>Manage Room Playlist</h3>
          <button onClick={onClose} className="rp-admin-close" aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <form onSubmit={handleUpload} className="rp-admin-form">
          <div className="rp-admin-field">
            <label htmlFor="song-title">Title</label>
            <input
              id="song-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Song title…"
              required
            />
          </div>
          <div className="rp-admin-field">
            <label htmlFor="song-artist">Artist</label>
            <input
              id="song-artist"
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist name…"
            />
          </div>
          <div className="rp-admin-field">
            <label htmlFor="song-file">Audio file</label>
            <input
              id="song-file"
              type="file"
              ref={fileRef}
              accept="audio/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>
          {error && <p className="rp-admin-error" role="alert">{error}</p>}
          <button type="submit" disabled={uploading} className="rp-admin-upload-btn">
            {uploading ? 'Uploading…' : 'Upload Song'}
          </button>
        </form>

        <div className="rp-admin-list">
          <h4>Current Playlist ({songs.length})</h4>
          {songs.length === 0 ? (
            <p className="rp-admin-empty">No songs yet for this room</p>
          ) : (
            songs.map((song) => (
              <div key={song.id} className="rp-admin-song">
                <div className="rp-admin-song-info">
                  <span className="rp-admin-song-title">{song.title}</span>
                  <span className="rp-admin-song-artist">{song.artist || 'Unknown'}</span>
                </div>
                <button
                  onClick={() => handleDelete(song.id)}
                  className="rp-admin-delete-btn"
                  aria-label={`Delete ${song.title}`}
                >
                  <i className="fa-solid fa-trash" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
