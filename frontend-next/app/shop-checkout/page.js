'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { orderService } from '../lib/api';
import Swal from 'sweetalert2';

//Components 
import PageTitle from '../components/layout/PageTitle';
import { FadeIn } from '../components/common/AnimationUtils';

function ShopCheckout(){
    const [cart, setCart] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const fetchCart = async () => {
            try {
                const response = await orderService.getCart();
                setCart(response.data);
            } catch (error) {
                console.error('Error fetching cart:', error);
            }
        };
        fetchCart();
    }, []);

    const handlePlaceOrder = async () => {
        try {
            await orderService.checkout();
            Swal.fire('Success', 'Order placed successfully!', 'success');
            router.push('/shop-list');
        } catch (error) {
            Swal.fire('Error', 'Failed to place order', 'error');
        }
    };

    if (!cart) return <div className="page-content"><PageTitle parentPage="Shop" childPage="Checkout" /><div className="container">Loading...</div></div>;

    return(
        <>
            <div className="page-content">
                <PageTitle  parentPage="Shop" childPage="Checkout" />               
                <section className="content-inner-1">
                    <div className="container">
                        <div className="row">
                            <div className="col-lg-7">
                                <div className="widget">
                                    <h4 className="widget-title">Your Order</h4>
                                    <table className="table-bordered check-tbl">
                                        <thead className="text-center">
                                            <tr>
                                                <th>IMAGE</th>
                                                <th>PRODUCT NAME</th>
                                                <th>TOTAL</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cart.items.map((item, ind)=>(
                                                <tr key={ind}>
                                                    <td className="product-item-img"><img loading="lazy" decoding="async" src={item.book.imageUrl} alt="" style={{width: '50px'}} /></td>
                                                    <td className="product-item-name">{item.book.title} x {item.quantity}</td>
                                                    <td className="product-price">${(item.price * item.quantity).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="col-lg-5">
                                <div className="shop-form widget">
                                    <h4 className="widget-title">Order Total</h4>
                                    <table className="table-bordered check-tbl mb-4">
                                        <tbody>
                                            <tr>
                                                <td>Total</td>
                                                <td className="product-price-total">${cart.totalAmount?.toFixed(2)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <h4 className="widget-title">Payment Method</h4>
                                    <p>Cash on Delivery (Demo Mode)</p>
                                    <div className="form-group">
                                        <button className="btn btn-primary btnhover" type="button" onClick={handlePlaceOrder}>Place Order Now </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    )
}
export default ShopCheckout;

