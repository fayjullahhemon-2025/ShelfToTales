'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageTitle from '../components/layout/PageTitle';
import { orderService } from '../lib/api';
import { FadeIn } from '../components/common/AnimationUtils';

function PurchaseHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const orderAmount = (order) => Math.max(0, Number(order.totalAmount || 0) - Number(order.discountAmount || 0));

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await orderService.getHistory();
                setOrders(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching purchase history:', error);
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    if (loading) return <div className="text-center py-5">Loading your purchase history...</div>;

    return (
        <div className="page-content bg-grey">
            <PageTitle parentPage="User" childPage="Purchase History" />
            <FadeIn>
            <div className="container py-5">
                <div className="row mb-4">
                    <div className="col-lg-12">
                        <h2 className="title">Your Orders</h2>
                    </div>
                </div>

                {orders.length === 0 ? (
                    <div className="text-center py-5 card shadow-sm border-0">
                        <div className="card-body py-5">
                            <i className="fa-solid fa-box-open fa-4x text-muted mb-4"></i>
                            <h3>No orders found</h3>
                            <p className="text-muted">You haven't placed any orders yet. Start shopping to fill your library!</p>
                            <Link href="/books-grid-view" className="btn btn-primary mt-3">Start Shopping</Link>
                        </div>
                    </div>
                ) : (
                    <div className="card shadow-sm border-0">
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0 align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="ps-4">Order ID</th>
                                            <th>Date</th>
                                            <th>Items</th>
                                            <th>Total</th>
                                            <th>Status</th>
                                            <th className="text-end pe-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order) => (
                                            <tr key={order.id}>
                                                <td className="ps-4 font-weight-bold text-primary">#{order.id}</td>
                                                <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                                                <td>{order.items?.length || 0} Books</td>
                                                <td>${orderAmount(order).toFixed(2)}</td>
                                                <td>
                                                    <span className={`badge ${order.status === 'COMPLETED' ? 'bg-success' : 'bg-warning'}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="text-end pe-4">
                                                    <Link href={`/order-detail/${order.id}`} className="btn btn-primary btn-sm btnhover">View Details</Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            </FadeIn>
        </div>
    );
}

export default PurchaseHistory;

