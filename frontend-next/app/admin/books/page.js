'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { bookService, categoryService, adminBookService } from '../../lib/api';
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [booksRes, catsRes] = await Promise.all([
        bookService.getAll(), categoryService.getAll(),
      ]);
      setBooks(booksRes.data.content || booksRes.data);
      setCategories(catsRes.data);
    } catch { /* interceptor handles */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  if (loading) return <div className="container py-5"><p>Loading...</p></div>;

  return (
    <div className="container py-5">
      <FadeIn>
      <h2 className="mb-4">Admin — Book Management</h2>

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
            <label className="form-label">Cover URL</label>
            <input className="form-control" name="coverUrl" value={form.coverUrl} onChange={handleChange} />
          </div>
          <div className="col-md-6">
            <label className="form-label">PDF URL</label>
            <input className="form-control" name="pdfUrl" value={form.pdfUrl} onChange={handleChange} />
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
        <table className="table table-striped">
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
      </FadeIn>
    </div>
  );
}
