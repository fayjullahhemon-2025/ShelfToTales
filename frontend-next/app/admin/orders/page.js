'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { adminOrderService, orderService } from '../../lib/api';
import Swal from 'sweetalert2';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.getHistory().then(r => setOrders(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await adminOrderService.updateStatus(id, status);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      Swal.fire({ icon: 'success', title: `Order ${status}`, timer: 1200, showConfirmButton: false });
    } catch (e) { Swal.fire('Error', e.response?.data?.message || 'Failed', 'error'); }
  };

  const statusColors = { PENDING: 'warning', CONFIRMED: 'primary', SHIPPED: 'info', DELIVERED: 'success', CANCELLED: 'danger' };

  return (
    <div className="container-fluid py-4 px-4">
      <h2 className="fw-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Order Management</h2>

      {loading ? <div className="text-center py-5"><div className="spinner-border text-secondary"/></div> : orders.length > 0 ? (
        <div className="row g-3">
          {orders.map(order => (
            <div key={order.id} className="col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>Order #{order.id}</strong>
                    <span className={`badge bg-${statusColors[order.status] || 'secondary'} rounded-pill`}>{order.status}</span>
                  </div>
                  <p className="text-muted small mb-1">{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : ''}</p>
                  <p className="fw-bold mb-2">${order.totalAmount?.toFixed(2)}</p>
                  <div className="d-flex gap-1 flex-wrap">
                    {['CONFIRMED','SHIPPED','DELIVERED','CANCELLED'].filter(s => s !== order.status).map(s => (
                      <button key={s} className={`btn btn-sm btn-outline-${statusColors[s]} rounded-pill`} onClick={() => updateStatus(order.id, s)}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : <div className="text-center py-5 text-muted"><p>No orders yet</p></div>}
    </div>
  );
}
