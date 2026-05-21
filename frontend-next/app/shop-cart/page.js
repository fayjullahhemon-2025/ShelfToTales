'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { useCart } from '../hooks/useCart';
import Swal from 'sweetalert2';

//Components
import PageTitle from '../components/layout/PageTitle';

function ShopCart(){
    const { items, count, total, loading, refreshCart, updateQuantity, removeFromCart } = useCart();

    const handleUpdateQuantity = async (bookId, newQuantity) => {
        if (newQuantity < 1) return;
        try {
            await updateQuantity(bookId, newQuantity);
        } catch (error) {
            Swal.fire('Error', 'Failed to update quantity', 'error');
        }
    };

    const handleRemove = async (bookId) => {
        try {
            await removeFromCart(bookId);
            Swal.fire({ icon: 'success', title: 'Removed from cart', showConfirmButton: false, timer: 1500, toast: true, position: 'top-end' });
        } catch (error) {
            Swal.fire('Error', 'Failed to remove item', 'error');
        }
    };

    if (loading) return <div className="page-content"><PageTitle parentPage="Shop" childPage="Cart" /><div className="container">Loading...</div></div>;

    return(
        <>
            <div className="page-content">
                <PageTitle  parentPage="Shop" childPage="Cart" />
                <section className="content-inner shop-account">
                    <div className="container">
                        <div className="row mb-5">
                            <div className="col-lg-12">
                                {items && items.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table check-tbl">
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th>Product name</th>
                                                    <th>Unit Price</th>
                                                    <th>Quantity</th>
                                                    <th>Total</th>
                                                    <th>Remove</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((item, index)=>(
                                                    <tr key={index}>
                                                        <td className="product-item-img"><img loading="lazy" decoding="async" src={item.coverUrl} alt="" style={{width: '50px'}} /></td>
                                                        <td className="product-item-name">{item.title}</td>
                                                        <td className="product-item-price">${item.unitPrice?.toFixed(2)}</td>
                                                        <td className="product-item-quantity">
                                                            <div className="quantity btn-quantity style-1 me-3">
                                                                <button className="btn btn-plus" type="button" onClick={() => handleUpdateQuantity(item.bookId, item.quantity + 1)}>
                                                                    <i className="ti-plus"></i>
                                                                </button>
                                                                <input type="text" className="quantity-input" value={item.quantity} readOnly />
                                                                <button className="btn btn-minus" type="button" onClick={() => handleUpdateQuantity(item.bookId, item.quantity - 1)}>
                                                                    <i className="ti-minus"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="product-item-totle">${item.subtotal?.toFixed(2)}</td>
                                                        <td className="product-item-close">
                                                            <Link href={"#"} className="ti-close" onClick={(e) => { e.preventDefault(); handleRemove(item.bookId); }}></Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <h5>Your cart is empty</h5>
                                        <Link href="/books-grid-view" className="btn btn-primary mt-3">Browse Books</Link>
                                    </div>
                                )}
                            </div>
                        </div>
                        {items && items.length > 0 && (
                            <div className="row">
                                <div className="col-lg-6 offset-lg-6">
                                    <div className="widget">
                                        <h4 className="widget-title">Cart Totals</h4>
                                        <table className="table-bordered check-tbl m-b25">
                                            <tbody>
                                                <tr>
                                                    <td>Items</td>
                                                    <td>{count}</td>
                                                </tr>
                                                <tr>
                                                    <td>Total</td>
                                                    <td>${total?.toFixed(2)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <div className="form-group m-b25">
                                            <Link href={"/shop-checkout"} className="btn btn-primary btnhover">Proceed to Checkout</Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </>
    )
}
export default ShopCart;
