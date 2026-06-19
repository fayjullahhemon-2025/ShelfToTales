'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Dropdown } from 'react-bootstrap';
import { bookService } from '../lib/api';

//Component
import NewsLetter from '../components/features/NewsLetter';
import { FadeIn } from '../components/common/AnimationUtils';

const CATEGORIES = ['All Books', 'Fictions', 'Fantasy', 'Science'];

function ShopList(){
    const [books, setBooks] = useState([]);
    const [selectBtn, setSelectBtn] = useState('Newest');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy, setSortBy] = useState('id');
    const [sortDir, setSortDir] = useState('desc');
    const [selectedCategory, setSelectedCategory] = useState('All Books');

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
            } catch (error) {
                console.error('Error fetching books:', error);
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

    const filteredBooks = books.filter(book =>
        selectedCategory === 'All Books' ||
        (book.category?.name || '').toLowerCase() === selectedCategory.toLowerCase()
    );

    return(
        <>
            <div className="page-content bg-grey">
                <FadeIn>
                <section className="content-inner-1 border-bottom">
                    <div className="container">
                        {/* Title */}
                        <div className="d-flex justify-content-between align-items-center m-b20">
                            <h4 className="title mb-0 fw-bold" style={{ color: '#1A162E' }}>Books</h4>
                        </div>

                        {/* Filter Toolbar — matches book-list design */}
                        <div className="filter-area m-b30 p-3 bg-white rounded-3 border d-flex justify-content-between align-items-center shadow-sm">
                            {/* Left: Categories */}
                            <div className="d-flex align-items-center gap-4 ps-2">
                                <Dropdown>
                                    <Dropdown.Toggle
                                        as="button"
                                        id="sl-categories-dropdown"
                                        className="sl-toolbar-btn"
                                        aria-label="Filter by category"
                                    >
                                        <i className="fa-solid fa-list-ul me-2"></i>
                                        Categories
                                        <i className="fa-solid fa-caret-down small ms-2"></i>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        {CATEGORIES.map(cat => (
                                            <Dropdown.Item
                                                key={cat}
                                                onClick={() => { setSelectedCategory(cat); setCurrentPage(0); }}
                                                active={selectedCategory === cat}
                                            >
                                                {cat}
                                            </Dropdown.Item>
                                        ))}
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                            {/* Right: Sort */}
                            <div className="d-flex align-items-center gap-4 pe-2">
                                <Dropdown>
                                    <Dropdown.Toggle
                                        as="button"
                                        id="sl-sort-dropdown"
                                        className="sl-toolbar-btn"
                                        aria-label={`Sort books by: ${selectBtn}`}
                                    >
                                        <i className="fa-solid fa-arrow-down-wide-short me-2"></i>
                                        {selectBtn}
                                        <i className="fa-solid fa-caret-down small ms-2"></i>
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

                        {/* Book list */}
                        <div className="row">
                            {filteredBooks.map((data, i) => (
                                <div className="col-12 mb-3" key={i}>
                                    <div className="sl-book-card">
                                        {/* Cover image */}
                                        <div className="sl-book-cover">
                                            <img
                                                loading="lazy"
                                                decoding="async"
                                                src={data.coverUrl || data.imageUrl || '/placeholder-book.png'}
                                                alt={`Cover of ${data.title}`}
                                            />
                                        </div>
                                        {/* Content */}
                                        <div className="sl-book-content">
                                            <div className="sl-book-top">
                                                <div className="sl-book-meta">
                                                    {data.category?.name && (
                                                        <span className="sl-book-category">{data.category.name}</span>
                                                    )}
                                                    <h5 className="sl-book-title">
                                                        <Link href={`/shop-detail/${data.id}`}>{data.title}</Link>
                                                    </h5>
                                                    {data.description && (
                                                        <p className="sl-book-desc">{data.description}</p>
                                                    )}
                                                </div>
                                                <div className="sl-book-price">
                                                    <span className="sl-price-main">${data.discountPrice || data.price}</span>
                                                    {data.discountPrice && <del className="sl-price-old">${data.price}</del>}
                                                    <div className="sl-rating">
                                                        <span className="sl-rating-num">4.0</span>
                                                        <div className="sl-stars">
                                                            {[1,2,3,4].map(s => (
                                                                <i key={s} className="fa-solid fa-star text-warning"></i>
                                                            ))}
                                                            <i className="fa-regular fa-star text-warning"></i>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="sl-book-bottom">
                                                <div className="sl-author">
                                                    <span className="sl-author-label">Written by</span>
                                                    <span className="sl-author-name">{data.author || 'Unknown'}</span>
                                                </div>
                                                <Link
                                                    href={`/shop-detail/${data.id}`}
                                                    className="sl-view-btn"
                                                    aria-label={`View details of ${data.title}`}
                                                >
                                                    View Details
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="row align-items-center mt-4">
                                <div className="col-12">
                                    <nav aria-label="Page navigation">
                                        <ul className="pagination justify-content-center mb-0 gap-2">
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
                </FadeIn>
                <NewsLetter />
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                /* ── Toolbar buttons ── */
                .sl-toolbar-btn {
                    background: transparent !important;
                    background-color: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    outline: none !important;
                    color: #1A162E !important;
                    font-weight: 600;
                    font-size: 0.9rem;
                    padding: 0 !important;
                    cursor: pointer;
                    display: inline-flex !important;
                    align-items: center;
                }
                .sl-toolbar-btn:hover,
                .sl-toolbar-btn:focus,
                .sl-toolbar-btn:active,
                .sl-toolbar-btn.show {
                    background: transparent !important;
                    background-color: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    color: #1A162E !important;
                    opacity: 0.75;
                }
                .sl-toolbar-btn::after {
                    display: none !important;
                }

                /* ── Book card ── */
                .sl-book-card {
                    display: flex;
                    align-items: flex-start;
                    gap: 24px;
                    background: #fff;
                    border-radius: 12px;
                    padding: 20px 24px;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.07);
                    transition: box-shadow 0.25s ease, transform 0.25s ease;
                }
                .sl-book-card:hover {
                    box-shadow: 0 6px 24px rgba(0,0,0,0.13);
                    transform: translateY(-2px);
                }

                /* Cover */
                .sl-book-cover {
                    flex-shrink: 0;
                    width: 110px;
                    height: 150px;
                    border-radius: 8px;
                    overflow: hidden;
                    background: #eee;
                }
                .sl-book-cover img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }

                /* Content wrapper */
                .sl-book-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    min-height: 150px;
                    gap: 12px;
                }

                /* Top row: meta + price */
                .sl-book-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 16px;
                }
                .sl-book-meta {
                    flex: 1;
                }
                .sl-book-category {
                    display: inline-block;
                    font-size: 0.72rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: #E9AD28;
                    margin-bottom: 4px;
                }
                .sl-book-title {
                    font-size: 1.05rem;
                    font-weight: 700;
                    color: #1A162E;
                    margin: 0 0 6px;
                    line-height: 1.3;
                }
                .sl-book-title a {
                    color: inherit;
                    text-decoration: none;
                }
                .sl-book-title a:hover { color: #E9AD28; }
                .sl-book-desc {
                    font-size: 0.82rem;
                    color: #666;
                    margin: 0;
                    line-height: 1.5;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                /* Price + rating column */
                .sl-book-price {
                    text-align: right;
                    flex-shrink: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 6px;
                }
                .sl-price-main {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: #2563EB;
                }
                .sl-price-old {
                    font-size: 0.8rem;
                    color: #999;
                    margin-left: 6px;
                }
                .sl-rating {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 2px;
                }
                .sl-rating-num {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: #1A162E;
                }
                .sl-stars { display: flex; gap: 2px; font-size: 0.78rem; }

                /* Bottom row: author + button */
                .sl-book-bottom {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 8px;
                    border-top: 1px solid #f0f0f0;
                }
                .sl-author {
                    display: flex;
                    flex-direction: column;
                    gap: 1px;
                }
                .sl-author-label {
                    font-size: 0.72rem;
                    color: #aaa;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .sl-author-name {
                    font-size: 0.88rem;
                    font-weight: 600;
                    color: #1A162E;
                }
                .sl-view-btn {
                    display: inline-flex;
                    align-items: center;
                    padding: 8px 20px;
                    background: #1A162E;
                    color: #fff !important;
                    border-radius: 8px;
                    font-size: 0.82rem;
                    font-weight: 600;
                    text-decoration: none !important;
                    transition: background 0.2s ease;
                }
                .sl-view-btn:hover { background: #E9AD28; color: #1A162E !important; }

                /* Pagination */
                .pagination .page-link:hover {
                    background-color: #1A162E !important;
                    color: white !important;
                }
            `}} />
        </>
    )
}
export default ShopList;
