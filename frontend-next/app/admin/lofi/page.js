'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { playlistService } from '../../lib/api';
import Swal from 'sweetalert2';
import { FadeIn } from '../../components/common/AnimationUtils';

export default function AdminLofiPage() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lofiForm, setLofiForm] = useState({ title: '', artist: '' });
  const [lofiFile, setLofiFile] = useState(null);
  const [lofiUploading, setLofiUploading] = useState(false);
  const lofiFileRef = useRef(null);

  const fetchSongs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await playlistService.getAll();
      setSongs(res.data || []);
    } catch { /* interceptor handles */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSongs(); }, [fetchSongs]);

  const handleLofiUpload = async (e) => {
    e.preventDefault();
    if (!lofiFile || !lofiForm.title.trim()) {
      Swal.fire('Required Fields', 'Title and audio file are required', 'warning');
      return;
    }
    setLofiUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', lofiFile);
      fd.append('title', lofiForm.title.trim());
      fd.append('artist', lofiForm.artist.trim());
      
      await playlistService.addSong(fd);
      Swal.fire('Uploaded', 'Lofi track uploaded successfully to R2 and added to playlist', 'success');
      
      setLofiForm({ title: '', artist: '' });
      setLofiFile(null);
      if (lofiFileRef.current) lofiFileRef.current.value = '';
      
      fetchSongs();
    } catch (err) {
      Swal.fire('Upload Failed', err.response?.data?.message || 'Failed to upload lofi track', 'error');
    } finally {
      setLofiUploading(false);
    }
  };

  const handleLofiDelete = async (id, title) => {
    const result = await Swal.fire({
      title: `Delete '${title}'?`,
      text: 'This will remove the song from the playlist and delete the audio file from R2.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#ef4444'
    });
    if (result.isConfirmed) {
      try {
        await playlistService.deleteSong(id);
        Swal.fire('Deleted', 'Track removed', 'success');
        fetchSongs();
      } catch (err) {
        Swal.fire('Error', 'Failed to delete track', 'error');
      }
    }
  };

  if (loading) return <div className="container py-5"><p>Loading...</p></div>;

  return (
    <div className="container py-5">
      <FadeIn>
      <h2 className="mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Lofi Music Management</h2>

      <div className="row">
        <div className="col-lg-5">
          <form onSubmit={handleLofiUpload} className="card p-4 mb-4 shadow-sm border-0" style={{ borderRadius: '16px' }}>
            <h5 className="fw-bold mb-3">Add Lofi Track</h5>
            <p className="text-muted small">Select an audio file (e.g. .mp3) to upload it to Cloudflare R2 storage and add it to the global community lofi playlist.</p>
            
            <div className="mb-3">
              <label className="form-label fw-bold small">Track Title *</label>
              <input
                className="form-control"
                value={lofiForm.title}
                onChange={(e) => setLofiForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Autumn Rainfall"
                required
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label fw-bold small">Artist / Creator</label>
              <input
                className="form-control"
                value={lofiForm.artist}
                onChange={(e) => setLofiForm(f => ({ ...f, artist: e.target.value }))}
                placeholder="e.g. Lofi Girl"
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label fw-bold small">Audio File (.mp3, .wav, .m4a) *</label>
              <input
                type="file"
                className="form-control"
                ref={lofiFileRef}
                accept="audio/*"
                onChange={(e) => setLofiFile(e.target.files?.[0] || null)}
                required
              />
            </div>
            
            <button type="submit" className="btn btn-primary w-100 py-2 fw-bold" disabled={lofiUploading}>
              {lofiUploading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Uploading to R2...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-cloud-arrow-up me-2" /> Upload Track
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="col-lg-7">
          <div className="card p-4 shadow-sm border-0" style={{ borderRadius: '16px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">Current Global Playlist</h5>
              <span className="badge bg-dark rounded-pill px-3 py-2">{songs.length} tracks</span>
            </div>
            
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Artist</th>
                    <th>Preview</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {songs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-4">No lofi tracks in the playlist yet.</td>
                    </tr>
                  ) : (
                    songs.map((song) => (
                      <tr key={song.id}>
                        <td>
                          <strong>{song.title}</strong>
                        </td>
                        <td>
                          <span className="text-muted">{song.artist || 'Unknown'}</span>
                        </td>
                        <td>
                          <audio src={song.fileUrl} controls className="w-100" style={{ maxHeight: '30px', maxWidth: '200px' }} />
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleLofiDelete(song.id, song.title)}
                            title="Delete Track"
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      </FadeIn>
    </div>
  );
}
