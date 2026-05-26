'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { bookService, wishlistService, cartService } from '../lib/api';
import Swal from 'sweetalert2';

// Components
import ClientsSlider from '../components/features/Home/ClientsSlider';
import CounterSection from '../components/common/CounterSection';
import NewsLetter from '../components/features/NewsLetter';
import PageTitle from '../components/layout/PageTitle';
import { FadeIn } from '../components/common/AnimationUtils';

function BookListPage() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const response = await bookService.getAll();
                setBooks(response.data.content || response.data || []);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching books:', error);
                setLoading(false);
            }
        };
        fetchBooks();
    }, []);

    const handleAddToWishlist = async (bookId) => {
        try {
            await wishlistService.addToWishlist(bookId);
            Swal.fire({
                icon: 'success',
                title: 'Added to wishlist',
                showConfirmButton: false,
                timer: 1500,
                toast: true,
                position: 'top-end'
            });
        } catch (error) {
            Swal.fire('Error', 'Please login to add to wishlist', 'error');
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

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{height: '50vh'}}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content bg-grey">
            <PageTitle parentPage="Pages" childPage="Book List" />
                <FadeIn>
            
            <section className="content-inner-1 border-bottom">
                <div className="container">
                    {/* Title */}
                    <div className="d-flex justify-content-between align-items-center m-b20">
                        <h4 className="title mb-0 fw-bold" style={{ color: '#1A162E' }}>Books</h4>
                    </div>

                    {/* Toolbar */}
                    <div className="filter-area m-b30 p-3 bg-white rounded-3 border d-flex justify-content-between align-items-center shadow-sm">
                        <div className="d-flex align-items-center gap-4 ps-2">
                            <Link href="/book-list" className="text-decoration-none" style={{ color: '#1A162E' }}>
                                <i className="fa-solid fa-bars fa-lg"></i>
                            </Link>
                            <Link href="/book-list" className="text-decoration-none" style={{ color: '#1A162E' }}>
                                <i className="fa-solid fa-table-cells fa-lg"></i>
                            </Link>
                            <Link href="/book-list" className="text-decoration-none" style={{ color: '#1A162E' }}>
                                <i className="fa-solid fa-table-list fa-lg"></i>
                            </Link>
                        </div>
                        <div className="d-flex align-items-center gap-4 pe-2">
                            <div className="dropdown">
                                <button className="btn btn-link fw-bold text-decoration-none d-flex align-items-center gap-2 p-0" type="button" style={{ color: '#1A162E' }}>
                                    <i className="fa-solid fa-list-ul"></i> Categories
                                </button>
                            </div>
                            <div className="dropdown">
                                <button className="btn btn-link fw-bold text-decoration-none d-flex align-items-center gap-2 p-0" type="button" style={{ color: '#1A162E' }}>
                                    <i className="fa-solid fa-arrow-down-wide-short"></i> Newest <i className="fa-solid fa-caret-down small ms-1"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="row book-grid-row">
                        {books.map((book, index) => (
                            <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 m-b30" key={index}>
                                <div className="dz-shop-card style-1 bg-white p-3 rounded shadow-sm h-100 d-flex flex-column">
                                    <div className="dz-media position-relative mb-3 overflow-hidden rounded">
                                        <img loading="lazy" decoding="async" src={book.coverUrl} alt={book.title} style={{ height: '300px', width: '100%', objectFit: 'cover' }} />
                                        <div className="bookmark-btn position-absolute top-0 end-0 m-3">
                                            <button onClick={() => handleAddToWishlist(book.id)} className="btn btn-white btn-sm rounded-circle shadow-sm" style={{ width: '35px', height: '35px', padding: '0' }}>
                                                <i className="fa-regular fa-heart text-muted"></i>
                                            </button>
                                        </div>
                                        <div className="shop-card-btn position-absolute bottom-0 start-0 w-100 p-2 opacity-0 transition-3s">
                                            <button onClick={() => handleAddToWishlist(book.id)} className="btn btn-primary w-100 btn-sm mb-1">
                                                <i className="fa-solid fa-heart me-2"></i> Add To Wishlist
                                            </button>
                                            <button onClick={() => handleAddToCart(book.id)} className="btn btn-secondary w-100 btn-sm">
                                                <i className="fa-solid fa-cart-shopping me-2"></i> Add To Cart
                                            </button>
                                        </div>
                                    </div>
                                    <div className="dz-content text-center flex-grow-1">
                                        <h5 className="title mb-2">
                                            <Link href={`/books-detail/${book.id}`} className="text-dark fw-bold">{book.title}</Link>
                                        </h5>
                                        <div className="text-uppercase small fw-bold mb-2" style={{ color: '#E9AD28' }}>
                                            {book.category?.name || 'ADVENTURE'}
                                        </div>
                                        <div className="dz-rating mb-2">
                                            <ul className="d-flex justify-content-center list-unstyled mb-0 text-yellow">
                                                <li><i className="fa-solid fa-star"></i></li>
                                                <li><i className="fa-solid fa-star"></i></li>
                                                <li><i className="fa-solid fa-star"></i></li>
                                                <li><i className="fa-solid fa-star"></i></li>
                                                <li><i className="fa-solid fa-star"></i></li>
                                            </ul>
                                        </div>
                                        <div className="price mb-0">
                                            <span className="h5 fw-bold" style={{ color: '#E9AD28' }}>${book.discountPrice || book.price}</span>
                                            {book.discountPrice && <del className="ms-2 text-muted small">${book.price}</del>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Section */}
                    <div className="row align-items-center mt-5">
                        <div className="col-md-6">
                            <p className="mb-0 text-muted fw-bold">Showing {books.length} from 50 data</p>
                        </div>
                        <div className="col-md-6">
                            <nav aria-label="Page navigation">
                                <ul className="pagination justify-content-end mb-0 gap-2 border-0">
                                    <li className="page-item"><Link className="page-link border-0 bg-light rounded text-dark px-3 py-2" to="#">Prev</Link></li>
                                    <li className="page-item active"><Link className="page-link border-0 rounded text-white px-3 py-2" style={{ backgroundColor: '#1A162E' }} to="#">1</Link></li>
                                    <li className="page-item"><Link className="page-link border-0 bg-light rounded text-dark px-3 py-2" to="#">2</Link></li>
                                    <li className="page-item"><Link className="page-link border-0 bg-light rounded text-dark px-3 py-2" to="#">3</Link></li>
                                    <li className="page-item"><Link className="page-link border-0 bg-light rounded text-dark px-3 py-2" to="#">Next</Link></li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </section>

            <div className="bg-white py-5">
                <div className="container">
                    <ClientsSlider />
                </div>
            </div>

            <section className="content-inner bg-grey">
                <div className="container">
                    <div className="row sp15">
                        <CounterSection />
                    </div>
                </div>
            </section>
                </FadeIn>

            <NewsLetter />
            
            <style dangerouslySetInnerHTML={{ __html: `
                .text-yellow {
                    color: #FFC107;
                }
                .dz-shop-card.style-1 .dz-media:hover .shop-card-btn {
                    opacity: 1 !important;
                }
                .transition-3s {
                    transition: all 0.3s ease;
                }
                .pagination .page-link:hover {
                    background-color: #1A162E !important;
                    color: white !important;
                }
            ` }} />
        </div>
    );
}

export default BookListPage;

