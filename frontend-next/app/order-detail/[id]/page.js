'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PageTitle from '../../components/layout/PageTitle';
import { orderService } from '../../lib/api';
import { FadeIn } from '../../components/common/AnimationUtils';

function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [checkoutSummary, setCheckoutSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await orderService.getById(id);
        setOrder(response.data);

        if (typeof window !== 'undefined') {
          const saved = window.sessionStorage.getItem('latestCheckoutSummary');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (String(parsed.orderId) === String(id)) {
                setCheckoutSummary(parsed);
              }
            } catch {
              // Ignore malformed payloads.
            }
          }
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) return <div className="text-center py-5">Loading order details...</div>;
  if (!order) return <div className="text-center py-5">Order not found.</div>;

  const paymentMethod = order.paymentMethod || checkoutSummary?.paymentMethod || 'COD';
  const couponCode = order.couponCode || checkoutSummary?.couponCode || '';
  const discountAmount = Number(order.discountAmount || checkoutSummary?.discountAmount || 0);
  const shippingAddress = checkoutSummary?.shippingAddress || null;
  const finalAmount = Math.max(0, Number(order.totalAmount || 0) - discountAmount);

  return (
    <div className="page-content bg-grey">
      <PageTitle parentPage="User" childPage={`Order #${id}`} />
      <FadeIn>
        <div className="container py-5">
          <div className="row">
            <div className="col-lg-8">
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Order Items</h5>
                  <span className={`badge ${order.status === 'COMPLETED' ? 'bg-success' : 'bg-warning'}`}>
                    {order.status}
                  </span>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th className="text-center">Quantity</th>
                          <th className="text-end">Price</th>
                          <th className="text-end">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items?.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <img
                                  loading="lazy"
                                  decoding="async"
                                  src={item.bookImageUrl}
                                  alt={item.bookTitle}
                                  style={{ width: '50px', height: '70px', objectFit: 'cover' }}
                                  className="rounded me-3"
                                />
                                <div>
                                  <h6 className="mb-0">{item.bookTitle}</h6>
                                  <small className="text-muted">{item.category?.name}</small>
                                </div>
                              </div>
                            </td>
                            <td className="text-center align-middle">{item.quantity}</td>
                            <td className="text-end align-middle">${item.price.toFixed(2)}</td>
                            <td className="text-end align-middle font-weight-bold">${(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="3" className="text-end border-0">
                            Subtotal
                          </td>
                          <td className="text-end border-0 font-weight-bold">${Number(order.totalAmount || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td colSpan="3" className="text-end border-0">
                            Shipping
                          </td>
                          <td className="text-end border-0 font-weight-bold">$0.00</td>
                        </tr>
                        {discountAmount > 0 ? (
                          <tr>
                            <td colSpan="3" className="text-end border-0">
                              Discount
                            </td>
                            <td className="text-end border-0 font-weight-bold text-success">-${discountAmount.toFixed(2)}</td>
                          </tr>
                        ) : null}
                        <tr className="border-top">
                          <td colSpan="3" className="text-end border-0">
                            <h5 className="mb-0">Total</h5>
                          </td>
                          <td className="text-end border-0">
                            <h5 className="mb-0 text-primary">${finalAmount.toFixed(2)}</h5>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-header bg-white border-bottom py-3">
                  <h5 className="mb-0">Order Summary</h5>
                </div>
                <div className="card-body">
                  <div className="mb-4">
                    <h6 className="text-muted small text-uppercase">Order Date</h6>
                    <p className="mb-0 font-weight-bold">
                      {new Date(order.orderDate).toLocaleDateString()} {new Date(order.orderDate).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="mb-4">
                    <h6 className="text-muted small text-uppercase">Payment Method</h6>
                    <p className="mb-0 font-weight-bold">{paymentMethod}</p>
                  </div>
                  {couponCode ? (
                    <div className="mb-4">
                      <h6 className="text-muted small text-uppercase">Coupon Code</h6>
                      <p className="mb-0 font-weight-bold">{couponCode}</p>
                    </div>
                  ) : null}
                  {discountAmount > 0 ? (
                    <div className="mb-4">
                      <h6 className="text-muted small text-uppercase">Discount</h6>
                      <p className="mb-0 font-weight-bold text-success">-${discountAmount.toFixed(2)}</p>
                    </div>
                  ) : null}
                  <div className="mb-0">
                    <h6 className="text-muted small text-uppercase">Shipping Address</h6>
                    {shippingAddress ? (
                      <p className="mb-0 text-muted">
                        {shippingAddress.fullName}
                        <br />
                        {shippingAddress.addressLine}
                        <br />
                        {[shippingAddress.area, shippingAddress.city, shippingAddress.postalCode].filter(Boolean).join(', ')}
                      </p>
                    ) : (
                      <p className="mb-0 text-muted">
                        Shipping details were captured during checkout and are not persisted in the history response.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="card shadow-sm border-0 bg-primary text-white">
                <div className="card-body text-center py-4">
                  <i className="fa-solid fa-headset fa-3x mb-3"></i>
                  <h5>Need Help?</h5>
                  <p className="small mb-3">If you have any questions about your order, our support team is here to help.</p>
                  <Link href="/contact-us" className="btn btn-light btn-sm w-100">Contact Support</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}

export default OrderDetail;
