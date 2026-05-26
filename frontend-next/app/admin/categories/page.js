'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { categoryService, adminCategoryService } from '../../lib/api';
import Swal from 'sweetalert2';
import { FadeIn } from '../../components/common/AnimationUtils';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoryService.getAll();
      setCategories(res.data);
    } catch { /* interceptor handles */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminCategoryService.update(editingId, form);
        Swal.fire('Updated', 'Category updated', 'success');
      } else {
        await adminCategoryService.create(form);
        Swal.fire('Created', 'Category created', 'success');
      }
      setForm({ name: '', description: '' });
      setEditingId(null);
      fetchData();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setForm({ name: cat.name || '', description: cat.description || '' });
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete category?', text: 'Books in this category may be affected.',
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Delete',
    });
    if (result.isConfirmed) {
      try {
        await adminCategoryService.delete(id);
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
      <h2 className="mb-4">Admin — Category Management</h2>

      <form onSubmit={handleSubmit} className="card p-4 mb-4">
        <h5>{editingId ? 'Edit Category' : 'Add New Category'}</h5>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Name *</label>
            <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="col-md-6">
            <label className="form-label">Description</label>
            <input className="form-control" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        <div className="mt-3">
          <button type="submit" className="btn btn-primary me-2">{editingId ? 'Update' : 'Create'}</button>
          {editingId && <button type="button" className="btn btn-secondary" onClick={() => { setForm({ name: '', description: '' }); setEditingId(null); }}>Cancel</button>}
        </div>
      </form>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Description</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td><td>{c.name}</td><td>{c.description || '—'}</td>
                <td>
                  <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(c)}>Edit</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c.id)}>Delete</button>
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
