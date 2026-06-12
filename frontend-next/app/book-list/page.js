'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { bookService, wishlistService, cartService } from '../lib/api';
import Swal from 'sweetalert2';
import { Dropdown } from 'react-bootstrap';

// Components
import ClientsSlider from '../components/features/Home/ClientsSlider';
import CounterSection from '../components/common/CounterSection';
import NewsLetter from '../components/features/NewsLetter';
import PageTitle from '../components/layout/PageTitle';
import { FadeIn } from '../components/common/AnimationUtils';

function BookListPage() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [selectBtn, setSelectBtn] = useState('Newest');
    const [sortBy, setSortBy] = useState('id');
    const [sortDir, setSortDir] = useState('desc');

    const sortMap = {
        'Newest': { sortBy: 'id', sortDir: 'desc' },
        'Oldest': { sortBy: 'id', sortDir: 'asc' },
        'Price Low': { sortBy: 'price', sortDir: 'asc' },
        'Price High': { sortBy: 'price', sortDir: 'desc' },
    };

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const response = await bookService.getAll({ page: currentPage, size: 20, sortBy, sortDir });
                setBooks(response.data.content || response.data || []);
                setTotalPages(response.data.totalPages || 1);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching books:', error);
                setLoading(false);
            }
        };
        fetchBooks();
    }, [currentPage, sortBy, sortDir]);

    const handleSortChange = (label) => {
        setSelectBtn(label);
        const s = sortMap[label];
        if (s) {
            setSortBy(s.sortBy);
            setSortDir(s.sortDir);
        }
        setCurrentPage(0);
    };

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
            Swal.fire('Error', error.response?.data?.message || 'Failed to add to wishlist', 'error');
        }
    };

    const handleAddToCart = async (bookId) => {
        try {
            await cartService.addToCart(bookId, 1);
            Swal.fire({ icon: 'success', title: 'Added to cart', showConfirmButton: false, timer: 1500, toast: true, position: 'top-end' });
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to add to cart', 'error');
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
                            <Link href="/book-list" className="text-decoration-none" style={{ color: '#1A162E' }} aria-label="List View">
                                <i className="fa-solid fa-bars fa-lg"></i>
                            </Link>
                            <Link href="/book-list" className="text-decoration-none" style={{ color: '#1A162E' }} aria-label="Grid View">
                                <i className="fa-solid fa-table-cells fa-lg"></i>
                            </Link>
                            <Link href="/book-list" className="text-decoration-none" style={{ color: '#1A162E' }} aria-label="Detailed Grid View">
                                <i className="fa-solid fa-table-list fa-lg"></i>
                            </Link>
                        </div>
                        <div className="d-flex align-items-center gap-4 pe-2">
                            <div className="dropdown">
                                <button className="btn btn-link fw-bold text-decoration-none d-flex align-items-center gap-2 p-0" type="button" style={{ color: '#1A162E' }} aria-label="Toggle categories list">
                                    <i className="fa-solid fa-list-ul"></i> Categories
                                </button>
                            </div>
                            <Dropdown className="dropdown">
                                <Dropdown.Toggle className="btn btn-link fw-bold text-decoration-none d-flex align-items-center gap-2 p-0 border-0 bg-transparent i-false" style={{ color: '#1A162E', boxShadow: 'none' }} aria-label={`Sort books by: ${selectBtn}`}>
                                    <i className="fa-solid fa-arrow-down-wide-short"></i> {selectBtn} <i className="fa-solid fa-caret-down small ms-1"></i>
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={() => handleSortChange('Newest')}>Newest</Dropdown.Item>
                                    <Dropdown.Item onClick={() => handleSortChange('Oldest')}>Oldest</Dropdown.Item>
                                    <Dropdown.Item onClick={() => handleSortChange('Price Low')}>Price Low</Dropdown.Item>
                                    <Dropdown.Item onClick={() => handleSortChange('Price High')}>Price High</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                    </div>

                    <div className="row book-grid-row">
                        {books.map((book, index) => (
                            <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 m-b30" key={index}>
                                <div className="book-card-new" role="article" aria-label={`Book: ${book.title}`}>
                                    {/* Cover image fills top portion */}
                                    <div className="book-card-cover">
                                        <img
                                            loading="lazy"
                                            decoding="async"
                                            src={book.coverUrl || '/placeholder-book.png'}
                                            alt={`Cover of ${book.title}`}
                                        />
                                        {/* Price badge top-left */}
                                        <div className="book-card-price-badge" aria-label={`Price: $${book.discountPrice || book.price}`}>
                                            ${book.discountPrice || book.price}
                                        </div>
                                        {/* Hover action overlay */}
                                        <div className="book-card-hover-actions">
                                            <button
                                                onClick={() => handleAddToWishlist(book.id)}
                                                className="book-card-action-btn wishlist-btn"
                                                aria-label={`Add ${book.title} to wishlist`}
                                            >
                                                <i className="fa-regular fa-heart me-2"></i> Wishlist
                                            </button>
                                            <button
                                                onClick={() => handleAddToCart(book.id)}
                                                className="book-card-action-btn cart-btn"
                                                aria-label={`Add ${book.title} to cart`}
                                            >
                                                <i className="fa-solid fa-cart-shopping me-2"></i> Add to Cart
                                            </button>
                                        </div>
                                    </div>
                                    {/* White info panel */}
                                    <div className="book-card-info">
                                        <h6 className="book-card-title">
                                            <Link href={`/books-detail/${book.id}`} aria-label={`View details of ${book.title}`}>
                                                {book.title}
                                            </Link>
                                        </h6>
                                        <p className="book-card-author">{book.author || 'Unknown Author'}</p>
                                        <span className="book-card-genre">
                                            {book.category?.name || 'General'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Section */}
                    {totalPages > 1 && (
                        <div className="row align-items-center mt-5">
                            <div className="col-12">
                                <nav aria-label="Page navigation">
                                    <ul className="pagination justify-content-center mb-0 gap-2 border-0">
                                        <li className={`page-item ${currentPage === 0 ? 'disabled' : ''}`}>
                                            <button className="page-link border-0 bg-light rounded text-dark px-3 py-2" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0} aria-label="Previous page">Prev</button>
                                        </li>
                                        {Array.from({ length: totalPages }, (_, i) => (
                                            <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
                                                <button className={`page-link border-0 rounded px-3 py-2 ${currentPage === i ? 'text-white' : 'bg-light text-dark'}`} style={currentPage === i ? { backgroundColor: '#1A162E' } : {}} onClick={() => setCurrentPage(i)} aria-label={`Page ${i + 1}`} aria-current={currentPage === i ? "page" : undefined}>{i + 1}</button>
                                            </li>
                                        ))}
                                        <li className={`page-item ${currentPage >= totalPages - 1 ? 'disabled' : ''}`}>
                                            <button className="page-link border-0 bg-light rounded text-dark px-3 py-2" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages - 1} aria-label="Next page">Next</button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    )}
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
                /* ── New Book Card Design ── */
                .book-card-new {
                    background: #fff;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.10);
                    transition: transform 0.28s ease, box-shadow 0.28s ease;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                }
                .book-card-new:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 12px 36px rgba(0,0,0,0.18);
                }

                /* Cover area */
                .book-card-cover {
                    position: relative;
                    width: 100%;
                    aspect-ratio: 3 / 4;
                    overflow: hidden;
                    background: #e8e8e4;
                }
                .book-card-cover img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                    transition: transform 0.4s ease;
                }
                .book-card-new:hover .book-card-cover img {
                    transform: scale(1.05);
                }

                /* Price badge */
                .book-card-price-badge {
                    position: absolute;
                    top: 14px;
                    left: 14px;
                    background: #1A162E;
                    color: #E9AD28;
                    font-weight: 700;
                    font-size: 0.92rem;
                    padding: 5px 12px;
                    border-radius: 8px;
                    letter-spacing: 0.02em;
                    z-index: 2;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.22);
                }

                /* Hover action overlay */
                .book-card-hover-actions {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    padding: 12px;
                    background: linear-gradient(to top, rgba(26,22,46,0.88) 0%, transparent 100%);
                    opacity: 0;
                    transform: translateY(8px);
                    transition: opacity 0.28s ease, transform 0.28s ease;
                    z-index: 3;
                }
                .book-card-new:hover .book-card-hover-actions {
                    opacity: 1;
                    transform: translateY(0);
                }
                .book-card-action-btn {
                    border: none;
                    border-radius: 8px;
                    padding: 7px 14px;
                    font-size: 0.82rem;
                    font-weight: 600;
                    cursor: pointer;
                    width: 100%;
                    transition: filter 0.2s ease;
                }
                .book-card-action-btn:hover {
                    filter: brightness(1.1);
                }
                .wishlist-btn {
                    background: rgba(255,255,255,0.18);
                    color: #fff;
                    border: 1px solid rgba(255,255,255,0.35);
                    backdrop-filter: blur(4px);
                }
                .cart-btn {
                    background: #E9AD28;
                    color: #1A162E;
                }

                /* Info panel */
                .book-card-info {
                    padding: 16px 16px 18px;
                    background: #fff;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .book-card-title {
                    margin: 0;
                    font-size: 0.97rem;
                    font-weight: 700;
                    line-height: 1.3;
                    color: #1A162E;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                }
                .book-card-title a {
                    color: inherit;
                    text-decoration: none;
                }
                .book-card-title a:hover {
                    color: #E9AD28;
                }
                .book-card-author {
                    margin: 0;
                    font-size: 0.83rem;
                    color: #888;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .book-card-genre {
                    display: inline-block;
                    margin-top: 6px;
                    padding: 3px 10px;
                    border-radius: 20px;
                    background: #F3F3F3;
                    color: #555;
                    font-size: 0.76rem;
                    font-weight: 600;
                    align-self: flex-start;
                }

                /* Pagination */
                .pagination .page-link:hover {
                    background-color: #1A162E !important;
                    color: white !important;
                }
            ` }} />
        </div>
    );
}

export default BookListPage;

