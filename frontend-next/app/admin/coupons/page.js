'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { adminCouponService } from '../../lib/api';
import Swal from 'sweetalert2';
import { FadeIn } from '../../components/common/AnimationUtils';

const emptyForm = { code: '', type: 'PERCENTAGE', value: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', expiresAt: '' };

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminCouponService.getAll();
      setCoupons(res.data);
    } catch { /* interceptor handles */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.value) { Swal.fire('Error', 'Code and value are required', 'warning'); return; }
    setSaving(true);
    const payload = {
      ...form,
      value: parseFloat(form.value),
      minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : 0,
      maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
      usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
      expiresAt: form.expiresAt || null,
    };
    try {
      if (editingId) {
        await adminCouponService.update(editingId, { ...payload, active: true });
        Swal.fire({ icon: 'success', title: 'Coupon updated!', timer: 1500, showConfirmButton: false });
      } else {
        await adminCouponService.create(payload);
        Swal.fire({ icon: 'success', title: 'Coupon created!', timer: 1500, showConfirmButton: false });
      }
      setForm(emptyForm);
      setEditingId(null);
      fetchCoupons();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Operation failed', 'error');
    } finally { setSaving(false); }
  };

  const handleEdit = (c) => {
    setEditingId(c.id);
    setForm({
      code: c.code || '', type: c.type || 'PERCENTAGE', value: c.value ?? '',
      minOrderAmount: c.minOrderAmount ?? '', maxDiscount: c.maxDiscount ?? '',
      usageLimit: c.usageLimit ?? '', expiresAt: c.expiresAt ? c.expiresAt.slice(0, 16) : '',
    });
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete coupon?', text: 'This cannot be undone.',
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Delete',
    });
    if (result.isConfirmed) {
      try {
        await adminCouponService.delete(id);
        Swal.fire('Deleted', '', 'success');
        fetchCoupons();
      } catch (err) {
        Swal.fire('Error', err.response?.data?.message || 'Delete failed', 'error');
      }
    }
  };

  if (loading) return <div className="container py-5"><p>Loading...</p></div>;

  return (
    <div className="container-fluid py-4 px-4">
      <FadeIn>
      <h2 className="fw-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Coupon Management</h2>

      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16, maxWidth: 700 }}>
        <div className="card-body p-4">
          <h5 className="fw-bold mb-3">{editingId ? 'Edit Coupon' : 'Create New Coupon'}</h5>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-bold">Code</label>
                <input type="text" className="form-control" name="code" value={form.code} onChange={handleChange} placeholder="SAVE20" required/>
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold">Type</label>
                <select className="form-select" name="type" value={form.type} onChange={handleChange}>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
                  <option value="FREE_SHIPPING">Free Shipping</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold">Value</label>
                <input type="number" className="form-control" name="value" value={form.value} onChange={handleChange} placeholder={form.type === 'PERCENTAGE' ? '20' : '5.00'} required/>
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold">Min Order Amount</label>
                <input type="number" className="form-control" name="minOrderAmount" value={form.minOrderAmount} onChange={handleChange} placeholder="0"/>
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold">Max Discount</label>
                <input type="number" className="form-control" name="maxDiscount" value={form.maxDiscount} onChange={handleChange} placeholder="No limit"/>
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold">Usage Limit</label>
                <input type="number" className="form-control" name="usageLimit" value={form.usageLimit} onChange={handleChange} placeholder="Unlimited"/>
              </div>
              <div className="col-12">
                <label className="form-label small fw-bold">Expires At</label>
                <input type="datetime-local" className="form-control" name="expiresAt" value={form.expiresAt} onChange={handleChange}/>
              </div>
            </div>
            <div className="mt-3 d-flex gap-2">
              <button type="submit" className="btn btn-dark rounded-pill px-4" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update Coupon' : 'Create Coupon'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => { setForm(emptyForm); setEditingId(null); }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <div className="card-body p-4">
          <h5 className="fw-bold mb-3">All Coupons</h5>
          {coupons.length === 0 ? (
            <p className="text-muted">No coupons found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th>ID</th><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Usage</th><th>Expires</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(c => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td><strong>{c.code}</strong></td>
                      <td>{c.type}</td>
                      <td>{c.type === 'PERCENTAGE' ? `${c.value}%` : c.type === 'FIXED_AMOUNT' ? `$${c.value}` : 'Free'}</td>
                      <td>${c.minOrderAmount || 0}</td>
                      <td>{c.usedCount ?? 0}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                      <td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(c)}>Edit</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      </FadeIn>
    </div>
  );
}
