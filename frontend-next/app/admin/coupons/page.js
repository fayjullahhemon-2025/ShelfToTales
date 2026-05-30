'use client';
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { adminCouponService } from '../../lib/api';
import Swal from 'sweetalert2';

export default function AdminCouponsPage() {
  const [form, setForm] = useState({ code: '', type: 'PERCENTAGE', value: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', expiresAt: '' });
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.code || !form.value) { Swal.fire('Error', 'Code and value are required', 'warning'); return; }
    setCreating(true);
    try {
      await adminCouponService.create({ ...form, value: parseFloat(form.value), minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : 0, maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null, usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null, expiresAt: form.expiresAt || null });
      Swal.fire({ icon: 'success', title: 'Coupon created!', timer: 1500, showConfirmButton: false });
      setForm({ code: '', type: 'PERCENTAGE', value: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', expiresAt: '' });
    } catch (e) { Swal.fire('Error', e.response?.data?.message || 'Failed to create coupon', 'error'); }
    finally { setCreating(false); }
  };

  return (
    <div className="container-fluid py-4 px-4">
      <h2 className="fw-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Coupon Management</h2>
      <div className="card border-0 shadow-sm" style={{ borderRadius: 16, maxWidth: 600 }}>
        <div className="card-body p-4">
          <h5 className="fw-bold mb-3">Create New Coupon</h5>
          <form onSubmit={handleCreate}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-bold">Code</label>
                <input type="text" className="form-control" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="SAVE20" required/>
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold">Type</label>
                <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
                  <option value="FREE_SHIPPING">Free Shipping</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold">Value</label>
                <input type="number" className="form-control" value={form.value} onChange={e => setForm({...form, value: e.target.value})} placeholder={form.type === 'PERCENTAGE' ? '20' : '5.00'} required/>
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold">Min Order Amount</label>
                <input type="number" className="form-control" value={form.minOrderAmount} onChange={e => setForm({...form, minOrderAmount: e.target.value})} placeholder="0"/>
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold">Max Discount</label>
                <input type="number" className="form-control" value={form.maxDiscount} onChange={e => setForm({...form, maxDiscount: e.target.value})} placeholder="No limit"/>
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold">Usage Limit</label>
                <input type="number" className="form-control" value={form.usageLimit} onChange={e => setForm({...form, usageLimit: e.target.value})} placeholder="Unlimited"/>
              </div>
              <div className="col-12">
                <label className="form-label small fw-bold">Expires At</label>
                <input type="datetime-local" className="form-control" value={form.expiresAt} onChange={e => setForm({...form, expiresAt: e.target.value})}/>
              </div>
            </div>
            <button type="submit" className="btn btn-dark rounded-pill px-4 mt-3" disabled={creating}>
              {creating ? 'Creating...' : 'Create Coupon'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
