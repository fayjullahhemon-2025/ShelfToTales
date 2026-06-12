'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { bookService, categoryService, adminBookService, uploadService, playlistService } from '../../lib/api';
import Swal from 'sweetalert2';
import { FadeIn } from '../../components/common/AnimationUtils';

const emptyForm = {
  title: '', author: '', isbn: '', description: '', coverUrl: '',
  publishedDate: '', categoryId: '', pdfUrl: '', previewAvailable: false,
  price: '', stock: '', moodTags: '',
};

export default function AdminBooksPage() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Lofi states
  const [activeTab, setActiveTab] = useState('books'); // 'books' or 'lofi'
  const [songs, setSongs] = useState([]);
  const [lofiForm, setLofiForm] = useState({ title: '', artist: '' });
  const [lofiFile, setLofiFile] = useState(null);
  const [lofiUploading, setLofiUploading] = useState(false);
  const lofiFileRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [booksRes, catsRes, songsRes] = await Promise.all([
        bookService.getAll(),
        categoryService.getAll(),
        playlistService.getAll(),
      ]);
      setBooks(booksRes.data.content || booksRes.data);
      setCategories(catsRes.data);
      setSongs(songsRes.data || []);
    } catch { /* interceptor handles */ }
    setLoading(false);
  }, []);

  const fetchSongs = useCallback(async () => {
    try {
      const res = await playlistService.getAll();
      setSongs(res.data || []);
    } catch { /* interceptor handles */ }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      let res;
      if (field === 'coverUrl') {
        res = await uploadService.image(file);
      } else if (field === 'pdfUrl') {
        res = await uploadService.pdf(file);
      }
      if (res?.data?.url) {
        setForm(f => ({ ...f, [field]: res.data.url }));
        Swal.fire('Uploaded', `${field === 'coverUrl' ? 'Cover image' : 'PDF file'} uploaded successfully`, 'success');
      }
    } catch (err) {
      Swal.fire('Upload Failed', err.response?.data?.message || 'File upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.coverUrl) {
      Swal.fire('Cover Required', 'Please upload a cover image before saving.', 'warning');
      return;
    }
    const payload = {
      ...form,
      categoryId: Number(form.categoryId),
      price: form.price ? Number(form.price) : null,
      stock: form.stock ? Number(form.stock) : null,
      publishedDate: form.publishedDate || null,
    };
    try {
      if (editingId) {
        await adminBookService.update(editingId, payload);
        Swal.fire('Updated', 'Book updated successfully', 'success');
      } else {
        await adminBookService.create(payload);
        Swal.fire('Created', 'Book created successfully', 'success');
      }
      setForm(emptyForm);
      setEditingId(null);
      fetchData();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const handleEdit = (book) => {
    setEditingId(book.id);
    setForm({
      title: book.title || '', author: book.author || '', isbn: book.isbn || '',
      description: book.description || '', coverUrl: book.coverUrl || '',
      publishedDate: book.publishedDate || '', categoryId: book.categoryId || '',
      pdfUrl: book.pdfUrl || '', previewAvailable: book.previewAvailable || false,
      price: book.price || '', stock: book.stock || '', moodTags: book.moodTags || '',
    });
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete book?', text: 'This cannot be undone.',
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Delete',
    });
    if (result.isConfirmed) {
      try {
        await adminBookService.delete(id);
        Swal.fire('Deleted', '', 'success');
        fetchData();
      } catch (err) {
        Swal.fire('Error', err.response?.data?.message || 'Delete failed', 'error');
      }
    }
  };

  // Lofi Handlers
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
      <h2 className="mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Admin Dashboard</h2>

      <ul className="nav nav-tabs mb-4" role="tablist">
        <li className="nav-item">
          <button
            className={`nav-link fw-bold ${activeTab === 'books' ? 'active' : ''}`}
            onClick={() => setActiveTab('books')}
            style={{ fontSize: '1.05rem', cursor: 'pointer' }}
          >
            📚 Book Catalog
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link fw-bold ${activeTab === 'lofi' ? 'active' : ''}`}
            onClick={() => setActiveTab('lofi')}
            style={{ fontSize: '1.05rem', cursor: 'pointer' }}
          >
            🎵 Lofi Playlist
          </button>
        </li>
      </ul>

      {activeTab === 'books' ? (
        <>
          <form onSubmit={handleSubmit} className="card p-4 mb-4">
            <h5>{editingId ? 'Edit Book' : 'Add New Book'}</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Title *</label>
                <input className="form-control" name="title" value={form.title} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Author *</label>
                <input className="form-control" name="author" value={form.author} onChange={handleChange} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">ISBN</label>
                <input className="form-control" name="isbn" value={form.isbn} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Category *</label>
                <select className="form-select" name="categoryId" value={form.categoryId} onChange={handleChange} required>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Published Date</label>
                <input className="form-control" type="date" name="publishedDate" value={form.publishedDate} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Price</label>
                <input className="form-control" type="number" step="0.01" name="price" value={form.price} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Stock</label>
                <input className="form-control" type="number" name="stock" value={form.stock} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Cover Image <span className="text-danger">*</span></label>
                {form.coverUrl ? (
                  <div className="d-flex align-items-center gap-2">
                    <img src={form.coverUrl} alt="Cover preview" style={{ width: 60, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                    <div>
                      <small className="text-muted d-block" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.coverUrl}</small>
                      <button type="button" className="btn btn-sm btn-outline-danger mt-1" onClick={() => setForm(f => ({ ...f, coverUrl: '' }))}>Remove</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <label className="btn btn-outline-primary btn-sm" style={{ cursor: 'pointer' }}>
                      <i className="fa-solid fa-cloud-arrow-up me-1" /> Upload Cover
                      <input type="file" accept="image/*" className="d-none" onChange={(e) => handleFileUpload(e, 'coverUrl')} disabled={uploading} />
                    </label>
                    <small className="text-danger d-block mt-1">Required — books without a cover won't display properly</small>
                  </>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label">PDF File</label>
                {form.pdfUrl ? (
                  <div className="d-flex align-items-center gap-2">
                    <i className="fa-solid fa-file-pdf fa-2x text-danger" />
                    <div>
                      <small className="text-muted d-block" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.pdfUrl}</small>
                      <button type="button" className="btn btn-sm btn-outline-danger mt-1" onClick={() => setForm(f => ({ ...f, pdfUrl: '' }))}>Remove</button>
                    </div>
                  </div>
                ) : (
                  <label className="btn btn-outline-primary btn-sm" style={{ cursor: 'pointer' }}>
                    <i className="fa-solid fa-cloud-arrow-up me-1" /> Upload PDF
                    <input type="file" accept=".pdf" className="d-none" onChange={(e) => handleFileUpload(e, 'pdfUrl')} disabled={uploading} />
                  </label>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label">Mood Tags</label>
                <input className="form-control" name="moodTags" value={form.moodTags} onChange={handleChange} placeholder="e.g. adventure,mystery" />
              </div>
              <div className="col-12">
                <label className="form-label">Description</label>
                <textarea className="form-control" name="description" rows="3" value={form.description} onChange={handleChange} />
              </div>
              <div className="col-md-3 d-flex align-items-center">
                <input type="checkbox" name="previewAvailable" checked={form.previewAvailable} onChange={handleChange} id="preview" />
                <label htmlFor="preview" className="ms-2">Preview Available</label>
              </div>
            </div>
            <div className="mt-3">
              <button type="submit" className="btn btn-primary me-2">{editingId ? 'Update' : 'Create'}</button>
              {editingId && <button type="button" className="btn btn-secondary" onClick={() => { setForm(emptyForm); setEditingId(null); }}>Cancel</button>}
            </div>
          </form>

          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
                <tr><th>ID</th><th>Title</th><th>Author</th><th>Price</th><th>Stock</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.id}>
                    <td>{b.id}</td><td>{b.title}</td><td>{b.author}</td>
                    <td>${b.price || '—'}</td><td>{b.stock ?? '—'}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(b)}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(b.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
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
      )}
      </FadeIn>
    </div>
  );
}
