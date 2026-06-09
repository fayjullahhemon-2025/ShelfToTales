'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { bookService, donationService } from '../../lib/api';
import Swal from 'sweetalert2';
import ClientOnly from '../../components/ClientOnly';
import './Donate.css';

function DonateBookInner() {
  const router = useRouter();
  const [isManual, setIsManual] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [customTitle, setCustomTitle] = useState('');
  const [customAuthor, setCustomAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('Good');
  
  const [submitting, setSubmitting] = useState(false);
  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close autocomplete dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autocomplete catalog search
  useEffect(() => {
    if (isManual || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await bookService.search(searchQuery);
        const list = res.data?.content || res.data || [];
        setSearchResults(list);
        setShowDropdown(true);
      } catch (err) {
        console.error('Failed to search books', err);
      } finally {
        setSearching(false);
      }
    }, 300);
    
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery, isManual]);

  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleClearSelectedBook = () => {
    setSelectedBook(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isManual && !selectedBook) {
      Swal.fire('Warning', 'Please select a book from the catalog or toggle manual entry.', 'warning');
      return;
    }

    if (isManual && (!customTitle.trim() || !customAuthor.trim())) {
      Swal.fire('Warning', 'Please enter custom book title and author.', 'warning');
      return;
    }

    setSubmitting(true);
    const payload = {
      bookId: isManual ? null : selectedBook.id,
      customTitle: isManual ? customTitle : null,
      customAuthor: isManual ? customAuthor : null,
      description: description,
      condition: condition,
    };

    try {
      await donationService.create(payload);
      await Swal.fire({
        icon: 'success',
        title: 'Donation Listed!',
        text: 'Your book has been successfully listed for donation.',
        confirmButtonColor: '#eaa451',
      });
      router.push('/donations');
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to list donation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="donate-page">
      <div className="donate-container">
        <div className="donate-card">
          <h1 className="donate-title">Donate a Book</h1>
          <p className="donate-subtitle">Share the joy of reading. List your book for another reader in the community.</p>

          <form onSubmit={handleSubmit} className="donate-form">
            
            {/* Toggle Switch */}
            <div className="donate-toggle-container" onClick={() => {
              setIsManual(!isManual);
              setSelectedBook(null);
            }}>
              <input
                type="checkbox"
                id="isManual"
                checked={isManual}
                onChange={() => {}}
                className="donate-toggle-input"
              />
              <div className="donate-toggle-switch" />
              <span className="donate-toggle-text">Book is not in the store catalog (Enter details manually)</span>
            </div>

            {/* Catalog Book Search (Autocomplete) */}
            {!isManual && !selectedBook && (
              <div className="donate-group donate-search-wrapper" ref={dropdownRef}>
                <label htmlFor="catalogSearch" className="donate-label">Search Catalog</label>
                <input
                  type="text"
                  id="catalogSearch"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Type book title or author…"
                  className="donate-input"
                  autoComplete="off"
                />
                {searching && <div className="donate-search-spinner" />}
                
                {showDropdown && searchQuery.trim().length >= 2 && (
                  <ul className="donate-dropdown">
                    {searchResults.length > 0 ? (
                      searchResults.map((book) => (
                        <li
                          key={book.id}
                          onClick={() => handleSelectBook(book)}
                          className="donate-dropdown-item"
                        >
                          <img
                            src={book.coverUrl || `https://placehold.co/120x180?text=${encodeURIComponent(book.title)}`}
                            alt={book.title}
                            className="donate-dropdown-img"
                          />
                          <div className="donate-dropdown-info">
                            <span className="donate-dropdown-title">{book.title}</span>
                            <span className="donate-dropdown-author">by {book.author}</span>
                          </div>
                        </li>
                      ))
                    ) : (
                      !searching && <li className="donate-dropdown-no-results">No books found</li>
                    )}
                  </ul>
                )}
              </div>
            )}

            {/* Selected Book display */}
            {!isManual && selectedBook && (
              <div className="donate-group">
                <label className="donate-label">Selected Book</label>
                <div className="donate-selected-book">
                  <img
                    src={selectedBook.coverUrl || `https://placehold.co/120x180?text=${encodeURIComponent(selectedBook.title)}`}
                    alt={selectedBook.title}
                    className="donate-selected-cover"
                  />
                  <div className="donate-selected-details">
                    <div className="donate-selected-title">{selectedBook.title}</div>
                    <div className="donate-selected-author">by {selectedBook.author}</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSelectedBook}
                    className="donate-clear-btn"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}

            {/* Manual Fields */}
            {isManual && (
              <>
                <div className="donate-group">
                  <label htmlFor="customTitle" className="donate-label">Book Title *</label>
                  <input
                    type="text"
                    id="customTitle"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Enter book title…"
                    className="donate-input"
                    autoComplete="off"
                    required
                  />
                </div>
                
                <div className="donate-group">
                  <label htmlFor="customAuthor" className="donate-label">Author *</label>
                  <input
                    type="text"
                    id="customAuthor"
                    value={customAuthor}
                    onChange={(e) => setCustomAuthor(e.target.value)}
                    placeholder="Enter author name…"
                    className="donate-input"
                    autoComplete="off"
                    required
                  />
                </div>
              </>
            )}

            {/* Condition Field */}
            <div className="donate-group">
              <label htmlFor="condition" className="donate-label">Book Condition *</label>
              <select
                id="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="donate-select"
                required
              >
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>

            {/* Description Field */}
            <div className="donate-group">
              <label htmlFor="description" className="donate-label">Description / Notes</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share info about the condition, edition, or drop-off/delivery notes…"
                className="donate-textarea"
                rows={4}
                autoComplete="off"
              />
            </div>

            {/* Action Buttons */}
            <div className="donate-actions">
              <Link href="/donations" className="donate-cancel-btn">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="donate-submit-btn"
              >
                {submitting ? (
                  <>
                    <div className="donate-btn-spinner" />
                    <span>Listing…</span>
                  </>
                ) : (
                  <span>List for Donation</span>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

export default function DonateBook() {
  return (
    <ClientOnly>
      <DonateBookInner />
    </ClientOnly>
  );
}
