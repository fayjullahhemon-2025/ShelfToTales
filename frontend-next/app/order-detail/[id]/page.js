'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PageTitle from '../../components/layout/PageTitle';
import { orderService } from '../../lib/api';
import { FadeIn } from '../../components/common/AnimationUtils';

function OrderDetail() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await orderService.getById(id);
                setOrder(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching order details:', error);
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    if (loading) return <div className="text-center py-5">Loading order details...</div>;
    if (!order) return <div className="text-center py-5">Order not found.</div>;

    return (
        <div className="page-content bg-grey">
            <PageTitle parentPage="User" childPage={`Order #${id}`} />
            <FadeIn>
            <div className="container py-5">
                <div className="row">
                    <div className="col-lg-8">
                        {/* Order Status Card */}
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
                                            {order.items?.map((item, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <img loading="lazy" decoding="async" src={item.bookImageUrl} alt={item.bookTitle} style={{ width: '50px', height: '70px', objectFit: 'cover' }} className="rounded me-3" />
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
                                                <td colSpan="3" className="text-end border-0">Subtotal</td>
                                                <td className="text-end border-0 font-weight-bold">${order.totalAmount.toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan="3" className="text-end border-0">Shipping</td>
                                                <td className="text-end border-0 font-weight-bold">$0.00</td>
                                            </tr>
                                            <tr className="border-top">
                                                <td colSpan="3" className="text-end border-0"><h5 className="mb-0">Total</h5></td>
                                                <td className="text-end border-0"><h5 className="mb-0 text-primary">${order.totalAmount.toFixed(2)}</h5></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4">
                        {/* Order Info */}
                        <div className="card shadow-sm border-0 mb-4">
                            <div className="card-header bg-white border-bottom py-3">
                                <h5 className="mb-0">Order Summary</h5>
                            </div>
                            <div className="card-body">
                                <div className="mb-4">
                                    <h6 className="text-muted small text-uppercase">Order Date</h6>
                                    <p className="mb-0 font-weight-bold">{new Date(order.orderDate).toLocaleDateString()} {new Date(order.orderDate).toLocaleTimeString()}</p>
                                </div>
                                <div className="mb-4">
                                    <h6 className="text-muted small text-uppercase">Payment Method</h6>
                                    <p className="mb-0 font-weight-bold">Credit Card (Ending 4242)</p>
                                </div>
                                <div className="mb-0">
                                    <h6 className="text-muted small text-uppercase">Shipping Address</h6>
                                    <p className="mb-0 text-muted">
                                        123 Book St, Library City<br />
                                        Knowledge State, 90210<br />
                                        United States
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Customer Support */}
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

