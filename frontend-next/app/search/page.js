'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSearch } from '../hooks/useSearch';
import { searchService } from '../lib/api';
import './SearchResults.css';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const tabParam = searchParams.get('tab') || '';

  const [activeTab, setActiveTab] = useState(tabParam || 'all');
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [imageResults, setImageResults] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  const { data, loading, signals, run } = useSearch({ debounceMs: 250 });
  const textResults = data?.results || [];
  const total = data?.total ?? 0;

  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
  }, [tabParam]);

  useEffect(() => {
    if (!query.trim()) return;
    run(query, { page: 0, size: 24, sortBy: 'title', sortDir: 'asc' });
  }, [query, run]);

  const handleImageSearch = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(URL.createObjectURL(file));
    setImageSearchLoading(true);
    setActiveTab('image');
    try {
      const res = await searchService.imageSearch(file);
      setImageResults(
        (res.data.results || []).map((b) => ({
          id: b.bookId,
          title: b.title,
          author: b.author,
          coverUrl: b.coverUrl,
          distance: b.distance,
        }))
      );
    } catch {
      setImageResults([]);
    } finally {
      setImageSearchLoading(false);
    }
  };

  if (!query.trim() && activeTab !== 'image') {
    return (
      <div className="sr-page">
        <div className="sr-container">
          <div className="sr-empty">
            <i className="fa-solid fa-magnifying-glass" />
            <h3>Search for books</h3>
            <p>Enter a title, author, ISBN, or description above</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sr-page">
      <div className="sr-container">
        <div className="sr-header">
          <h1>
            {query.trim() ? (
              <>
                Search results for <span className="sr-query">&ldquo;{query}&rdquo;</span>
              </>
            ) : (
              <>Search by Image</>
            )}
          </h1>
          {query.trim() && (
            <p>
              Found {total} book{total !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {signals?.semantic === 'degraded' && (
          <div className="sr-banner sr-banner-warn" role="status">
            <i className="fa-solid fa-triangle-exclamation me-2" />
            Semantic search is temporarily unavailable. Showing text matches only.
          </div>
        )}

        <div className="sr-tabs">
          <button
            className={`sr-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All ({total})
          </button>
          <button
            className={`sr-tab ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => setActiveTab('text')}
          >
            Title/Author ({textResults.length})
          </button>
          <button
            className={`sr-tab ${activeTab === 'semantic' ? 'active' : ''}`}
            onClick={() => setActiveTab('semantic')}
          >
            Semantic ({textResults.length})
          </button>
          <button
            className={`sr-tab ${activeTab === 'image' ? 'active' : ''}`}
            onClick={() => setActiveTab('image')}
          >
            <i className="fa-solid fa-camera me-1" /> Image
          </button>
        </div>

        {activeTab === 'image' && (
          <div className="sr-image-upload-section text-center py-5">
            {selectedImage ? (
              <div className="mb-3">
                <img src={selectedImage} alt="Search reference" style={{ maxHeight: '200px', borderRadius: '8px' }} />
              </div>
            ) : (
              <div className="mb-3">
                <i className="fa-solid fa-cloud-arrow-up fa-3x text-muted mb-3" />
                <p className="text-muted">Upload a book cover to find similar books</p>
              </div>
            )}
            <label className="btn btn-outline-primary">
              <i className="fa-solid fa-camera me-2" />
              {selectedImage ? 'Upload Different Image' : 'Choose Image'}
              <input
                type="file"
                accept="image/*"
                className="d-none"
                onChange={handleImageSearch}
              />
            </label>
          </div>
        )}

        {activeTab === 'image' && imageSearchLoading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" />
            <p className="mt-2 text-muted">Finding similar books...</p>
          </div>
        )}

        {activeTab === 'image' && !imageSearchLoading && imageResults.length > 0 && (
          <div className="sr-results-section">
            <h5 className="mb-4">Similar Books ({imageResults.length})</h5>
            <div className="sr-grid">
              {imageResults.map((book) => (
                <div key={book.id} className="sr-card">
                  <div className="sr-card-img">
                    <Link href={`/shop-detail/${book.id}`}>
                      <img
                        src={
                          book.coverUrl ||
                          `https://via.placeholder.com/250x350/EAA451/fff?text=${encodeURIComponent(
                            book.title?.substring(0, 8) || 'Book'
                          )}`
                        }
                        alt={book.title}
                        loading="lazy"
                      />
                    </Link>
                    {book.distance != null && (
                      <span className="sr-card-score">Distance: {book.distance}</span>
                    )}
                  </div>
                  <div className="sr-card-body">
                    <Link href={`/shop-detail/${book.id}`} className="sr-card-title">
                      {book.title}
                    </Link>
                    <p className="sr-card-author">{book.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'image' && !imageSearchLoading && selectedImage && imageResults.length === 0 && (
          <div className="sr-empty">
            <i className="fa-solid fa-face-frown" />
            <h3>No similar books found</h3>
            <p>Try uploading a clearer image of a book cover.</p>
          </div>
        )}

        {activeTab !== 'image' && (
          loading ? (
            <div className="sr-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="sr-skeleton-card">
                  <div className="sr-skel-img" />
                  <div className="sr-skel-text" />
                  <div className="sr-skel-text short" />
                </div>
              ))}
            </div>
          ) : textResults.length > 0 ? (
            <div className="sr-grid">
              {textResults.map((book) => (
                <div key={book.id} className="sr-card">
                  <div className="sr-card-img">
                    <Link href={`/shop-detail/${book.id}`}>
                      <img
                        src={
                          book.coverUrl ||
                          `https://via.placeholder.com/250x350/EAA451/fff?text=${encodeURIComponent(
                            book.title?.substring(0, 8) || 'Book'
                          )}`
                        }
                        alt={book.title}
                        loading="lazy"
                      />
                    </Link>
                    {book.matchedSources?.includes('text') && book.matchedSources?.includes('semantic') && (
                      <span className="sr-card-score">Text + semantic match</span>
                    )}
                  </div>
                  <div className="sr-card-body">
                    <Link href={`/shop-detail/${book.id}`} className="sr-card-title">
                      {book.title}
                    </Link>
                    <p className="sr-card-author">{book.author}</p>
                    {book.categoryName && (
                      <span className="sr-card-category">{book.categoryName}</span>
                    )}
                    {book.price != null && (
                      <div className="sr-card-price">${book.price}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sr-empty">
              <i className="fa-solid fa-book-open" />
              <h3>No books found</h3>
              <p>Try different keywords or check your spelling</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default SearchResults;
