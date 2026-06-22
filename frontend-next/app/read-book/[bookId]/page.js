'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { bookService, quoteService } from '../../lib/api';
import Swal from 'sweetalert2';
import ClientOnly from '../../components/ClientOnly';
import { useReadingProgress } from '../../hooks/useReadingProgress';
import { useAuthToken } from '../../hooks/useAuthToken';
import dynamicImport from 'next/dynamic';
const PdfViewer = dynamicImport(() => import('../../components/features/PdfViewer/PdfViewer'), { ssr: false });
import '../../components/features/PdfViewer/PdfViewer.css';


function ReadBookInner() {
  const { bookId } = useParams();
  const router = useRouter();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedText, setSelectedText] = useState('');
  const [tooltipPos, setTooltipPos] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [themeStyle, setThemeStyle] = useState('sunset');
  const [submitting, setSubmitting] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [token, setToken] = useAuthToken();

  const containerRef = useRef(null);
  const numericBookId = bookId && /^\d+$/.test(String(bookId)) ? Number(bookId) : null;
  const readingProgress = useReadingProgress({ bookId: token ? numericBookId : null });

  const THEMES = {
    sunset: 'linear-gradient(135deg, #ff5e62, #ff9966)',
    midnight: 'linear-gradient(135deg, #2c3e50, #000000)',
    forest: 'linear-gradient(135deg, #11998e, #38ef7d)',
    paper: '#fcf8f2'
  };

  useEffect(() => {
    if (!bookId) return;
    bookService.getById(bookId)
      .then(async (res) => {
        const bookData = res.data;
        try {
          const readRes = await bookService.getReadInfo(bookId);
          bookData.pdfUrl = readRes.data.pdfUrl;
        } catch (err) {
          bookData.pdfUrl = null;
        }
        setBook(bookData);
      })
      .catch(() => router.push('/books-grid-view'))
      .finally(() => setLoading(false));
  }, [bookId, router]);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text && text.length > 5) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectedText(text);
      setTooltipPos({
        top: rect.top + window.scrollY - 40,
        left: rect.left + window.scrollX + (rect.width / 2) - 60
      });
    } else {
      setSelectedText('');
      setTooltipPos(null);
    }
  };

  const handleShareClick = () => {
    setShowModal(true);
    setTooltipPos(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await quoteService.share(bookId, {
        quoteText: selectedText,
        explanation: explanation.trim(),
        themeStyle: themeStyle
      });
      setShowModal(false);
      setExplanation('');
      setSelectedText('');
      window.getSelection()?.removeAllRanges();
      Swal.fire({ icon: 'success', title: 'Quote Shared!', text: 'Quote card posted to the feed.', timer: 2000, showConfirmButton: false });
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to share quote', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf8f5' }}><div className="spinner-border text-secondary"/></div>;
  if (!book) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5', padding: '2rem 1rem' }} ref={containerRef} onMouseUp={handleMouseUp}>
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
          <img
            src={book.coverUrl || '/images/book-default.jpg'}
            alt={book.title}
            style={{ maxWidth: 280, borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}
            onError={(e) => { e.target.src = '/images/book-default.jpg'; }}
          />
        </div>

        {/* Selection Tooltip */}
        {tooltipPos && token && (
          <button
            type="button"
            onClick={handleShareClick}
            style={{
              position: 'absolute',
              top: tooltipPos.top,
              left: tooltipPos.left,
              background: '#eaa451',
              color: '#fff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <i className="fa-solid fa-share-nodes"/> Create Quote Card
          </button>
        )}

        {/* Book Content */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', position: 'relative' }}>
          {/* Book Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {book.categoryName && <div><small style={{ color: '#888', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>Category</small><p style={{ margin: '4px 0 0', fontWeight: 600 }}>{book.categoryName}</p></div>}
            {book.publishedDate && <div><small style={{ color: '#888', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>Published</small><p style={{ margin: '4px 0 0', fontWeight: 600 }}>{new Date(book.publishedDate).getFullYear()}</p></div>}
            {book.isbn && <div><small style={{ color: '#888', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>ISBN</small><p style={{ margin: '4px 0 0', fontWeight: 600 }}>{book.isbn}</p></div>}
            {book.moodTags && <div><small style={{ color: '#888', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>Mood</small><p style={{ margin: '4px 0 0', fontWeight: 600 }}>{book.moodTags}</p></div>}
          </div>

          <p className="text-muted small mb-2"><i className="fa-solid fa-info-circle"/> Highlight text below to share quotes with your network</p>

          {book.description && (
            <div style={{ borderTop: '1px solid #f0ede8', paddingTop: '1.5rem' }}>
              <h5 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '0.8rem' }}>About this book</h5>
              <div style={{ color: '#333', lineHeight: 1.8, fontSize: '1.1rem', background: '#fcfcfc', border: '1px solid #f0ede8', padding: '1.5rem', borderRadius: '12px' }}>
                {book.description}
              </div>
            </div>
          )}

          {book.pdfUrl ? (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f0ede8' }}>
              {!readingMode ? (
                <button
                  onClick={() => setReadingMode(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'linear-gradient(135deg, #eaa451, #e58c23)',
                    color: '#fff', padding: '12px 24px', borderRadius: 12,
                    border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
                  }}
                >
                  <i className="fa-solid fa-book-open"/> Read PDF
                </button>
              ) : (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0" style={{ fontFamily: 'Playfair Display, serif' }}>Reading: {book.title}</h5>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setReadingMode(false)}>
                      <i className="fa-solid fa-xmark me-1" /> Close Reader
                    </button>
                  </div>
                  <PdfViewer
                    url={book.pdfUrl}
                    title={book.title}
                    initialPage={(readingProgress.currentPage || 0) + 1}
                    onPageChange={(page) => readingProgress.savePage(page - 1)}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="alert alert-warning mt-4 text-center">
              <i className="fa-solid fa-lock me-2" /> PDF reading is locked. Mark this book as received in your order history to unlock.
            </div>
          )}
        </div>
      </div>

      {/* Modal for styled Card creation */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="card border-0 shadow-lg p-4" style={{ maxWidth: '500px', width: '90%', borderRadius: '16px' }}>
            <h4 className="fw-bold mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>Create Quote Card</h4>

            {/* Live Preview Card */}
            <div style={{
              background: THEMES[themeStyle],
              color: themeStyle === 'paper' ? '#333' : '#fff',
              padding: '2rem',
              borderRadius: '12px',
              marginBottom: '1rem',
              minHeight: '150px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease'
            }}>
              <span style={{ fontSize: '1.5rem', opacity: 0.5, lineHeight: 1 }}><i className="fa-solid fa-quote-left"/></span>
              <p style={{ fontSize: '1.05rem', fontStyle: 'italic', fontWeight: 500, margin: '8px 0', fontFamily: 'Playfair Display, serif' }}>{selectedText}</p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.8rem', opacity: 0.8, marginTop: '8px' }}>
                — {book.title}
              </div>
            </div>

            <form onSubmit={handleFormSubmit}>
              {/* Theme presets picker */}
              <div className="mb-3">
                <label className="form-label fw-bold small">Choose Background</label>
                <div className="d-flex gap-2">
                  {Object.keys(THEMES).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setThemeStyle(key)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: THEMES[key],
                        border: themeStyle === key ? '2px solid #000' : '1px solid #ccc',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                      aria-label={`Style ${key}`}
                    />
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="explanation" className="form-label fw-bold small">Explanation / Thoughts</label>
                <textarea
                  id="explanation"
                  className="form-control"
                  placeholder="Add your own commentary to this quote…"
                  rows="3"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-light" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Sharing…' : 'Share to Feed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReadBookPage() {
  return (
    <ClientOnly>
      <ReadBookInner />
    </ClientOnly>
  );
}
