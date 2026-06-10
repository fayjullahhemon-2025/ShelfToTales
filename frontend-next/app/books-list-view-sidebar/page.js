'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { bookService, wishlistService } from '../lib/api';
import { useCart } from '../hooks/useCart';
import Swal from 'sweetalert2';
import PageTitle from '../components/layout/PageTitle';

function BooksListViewSidebar() {
  const { addToCart } = useCart();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookService.getAll({ size: 20 })
      .then(res => setBooks(res.data.content || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = useCallback(async (id) => {
    try { await addToCart(id, 1); Swal.fire({ icon: 'success', title: 'Added to cart', timer: 1200, showConfirmButton: false, toast: true, position: 'top-end' }); }
    catch (e) { Swal.fire('Error', e.response?.data?.message || 'Failed', 'error'); }
  }, [addToCart]);

  const addToWishlist = useCallback(async (id) => {
    try { await wishlistService.addToWishlist(id); Swal.fire({ icon: 'success', title: 'Added to wishlist', timer: 1200, showConfirmButton: false, toast: true, position: 'top-end' }); }
    catch (e) { Swal.fire('Error', e.response?.data?.message || 'Failed', 'error'); }
  }, []);

  return (
    <div className="page-content bg-grey">
      <PageTitle parentPage="Shop" childPage="Books List" />
      <div className="container py-4">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-secondary"/></div>
        ) : books.length > 0 ? (
          <div className="row g-3">
            {books.map(book => (
              <div key={book.id} className="col-12">
                <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
                  <div className="card-body d-flex gap-4 align-items-center flex-wrap">
                    <Link href={`/shop-detail/${book.id}`}>
                      <img src={book.coverUrl || 'https://via.placeholder.com/80x110/eaa451/fff?text=Book'} alt={book.title} style={{ width: 80, height: 110, objectFit: 'cover', borderRadius: 12 }}/>
                    </Link>
                    <div className="flex-grow-1">
                      <Link href={`/shop-detail/${book.id}`} className="text-decoration-none">
                        <h6 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>{book.title}</h6>
                      </Link>
                      <p className="text-muted small mb-1">{book.author}</p>
                      {book.categoryName && <span className="badge bg-light text-dark">{book.categoryName}</span>}
                      {book.description && <p className="text-muted small mt-2 mb-0" style={{ maxWidth: 500, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{book.description}</p>}
                    </div>
                    <div className="text-end">
                      <div className="fw-bold fs-5 mb-2" style={{ color: '#eaa451' }}>${book.price || '0.00'}</div>
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-dark rounded-pill" onClick={() => addToWishlist(book.id)}><i className="fa-regular fa-heart"/></button>
                        <button className="btn btn-sm btn-dark rounded-pill px-3" onClick={() => handleAddToCart(book.id)}><i className="fa-solid fa-cart-plus me-1"/> Add</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5"><p className="text-muted">No books found</p></div>
        )}
      </div>
    </div>
  );
}

export default BooksListViewSidebar;
