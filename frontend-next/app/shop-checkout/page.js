'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import PageTitle from '../components/layout/PageTitle';
import { addressService, cartService, checkoutService, couponService } from '../lib/api';

const emptyAddress = {
  fullName: '',
  phone: '',
  addressLine: '',
  city: '',
  area: '',
  postalCode: '',
  isDefault: true,
};

function ShopCheckout() {
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [placing, setPlacing] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const router = useRouter();

  useEffect(() => {
    const loadCheckoutData = async () => {
      try {
        const [cartResult, addressResult] = await Promise.allSettled([
          cartService.getCart(),
          addressService.getAll(),
        ]);

        if (cartResult.status === 'fulfilled') {
          setCart(cartResult.value.data);
        } else {
          setCart({ items: [], totalPrice: 0 });
        }

        if (addressResult.status === 'fulfilled') {
          const list = addressResult.value.data || [];
          setAddresses(list);
          const defaultAddress = list.find((address) => address.isDefault) || list[0] || null;
          setSelectedAddressId(defaultAddress?.id || null);
          setShowAddressForm(list.length === 0);
        }
      } catch (error) {
        console.error('Failed to load checkout data:', error);
        setCart({ items: [], totalPrice: 0 });
      }
    };

    loadCheckoutData();
  }, []);

  // Re-fetch cart once on focus in case items were added from another tab
  useEffect(() => {
    const onFocus = () => {
      cartService.getCart()
        .then(({ data }) => setCart(data))
        .catch(() => {});
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
      return () => window.removeEventListener('focus', onFocus);
    }
    return undefined;
  }, []);

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) || null,
    [addresses, selectedAddressId]
  );

  const total = Math.max(0, (cart?.totalPrice || 0) - discount);

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      return;
    }

    try {
      const response = await couponService.validate(couponCode.trim(), cart?.totalPrice || 0);
      const appliedDiscount = Number(response.data.discount || 0);
      setDiscount(appliedDiscount);
      Swal.fire({
        icon: 'success',
        title: 'Coupon applied',
        text: `Discount: -$${appliedDiscount.toFixed(2)}`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire('Invalid coupon', error.response?.data?.message || 'Coupon not valid', 'error');
      setDiscount(0);
    }
  };

  const handleCreateAddress = async (event) => {
    event.preventDefault();

    if (!addressForm.fullName.trim() || !addressForm.phone.trim() || !addressForm.addressLine.trim() || !addressForm.city.trim()) {
      Swal.fire('Missing details', 'Fill in the required address fields before saving.', 'warning');
      return;
    }

    setSavingAddress(true);
    try {
      const response = await addressService.create({
        fullName: addressForm.fullName.trim(),
        phone: addressForm.phone.trim(),
        addressLine: addressForm.addressLine.trim(),
        city: addressForm.city.trim(),
        area: addressForm.area.trim(),
        postalCode: addressForm.postalCode.trim(),
        isDefault: addressForm.isDefault ? 'true' : 'false',
      });

      const newAddress = response.data;
      setAddresses((current) => {
        const withoutDuplicate = current.filter((address) => address.id !== newAddress.id);
        return addressForm.isDefault ? [newAddress, ...withoutDuplicate] : [...withoutDuplicate, newAddress];
      });
      setSelectedAddressId(newAddress.id);
      setShowAddressForm(false);
      setAddressForm(emptyAddress);
      Swal.fire({ icon: 'success', title: 'Address saved', timer: 1200, showConfirmButton: false });
    } catch (error) {
      Swal.fire('Save failed', error.response?.data?.message || 'Could not save address', 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      Swal.fire('Select an address', 'Choose a saved address or add a new one to continue.', 'warning');
      return;
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Your cart is empty',
        text: 'Add a book to your cart before placing an order.',
        confirmButtonText: 'Browse books',
      }).then((r) => { if (r.isConfirmed) router.push('/shop-grid'); });
      return;
    }

    setPlacing(true);
    try {
      let freshCart;
      try {
        const res = await cartService.getCart();
        freshCart = res.data;
      } catch {
        freshCart = cart;
      }

      if (!freshCart || !freshCart.items || freshCart.items.length === 0) {
        setCart({ items: [], totalPrice: 0 });
        Swal.fire({
          icon: 'warning',
          title: 'Your cart is empty',
          text: 'Your cart has no items. Browse the shop and add a book first.',
          confirmButtonText: 'Browse books',
        }).then((r) => { if (r.isConfirmed) router.push('/shop-grid'); });
        return;
      }

      if (paymentMethod === 'BKASH' || paymentMethod === 'SSLCOMMERZ') {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }

      const response = await checkoutService.checkout({
        paymentMethod,
        addressId: selectedAddressId,
        couponCode: couponCode.trim() || undefined,
      });

      const order = response.data;
      const confirmation = {
        orderId: order.id,
        orderDate: order.orderDate,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentMethod: order.paymentMethod || paymentMethod,
        couponCode: order.couponCode || couponCode.trim() || '',
        discountAmount: Number(order.discountAmount || discount || 0),
        shippingAddress: selectedAddress,
      };

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('latestCheckoutSummary', JSON.stringify(confirmation));
      }

      const gatewayLabel = paymentMethod === 'COD'
        ? 'Order placed'
        : `${paymentMethod === 'BKASH' ? 'bKash' : 'SSLCommerz'} payment confirmed`;
      const txnId = order.paymentMethod ? `(Gateway: ${order.paymentMethod})` : '';
      await Swal.fire({
        icon: 'success',
        title: gatewayLabel,
        text: `Order #${order.id} is confirmed. ${txnId}`,
        timer: 1800,
        showConfirmButton: false,
      });
      router.push(`/order-detail/${order.id}`);
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to place order';
      const isEmpty = /cart is empty/i.test(message);
      Swal.fire({
        icon: isEmpty ? 'warning' : 'error',
        title: isEmpty ? 'Cart is empty' : 'Order failed',
        text: isEmpty
          ? 'Your cart has no items. Browse the shop and add a book first.'
          : `Status ${status || '?'}: ${message}`,
      });
    } finally {
      setPlacing(false);
    }
  };

  if (!cart) {
    return (
      <div className="page-content">
        <PageTitle parentPage="Shop" childPage="Checkout" />
        <div className="container py-5 text-center">
          <div className="spinner-border text-secondary" aria-hidden="true" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <PageTitle parentPage="Shop" childPage="Checkout" />
      <section className="content-inner-1">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm" style={{ borderRadius: 20 }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                    <div>
                      <h5 className="fw-bold mb-1">Order Summary</h5>
                      <p className="text-muted mb-0">Review your books before you confirm the order.</p>
                    </div>
                    <span className="badge text-bg-light rounded-pill px-3 py-2">{cart.items?.length || 0} items</span>
                  </div>

                  {cart.items?.length > 0 ? (
                    cart.items.map((item) => (
                      <div key={item.bookId || item.id} className="d-flex align-items-center gap-3 py-3 border-top">
                        <img
                          src={item.coverUrl || item.book?.imageUrl}
                          alt={item.title || item.book?.title || 'Book cover'}
                          width="56"
                          height="78"
                          loading="lazy"
                          decoding="async"
                          style={{ objectFit: 'cover', borderRadius: 10 }}
                        />
                        <div className="flex-grow-1 min-w-0">
                          <h6 className="mb-1 fw-bold text-truncate">{item.title || item.book?.title}</h6>
                          <small className="text-muted">Quantity: {item.quantity}</small>
                        </div>
                        <strong>${Number(item.subtotal || item.unitPrice * item.quantity || 0).toFixed(2)}</strong>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-muted">Your cart is empty.</div>
                  )}
                </div>
              </div>

              <div className="card border-0 shadow-sm mt-4" style={{ borderRadius: 20 }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
                    <div>
                      <h5 className="fw-bold mb-1">Shipping Address</h5>
                      <p className="text-muted mb-0">Use an existing address or add a new one.</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-dark rounded-pill px-3"
                      onClick={() => setShowAddressForm((current) => !current)}
                    >
                      {showAddressForm ? 'Hide Form' : 'Add Address'}
                    </button>
                  </div>

                  {addresses.length > 0 ? (
                    <div className="row g-3">
                      {addresses.map((address) => (
                        <div className="col-md-6" key={address.id}>
                          <button
                            type="button"
                            className={`w-100 text-start p-3 border rounded-4 bg-white ${selectedAddressId === address.id ? 'border-dark shadow-sm' : ''}`}
                            onClick={() => setSelectedAddressId(address.id)}
                            style={{ minHeight: 132 }}
                          >
                            <div className="d-flex justify-content-between align-items-start gap-3">
                              <div>
                                <strong className="d-block mb-1">{address.fullName}</strong>
                                <small className="text-muted d-block">{address.phone}</small>
                              </div>
                              {address.isDefault ? <span className="badge text-bg-dark rounded-pill">Default</span> : null}
                            </div>
                            <div className="mt-3 small text-muted">
                              <div>{address.addressLine}</div>
                              <div>{[address.area, address.city, address.postalCode].filter(Boolean).join(', ')}</div>
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="alert alert-light border mb-0">
                      No saved addresses yet. Add one below to continue checkout.
                    </div>
                  )}

                  {showAddressForm ? (
                    <form className="mt-4" onSubmit={handleCreateAddress}>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label htmlFor="checkout-full-name" className="form-label fw-semibold">Full Name</label>
                          <input
                            id="checkout-full-name"
                            name="fullName"
                            type="text"
                            className="form-control"
                            value={addressForm.fullName}
                            onChange={(e) => setAddressForm((current) => ({ ...current, fullName: e.target.value }))}
                            autoComplete="name"
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="checkout-phone" className="form-label fw-semibold">Phone</label>
                          <input
                            id="checkout-phone"
                            name="phone"
                            type="tel"
                            className="form-control"
                            value={addressForm.phone}
                            onChange={(e) => setAddressForm((current) => ({ ...current, phone: e.target.value }))}
                            autoComplete="tel"
                          />
                        </div>
                        <div className="col-12">
                          <label htmlFor="checkout-address-line" className="form-label fw-semibold">Address Line</label>
                          <input
                            id="checkout-address-line"
                            name="addressLine"
                            type="text"
                            className="form-control"
                            value={addressForm.addressLine}
                            onChange={(e) => setAddressForm((current) => ({ ...current, addressLine: e.target.value }))}
                            autoComplete="street-address"
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="checkout-city" className="form-label fw-semibold">City</label>
                          <input
                            id="checkout-city"
                            name="city"
                            type="text"
                            className="form-control"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm((current) => ({ ...current, city: e.target.value }))}
                            autoComplete="address-level2"
                          />
                        </div>
                        <div className="col-md-3">
                          <label htmlFor="checkout-area" className="form-label fw-semibold">Area</label>
                          <input
                            id="checkout-area"
                            name="area"
                            type="text"
                            className="form-control"
                            value={addressForm.area}
                            onChange={(e) => setAddressForm((current) => ({ ...current, area: e.target.value }))}
                            autoComplete="address-level3"
                          />
                        </div>
                        <div className="col-md-3">
                          <label htmlFor="checkout-postal-code" className="form-label fw-semibold">Postal Code</label>
                          <input
                            id="checkout-postal-code"
                            name="postalCode"
                            type="text"
                            className="form-control"
                            value={addressForm.postalCode}
                            onChange={(e) => setAddressForm((current) => ({ ...current, postalCode: e.target.value }))}
                            autoComplete="postal-code"
                          />
                        </div>
                        <div className="col-12 d-flex align-items-center justify-content-between gap-3 flex-wrap">
                          <label className="form-check mb-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={addressForm.isDefault}
                              onChange={(e) => setAddressForm((current) => ({ ...current, isDefault: e.target.checked }))}
                            />
                            <span className="form-check-label">Save as default address</span>
                          </label>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-secondary rounded-pill px-4"
                              onClick={() => setShowAddressForm(false)}
                            >
                              Cancel
                            </button>
                            <button type="submit" className="btn btn-dark rounded-pill px-4" disabled={savingAddress}>
                              {savingAddress ? 'Saving…' : 'Save Address'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 20 }}>
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-3">Coupon Code</h5>
                  <div className="d-flex gap-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <button type="button" className="btn btn-outline-dark rounded-pill px-3" onClick={applyCoupon}>
                      Apply
                    </button>
                  </div>
                  {discount > 0 ? (
                    <p className="text-success small mt-2 mb-0">Discount applied: -${discount.toFixed(2)}</p>
                  ) : null}
                </div>
              </div>

              <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 20 }}>
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-3">Payment Method</h5>
                  {['COD', 'BKASH', 'SSLCOMMERZ'].map((method) => (
                    <label
                      key={method}
                      className={`d-flex align-items-center gap-3 p-3 border rounded-4 mb-2 ${paymentMethod === method ? 'border-dark bg-light' : ''}`}
                      style={{ cursor: 'pointer' }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === method}
                        onChange={() => setPaymentMethod(method)}
                      />
                      <span className="fw-semibold">
                        {method === 'COD' ? 'Cash on Delivery' : method === 'BKASH' ? 'bKash' : 'SSLCommerz'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="card border-0 shadow-sm" style={{ borderRadius: 20 }}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal</span>
                    <span>${Number(cart.totalPrice || 0).toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  {discount > 0 ? (
                    <div className="d-flex justify-content-between mb-2 text-success">
                      <span>Discount</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  ) : null}
                  <div className="d-flex justify-content-between pt-3 border-top mb-4">
                    <strong>Total</strong>
                    <strong style={{ fontSize: '1.2rem' }}>${total.toFixed(2)}</strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn-dark w-100 rounded-pill py-3 fw-bold"
                    onClick={handlePlaceOrder}
                    disabled={placing || (cart.items?.length || 0) === 0}
                  >
                    {placing ? 'Processing…' : 'Place Order'}
                  </button>
                  {!selectedAddressId && addresses.length === 0 ? (
                    <p className="text-danger small mt-3 mb-0">Add a shipping address before placing the order.</p>
                  ) : null}
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
