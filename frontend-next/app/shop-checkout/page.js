'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { orderService, couponService, addressService, cartService } from '../lib/api';
import Swal from 'sweetalert2';
import PageTitle from '../components/layout/PageTitle';

function ShopCheckout() {
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [placing, setPlacing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    cartService.getCart().then(res => setCart(res.data)).catch(() => {});
    addressService.getAll().then(res => setAddresses(res.data || [])).catch(() => {});
  }, []);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await couponService.validate(couponCode, cart?.totalPrice || 0);
      setDiscount(res.data.discount || 0);
      Swal.fire({ icon: 'success', title: `Coupon applied! -$${res.data.discount}`, timer: 1500, showConfirmButton: false });
    } catch (e) {
      Swal.fire('Invalid', e.response?.data?.message || 'Coupon not valid', 'error');
      setDiscount(0);
    }
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      await orderService.checkout({ paymentMethod, addressId: selectedAddress, couponCode: couponCode || undefined });
      Swal.fire({ icon: 'success', title: 'Order placed!', text: 'Thank you for your purchase', timer: 2000, showConfirmButton: false });
      setTimeout(() => router.push('/purchase-history'), 2000);
    } catch (e) {
      Swal.fire('Error', e.response?.data?.message || 'Failed to place order', 'error');
    } finally { setPlacing(false); }
  };

  if (!cart) return <div className="page-content"><PageTitle parentPage="Shop" childPage="Checkout"/><div className="container py-5 text-center"><div className="spinner-border text-secondary"/></div></div>;

  const total = (cart.totalPrice || 0) - discount;

  return (
    <div className="page-content">
      <PageTitle parentPage="Shop" childPage="Checkout"/>
      <section className="content-inner-1">
        <div className="container">
          <div className="row g-4">
            {/* Left: Order Summary */}
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-3">Order Summary</h5>
                  {cart.items?.map((item, i) => (
                    <div key={i} className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom">
                      <img src={item.coverUrl || item.book?.imageUrl} alt="" style={{ width: 50, height: 70, objectFit: 'cover', borderRadius: 8 }}/>
                      <div className="flex-grow-1">
                        <h6 className="mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>{item.title || item.book?.title}</h6>
                        <small className="text-muted">Qty: {item.quantity}</small>
                      </div>
                      <span className="fw-bold">${(item.subtotal || item.unitPrice * item.quantity)?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="card border-0 shadow-sm mt-3" style={{ borderRadius: 16 }}>
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-3">Shipping Address</h5>
                  {addresses.length > 0 ? (
                    <div className="row g-2">
                      {addresses.map(addr => (
                        <div key={addr.id} className="col-md-6">
                          <div className={`p-3 border rounded-3 cursor-pointer ${selectedAddress === addr.id ? 'border-dark bg-light' : ''}`}
                               onClick={() => setSelectedAddress(addr.id)} style={{ cursor: 'pointer' }}>
                            <strong>{addr.fullName}</strong><br/>
                            <small className="text-muted">{addr.street}, {addr.city}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted mb-0">No saved addresses. Order will use your profile address.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Payment */}
            <div className="col-lg-5">
              {/* Coupon */}
              <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 16 }}>
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-3">Coupon Code</h5>
                  <div className="d-flex gap-2">
                    <input type="text" className="form-control" placeholder="Enter code" value={couponCode} onChange={e => setCouponCode(e.target.value)} style={{ borderRadius: 10 }}/>
                    <button className="btn btn-outline-dark rounded-pill px-3" onClick={applyCoupon}>Apply</button>
                  </div>
                  {discount > 0 && <p className="text-success small mt-2 mb-0">✓ Discount: -${discount.toFixed(2)}</p>}
                </div>
              </div>

              {/* Payment Method */}
              <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 16 }}>
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-3">Payment Method</h5>
                  {['COD', 'BKASH', 'SSLCOMMERZ'].map(m => (
                    <label key={m} className={`d-flex align-items-center gap-3 p-3 border rounded-3 mb-2 ${paymentMethod === m ? 'border-dark bg-light' : ''}`} style={{ cursor: 'pointer' }}>
                      <input type="radio" name="payment" checked={paymentMethod === m} onChange={() => setPaymentMethod(m)}/>
                      <span className="fw-bold">{m === 'COD' ? '💵 Cash on Delivery' : m === 'BKASH' ? '📱 bKash' : '💳 SSLCommerz'}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between mb-2"><span>Subtotal</span><span>${(cart.totalPrice || 0).toFixed(2)}</span></div>
                  {discount > 0 && <div className="d-flex justify-content-between mb-2 text-success"><span>Discount</span><span>-${discount.toFixed(2)}</span></div>}
                  <div className="d-flex justify-content-between mb-3 pt-2 border-top"><strong>Total</strong><strong style={{ fontSize: '1.2rem' }}>${total.toFixed(2)}</strong></div>
                  <button className="btn btn-dark w-100 rounded-pill py-3 fw-bold" onClick={handlePlaceOrder} disabled={placing || cart.items?.length === 0}>
                    {placing ? <><span className="spinner-border spinner-border-sm me-2"/>Processing...</> : 'Place Order'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ShopCheckout;
