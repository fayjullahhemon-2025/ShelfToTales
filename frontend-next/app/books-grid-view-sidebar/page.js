'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { bookService, wishlistService, cartService } from '../lib/api';
import Swal from 'sweetalert2';
import ClientsSlider from '../components/features/Home/ClientsSlider';
import NewsLetter from '../components/features/NewsLetter';
import CounterSection from '../components/common/CounterSection';
import ShopSidebar from '../components/common/ShopSidebar';
import BookGridCard from '../components/common/BookGridCard';
import { FadeIn } from '../components/common/AnimationUtils';

const bookColors = [
    '#EAA451', '#1a1668', '#029e76', '#ff6b6b', '#00aeff',
    '#e58c23', '#3a32b8', '#ff1e6f', '#6c5ce7', '#00b894',
];

function buildFallbackCover(book) {
    const color = bookColors[book.id % bookColors.length].replace('#', '');
    const text = encodeURIComponent(book.title?.substring(0, 10) || 'Book');
    return `https://via.placeholder.com/250x350/${color}/ffffff?text=${text}`;
}

function buildCategoryHref(book) {
    return `/books-grid-view-sidebar?category=${book.categoryId}`;
}

function BooksGridViewSidebar() {
    const [books, setBooks] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [search, setSearch] = useState('');
    const size = 12;

    useEffect(() => {
        const fetchBooks = async () => {
        try {
            const res = await bookService.getAll({ page, size, q: search || undefined });
            setBooks(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalElements(res.data.totalElements || 0);
        } catch (err) {
            console.error('Error fetching books:', err);
        }
        };
        fetchBooks();
    }, [page, search]);

    const handleSearch = useCallback((e) => {
        e.preventDefault();
        setPage(0);
    }, []);

    const handleAddToWishlist = useCallback(async (bookId) => {
        try {
            await wishlistService.addToWishlist(bookId);
            Swal.fire({ icon: 'success', title: 'Added to wishlist', showConfirmButton: false, timer: 1500, toast: true, position: 'top-end' });
        } catch (error) {
            Swal.fire('Error', 'Please login to add to wishlist', 'error');
        }
    }, []);

    const handleAddToCart = useCallback(async (bookId) => {
        try {
            await cartService.addToCart(bookId, 1);
            Swal.fire({ icon: 'success', title: 'Added to cart', showConfirmButton: false, timer: 1500, toast: true, position: 'top-end' });
        } catch (error) {
            Swal.fire('Error', 'Please login to add to cart', 'error');
        }
    }, []);

    // Stable page-number array used by the pagination block
    const pageNumbers = useMemo(
        () => [...Array(Math.min(totalPages, 5))].map((_, i) => i),
        [totalPages]
    );

    return (
        <div className="page-content bg-grey">
            <FadeIn>
            <div className="content-inner-1 border-bottom">
                <div className="container">
                    <div className="row">
                        <div className="col-xl-3">
                            <ShopSidebar />
                        </div>

                        <div className="col-xl-9">
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="title">Books</h4>
                                <form onSubmit={handleSearch} className="d-flex gap-2">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search books..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        style={{ maxWidth: 200 }}
                                    />
                                    <button type="submit" className="btn btn-primary btn-sm">Search</button>
                                </form>
                            </div>

                            <div className="row book-grid-row">
                                {books.length > 0 ? books.map((book) => (
                                    <div className="col-book style-2" key={book.id}>
                                        <BookGridCard
                                            book={book}
                                            onAddToWishlist={handleAddToWishlist}
                                            onAddToCart={handleAddToCart}
                                            categoryAsLink
                                            categoryHrefBuilder={buildCategoryHref}
                                            showAuthor
                                            fallbackCover={buildFallbackCover(book)}
                                        />
                                    </div>
                                )) : (
                                    <div className="col-12 text-center py-5">
                                        <p>No books found. Try a different search.</p>
                                    </div>
                                )}
                            </div>

                            {totalPages > 1 && (
                                <div className="row page mt-0">
                                    <div className="col-md-6">
                                        <p className="page-text">Showing {Math.min(size, totalElements - page * size)} from {totalElements} data</p>
                                    </div>
                                    <div className="col-md-6">
                                        <nav aria-label="Blog Pagination">
                                            <ul className="pagination style-1 p-t20">
                                                <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
                                                    <button className="page-link prev" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Prev</button>
                                                </li>
                                                {pageNumbers.map((i) => (
                                                    <li className={`page-item ${page === i ? 'active' : ''}`} key={i}>
                                                        <button className="page-link" onClick={() => setPage(i)}>{i + 1}</button>
                                                    </li>
                                                ))}
                                                <li className={`page-item ${page >= totalPages - 1 ? 'disabled' : ''}`}>
                                                    <button className="page-link next" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next</button>
                                                </li>
                                            </ul>
                                        </nav>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-white py-5">
                <div className="container">
                    <ClientsSlider />
                </div>
            </div>
            <section className="content-inner">
                <div className="container">
                    <div className="row sp15">
                        <CounterSection />
                    </div>
                </div>
            </section>
            </FadeIn>
            <NewsLetter />
        </div>
    );
}

export default BooksGridViewSidebar;
