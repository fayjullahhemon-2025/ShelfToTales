'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { bookService, categoryService, wishlistService } from '../lib/api';
import { useCart } from '../hooks/useCart';
import { useAuthToken } from '../hooks/useAuthToken';
import Swal from 'sweetalert2';
import PageTitle from '../components/layout/PageTitle';
import '../books-grid-view-sidebar/BooksSidebar.css';

function BooksListViewSidebar() {
  const { addToCart } = useCart();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [sortBy, setSortBy] = useState('title');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minRating, setMinRating] = useState('');
  const [loading, setLoading] = useState(true);
  const [token] = useAuthToken();
  const size = 10;

  useEffect(() => {
    categoryService.getAll().then(res => setCategories(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    bookService.getAll({
      page,
      size,
      q: search || undefined,
      categoryId: activeCategory || undefined,
      sortBy,
      minPrice: priceMin || undefined,
      maxPrice: priceMax || undefined,
      inStockOnly: inStockOnly || undefined,
      minRating: minRating || undefined,
    })
      .then(res => {
        setBooks(res.data.content || []);
        setTotalPages(res.data.totalPages || 0);
        setTotalElements(res.data.totalElements || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, activeCategory, sortBy, priceMin, priceMax, inStockOnly, minRating]);

  const handleAddToCart = useCallback(async (id) => {
    try {
      await addToCart(id, 1);
      Swal.fire({
        icon: 'success',
        title: 'Added to cart',
        timer: 1200,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } catch (e) {
      if (e.response?.status === 401 || !token) {
        Swal.fire('Session Expired', 'Please log in again to add items to cart', 'warning');
        window.location.href = '/shop-login';
      } else {
        Swal.fire('Error', e.response?.data?.message || 'Failed to add to cart', 'error');
      }
    }
  }, [addToCart, token]);

  const addToWishlist = useCallback(async (id) => {
    try {
      await wishlistService.addToWishlist(id);
      Swal.fire({
        icon: 'success',
        title: 'Added to wishlist',
        timer: 1200,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } catch (e) {
      Swal.fire('Error', e.response?.data?.message || 'Failed to add to wishlist', 'error');
    }
  }, []);

  return (
    <div className="bgs-page">
      <PageTitle parentPage="Shop" childPage="Books List" />

      {/* Hero */}
      <div className="bgs-hero">
        <div className="bgs-hero-inner">
          <h1 className="bgs-hero-title">Discover Books</h1>
          <p className="bgs-hero-sub">Explore our curated collection of {totalElements} titles</p>
          <form onSubmit={e => { e.preventDefault(); setPage(0); }} className="bgs-search-form">
            <i className="fa-solid fa-search"/>
            <input
              type="text"
              placeholder="Search by title, author, or ISBN..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
            />
            {search && (
              <button type="button" className="bgs-search-clear" onClick={() => setSearch('')}>
                <i className="fa-solid fa-xmark"/>
              </button>
            )}
          </form>
        </div>
      </div>

      <div className="bgs-layout">
        {/* Sidebar */}
        <aside className="bgs-sidebar">
          <div className="bgs-sidebar-section">
            <h4 className="bgs-sidebar-title">Categories</h4>
            <button
              className={`bgs-cat-btn ${!activeCategory ? 'active' : ''}`}
              onClick={() => { setActiveCategory(null); setPage(0); }}
            >
              <i className="fa-solid fa-layer-group"/> All Books
              <span className="bgs-cat-count">{totalElements}</span>
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`bgs-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => { setActiveCategory(cat.id); setPage(0); }}
              >
                <i className="fa-solid fa-bookmark"/> {cat.name}
              </button>
            ))}
          </div>

          <div className="bgs-sidebar-section">
            <h4 className="bgs-sidebar-title">Sort By</h4>
            {[{v:'title',l:'Title A-Z'},{v:'publishedDate',l:'Newest'},{v:'price',l:'Price'}].map(s => (
              <button
                key={s.v}
                className={`bgs-sort-btn ${sortBy === s.v ? 'active' : ''}`}
                onClick={() => { setSortBy(s.v); setPage(0); }}
              >
                {s.l}
              </button>
            ))}
          </div>

          <div className="bgs-sidebar-section">
            <h4 className="bgs-sidebar-title">Price Range</h4>
            <div className="d-flex gap-2 align-items-center mb-2">
              <input
                type="number"
                className="form-control form-control-sm"
                placeholder="Min"
                value={priceMin}
                onChange={e => { setPriceMin(e.target.value); setPage(0); }}
                style={{ borderRadius: 8, fontSize: '0.8rem' }}
              />
              <span style={{ color: '#aaa' }}>—</span>
              <input
                type="number"
                className="form-control form-control-sm"
                placeholder="Max"
                value={priceMax}
                onChange={e => { setPriceMax(e.target.value); setPage(0); }}
                style={{ borderRadius: 8, fontSize: '0.8rem' }}
              />
            </div>
            <div className="form-check mt-2">
              <input
                className="form-check-input"
                type="checkbox"
                checked={inStockOnly}
                onChange={() => { setInStockOnly(!inStockOnly); setPage(0); }}
                id="stockFilter"
                style={{ cursor: 'pointer' }}
              />
              <label className="form-check-label small" htmlFor="stockFilter" style={{ color: '#666', cursor: 'pointer', userSelect: 'none' }}>
                In stock only
              </label>
            </div>
          </div>

          <div className="bgs-sidebar-section">
            <h4 className="bgs-sidebar-title">Rating</h4>
            <select
              className="form-select form-select-sm"
              value={minRating}
              onChange={e => { setMinRating(e.target.value); setPage(0); }}
              style={{ borderRadius: 8, fontSize: '0.8rem' }}
            >
              <option value="">Any rating</option>
              <option value="4">4 stars & up</option>
              <option value="3">3 stars & up</option>
              <option value="2">2 stars & up</option>
            </select>
          </div>

          <div className="bgs-sidebar-section bgs-sidebar-promo">
            <span className="bgs-promo-badge">New</span>
            <h5>Book Exchange</h5>
            <p>Swap books with other readers in your community</p>
            <Link href="/reader-network" className="bgs-promo-link">Explore →</Link>
          </div>
        </aside>

        {/* Main List */}
        <main className="bgs-main">
          <div className="bgs-toolbar">
            <span className="bgs-results-count">{totalElements} book{totalElements !== 1 ? 's' : ''} found</span>
            <div className="bgs-view-toggle">
              <Link href="/books-list-view-sidebar" className="bgs-view-btn active"><i className="fa-solid fa-list"/></Link>
              <Link href="/books-grid-view-sidebar" className="bgs-view-btn"><i className="fa-solid fa-table-columns"/></Link>
            </div>
          </div>

          {loading ? (
            <div className="row g-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="col-12 bgs-skeleton" style={{ opacity: 0.7 }}>
                  <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
                    <div className="card-body d-flex gap-4 align-items-center flex-wrap">
                      <div className="bgs-skel-img" style={{ width: 80, height: 110, borderRadius: 12, aspectRatio: 'auto' }}/>
                      <div className="flex-grow-1">
                        <div style={{ height: 16, background: '#e8e5e0', borderRadius: 6, width: '40%', marginBottom: 8 }}/>
                        <div style={{ height: 12, background: '#e8e5e0', borderRadius: 6, width: '25%', marginBottom: 12 }}/>
                        <div style={{ height: 12, background: '#e8e5e0', borderRadius: 6, width: '60%' }}/>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : books.length > 0 ? (
            <div className="row g-3">
              {books.map((book, i) => (
                <div key={book.id} className="col-12" style={{ animation: 'cardIn 0.5s ease forwards', animationDelay: `${i * 0.05}s`, opacity: 0 }}>
                  <div className="card border-0 shadow-sm card-hover-list" style={{ borderRadius: 16, transition: 'all 0.3s' }}>
                    <div className="card-body d-flex gap-4 align-items-center flex-wrap">
                      <Link href={`/shop-detail/${book.id}`}>
                        <img
                          src={book.coverUrl || `https://via.placeholder.com/80x110/${['EAA451','1a1668','029e76','ff6b6b','6c5ce7'][i%5]}/fff?text=${encodeURIComponent(book.title?.substring(0,8)||'Book')}`}
                          alt={book.title}
                          style={{ width: 80, height: 110, objectFit: 'cover', borderRadius: 12 }}
                        />
                      </Link>
                      <div className="flex-grow-1">
                        <Link href={`/shop-detail/${book.id}`} className="text-decoration-none">
                          <h6 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>{book.title}</h6>
                        </Link>
                        <p className="text-muted small mb-1">{book.author || 'Unknown Author'}</p>
                        {book.categoryName && <span className="badge bg-light text-dark">{book.categoryName}</span>}
                        {book.description && (
                          <p className="text-muted small mt-2 mb-0" style={{ maxWidth: 500, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {book.description}
                          </p>
                        )}
                      </div>
                      <div className="text-end ms-auto">
                        <div className="fw-bold fs-5 mb-2" style={{ color: '#eaa451' }}>${book.price || '0.00'}</div>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-dark rounded-pill"
                            onClick={() => addToWishlist(book.id)}
                            aria-label={`Add ${book.title} to wishlist`}
                          >
                            <i className="fa-regular fa-heart"/>
                          </button>
                          <button
                            className="btn btn-sm btn-dark rounded-pill px-3"
                            onClick={() => handleAddToCart(book.id)}
                            aria-label={`Add ${book.title} to cart`}
                          >
                            <i className="fa-solid fa-cart-plus me-1"/> Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bgs-empty">
              <i className="fa-solid fa-book-open"/>
              <h3>No books found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bgs-pagination">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="bgs-page-btn">
                <i className="fa-solid fa-chevron-left"/>
              </button>
              {[...Array(Math.min(totalPages, 7))].map((_, i) => (
                <button
                  key={i}
                  className={`bgs-page-btn ${page === i ? 'active' : ''}`}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </button>
              ))}
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="bgs-page-btn">
                <i className="fa-solid fa-chevron-right"/>
              </button>
            </div>
          )}
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .card-hover-list:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.08) !important;
        }
      `}} />
    </div>
  );
}

export default BooksListViewSidebar;
