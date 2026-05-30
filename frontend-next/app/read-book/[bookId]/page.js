'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { bookService } from '../../lib/api';

export default function ReadBookPage() {
  const { bookId } = useParams();
  const router = useRouter();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookId) return;
    bookService.getById(bookId)
      .then(res => setBook(res.data))
      .catch(() => router.push('/books-grid-view'))
      .finally(() => setLoading(false));
  }, [bookId, router]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf8f5' }}><div className="spinner-border text-secondary"/></div>;
  if (!book) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#1a1a2e' }}><i className="fa-solid fa-arrow-left"/></button>
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', margin: 0, color: '#1a1a2e' }}>{book.title}</h2>
            <p style={{ margin: '4px 0 0', color: '#888', fontSize: '0.9rem' }}>by {book.author}</p>
          </div>
        </div>

        {/* Book Cover */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src={book.coverUrl} alt={book.title} style={{ maxWidth: 280, borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}/>
        </div>

        {/* Book Info */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {book.categoryName && <div><small style={{ color: '#888', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>Category</small><p style={{ margin: '4px 0 0', fontWeight: 600 }}>{book.categoryName}</p></div>}
            {book.publishedDate && <div><small style={{ color: '#888', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>Published</small><p style={{ margin: '4px 0 0', fontWeight: 600 }}>{new Date(book.publishedDate).getFullYear()}</p></div>}
            {book.isbn && <div><small style={{ color: '#888', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>ISBN</small><p style={{ margin: '4px 0 0', fontWeight: 600 }}>{book.isbn}</p></div>}
            {book.moodTags && <div><small style={{ color: '#888', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>Mood</small><p style={{ margin: '4px 0 0', fontWeight: 600 }}>{book.moodTags}</p></div>}
          </div>

          {book.description && (
            <div style={{ borderTop: '1px solid #f0ede8', paddingTop: '1.5rem' }}>
              <h5 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '0.8rem' }}>About this book</h5>
              <p style={{ color: '#555', lineHeight: 1.8, fontSize: '0.95rem' }}>{book.description}</p>
            </div>
          )}

          {book.pdfUrl && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f0ede8' }}>
              <a href={book.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #eaa451, #e58c23)', color: '#fff', padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                <i className="fa-solid fa-book-open"/> Read PDF
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
