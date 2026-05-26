'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { wishlistService, cartService } from '../lib/api';
import Swal from 'sweetalert2';
import { FadeIn } from '../components/common/AnimationUtils';

//Components
import PageTitle from '../components/layout/PageTitle';

function Wishlist(){
    const [wishData, setWishData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        try {
            const response = await wishlistService.getWishlist();
            setWishData(response.data);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFromWishlist = async (bookId) => {
        try {
            await wishlistService.removeFromWishlist(bookId);
            setWishData(prev => prev.filter(item => item.bookId !== bookId));
            Swal.fire({ icon: 'success', title: 'Removed from wishlist', showConfirmButton: false, timer: 1500, toast: true, position: 'top-end' });
        } catch (error) {
            Swal.fire('Error', 'Failed to remove from wishlist', 'error');
        }
    };

    const handleAddToCart = async (bookId) => {
        try {
            await cartService.addToCart(bookId, 1);
            Swal.fire({ icon: 'success', title: 'Added to cart', showConfirmButton: false, timer: 1500, toast: true, position: 'top-end' });
        } catch (error) {
            Swal.fire('Error', 'Please login to add to cart', 'error');
        }
    };

    if (loading) return <div className="page-content"><PageTitle parentPage="Shop" childPage="Wishlist" /><div className="container">Loading...</div></div>;

    return(
        <>
            <div className="page-content">
                <PageTitle  parentPage="Shop" childPage="Wishlist" />
                <FadeIn>
                <section className="content-inner-1">
                    <div className="container">
                        <div className="row">
                            <div className="col-lg-12">
                                {wishData.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table check-tbl">
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th>Product name</th>
                                                    <th>Added</th>
                                                    <th>Add to cart</th>
                                                    <th>Close</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {wishData.map((data, index)=>(
                                                    <tr key={index}>
                                                        <td className="product-item-img"><img loading="lazy" decoding="async" src={data.coverUrl} alt="" style={{width: '50px'}} /></td>
                                                        <td className="product-item-name">
                                                            <Link href={`/shop-detail/${data.bookId}`}>{data.title}</Link>
                                                            <div className="text-muted small">{data.author}</div>
                                                        </td>
                                                        <td className="product-item-price">{data.addedAt ? new Date(data.addedAt).toLocaleDateString() : '-'}</td>
                                                        <td className="product-item-totle">
                                                            <button className="btn btn-primary btnhover" onClick={() => handleAddToCart(data.bookId)}>
                                                                <i className="flaticon-shopping-cart-1 m-r10"></i> Add To Cart
                                                            </button>
                                                        </td>
                                                        <td className="product-item-close">
                                                            <Link href={"#"} className="ti-close" onClick={(e) => { e.preventDefault(); handleRemoveFromWishlist(data.bookId); }}></Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <h5>Your wishlist is empty</h5>
                                        <Link href="/books-grid-view" className="btn btn-primary mt-3">Browse Books</Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
                </FadeIn>
            </div>
        </>
    )
}
export default Wishlist;
