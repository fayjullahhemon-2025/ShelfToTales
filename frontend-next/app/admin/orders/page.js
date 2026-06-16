'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { adminOrderService } from '../../lib/api';
import Swal from 'sweetalert2';

function describeError(e) {
  const status = e?.response?.status;
  if (status === 401) return 'Not signed in. Please log in as an admin.';
  if (status === 403) return 'Your account does not have admin access.';
  if (status === 404) return 'Order not found.';
  if (status >= 500) return 'Server error. Check backend logs.';
  return e?.response?.data?.message || e?.message || 'Request failed';
}

const statusColors = {
  PENDING: 'warning',
  CONFIRMED: 'primary',
  SHIPPED: 'info',
  DELIVERED: 'success',
  CANCELLED: 'danger',
};

const paymentLabels = {
  COD: 'Cash on Delivery',
  BKASH: 'bKash',
  SSLCOMMERZ: 'SSLCommerz',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const orderAmount = (order) =>
    Math.max(0, Number(order.totalAmount || 0) - Number(order.discountAmount || 0));

  useEffect(() => {
    adminOrderService
      .getAll()
      .then((r) => setOrders(r.data || []))
      .catch((e) => Swal.fire('Failed to load orders', describeError(e), 'error'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await adminOrderService.updateStatus(id, status);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status, ...(res.data || {}) } : o))
      );
      Swal.fire({
        icon: 'success',
        title: `Order ${status}`,
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire('Update failed', describeError(e), 'error');
    }
  };

  const filtered =
    filterStatus === 'ALL'
      ? orders
      : orders.filter((o) => o.status === filterStatus);

  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
            Order Management
          </h2>
          <p className="text-muted small mb-0">{orders.length} total orders</p>
        </div>
      </div>

      <div className="d-flex gap-2 flex-wrap mb-4">
        {['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
          <button
            key={s}
            className={`btn btn-sm rounded-pill ${
              filterStatus === s ? 'btn-dark' : 'btn-outline-secondary'
            }`}
            onClick={() => setFilterStatus(s)}
          >
            {s}
            {s !== 'ALL' && counts[s] ? <span className="ms-1">({counts[s]})</span> : null}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-secondary" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: 80 }}>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th style={{ width: 280 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <React.Fragment key={order.id}>
                  <tr>
                    <td>
                      <strong>Order #{order.id}</strong>
                    </td>
                    <td>
                      <div className="small">{order.userName || '—'}</div>
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                        {order.userEmail || ''}
                      </div>
                    </td>
                    <td className="small text-muted">
                      {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark rounded-pill">
                        {order.items?.length || 0}
                      </span>
                      <button
                        className="btn btn-sm btn-link p-0 ms-2"
                        onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                        style={{ fontSize: '0.78rem' }}
                      >
                        {expandedId === order.id ? 'Hide' : 'Details'}
                      </button>
                    </td>
                    <td>
                      <div className="fw-bold">${orderAmount(order).toFixed(2)}</div>
                      {order.discountAmount > 0 && (
                        <div className="text-success small">
                          -${Number(order.discountAmount).toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark rounded-pill">
                        {paymentLabels[order.paymentMethod] || order.paymentMethod || 'COD'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge bg-${statusColors[order.status] || 'secondary'} rounded-pill`}
                      >
                        {order.status}
                      </span>
                      {order.trackingNumber && (
                        <div className="text-muted small mt-1">#{order.trackingNumber}</div>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-1 flex-wrap">
                        {['CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
                          .filter((s) => s !== order.status)
                          .map((s) => (
                            <button
                              key={s}
                              className={`btn btn-sm btn-outline-${statusColors[s]} rounded-pill`}
                              onClick={() => updateStatus(order.id, s)}
                            >
                              {s}
                            </button>
                          ))}
                      </div>
                    </td>
                  </tr>
                  {expandedId === order.id && order.items?.length > 0 && (
                    <tr>
                      <td colSpan={8} className="bg-light">
                        <div className="p-3">
                          <h6 className="fw-bold mb-2">Order Items</h6>
                          <div className="row g-2">
                            {order.items.map((item) => (
                              <div key={item.id} className="col-md-6 col-lg-4">
                                <div className="d-flex align-items-center gap-2 p-2 bg-white rounded-3">
                                  {item.bookImageUrl && (
                                    <img
                                      src={item.bookImageUrl}
                                      alt={item.bookTitle}
                                      width="40"
                                      height="56"
                                      style={{ objectFit: 'cover', borderRadius: 6 }}
                                    />
                                  )}
                                  <div className="flex-grow-1 min-w-0">
                                    <div className="small fw-semibold text-truncate">
                                      {item.bookTitle}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                      Qty: {item.quantity} x ${Number(item.price || 0).toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          {order.couponCode && (
                            <div className="mt-2 small">
                              <span className="badge bg-success-subtle text-success">
                                Coupon: {order.couponCode}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-5 text-muted">
          <p>No orders yet{filterStatus !== 'ALL' ? ` with status "${filterStatus}"` : ''}</p>
        </div>
      )}
    </div>
  );
}
