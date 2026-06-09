'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { donationService } from '../lib/api';
import Swal from 'sweetalert2';
import ClientOnly from '../components/ClientOnly';
import './Donations.css';

function DiscoverDonationsInner() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const res = await donationService.getAvailable();
      setDonations(res.data?.content || res.data || []);
    } catch (err) {
      console.error('Failed to load donations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const handleRequest = async (donation) => {
    const bookTitle = donation.bookTitle || donation.customTitle || 'this book';
    
    const { value: reason } = await Swal.fire({
      title: 'Request Book Donation',
      html: `
        <div style="text-align: left; font-size: 0.9rem; color: #555;">
          <p>You are requesting <strong>${bookTitle}</strong> from <strong>${donation.donorName}</strong>.</p>
          <p>Please provide a short message explaining why you'd like this book. The donor will review your message before approving.</p>
        </div>
      `,
      input: 'textarea',
      inputPlaceholder: 'Type your message to the donor here…',
      inputAttributes: {
        'aria-label': 'Type your message to the donor here',
        'autocomplete': 'off',
        'rows': '4'
      },
      showCancelButton: true,
      confirmButtonText: 'Send Request',
      confirmButtonColor: '#eaa451',
      cancelButtonColor: '#c9c5c0',
      preConfirm: (value) => {
        if (!value || !value.trim()) {
          Swal.showValidationMessage('Please write a message/reason for the donor');
        }
        return value;
      }
    });

    if (reason) {
      try {
        await donationService.request(donation.id, reason);
        await Swal.fire({
          icon: 'success',
          title: 'Request Sent!',
          text: 'Your request has been successfully sent to the donor.',
          confirmButtonColor: '#eaa451',
        });
        fetchDonations(); // Refresh the grid to remove the requested book
      } catch (err) {
        Swal.fire('Error', err.response?.data?.message || 'Failed to submit request', 'error');
      }
    }
  };

  const getConditionClass = (cond) => {
    const c = (cond || '').toLowerCase().replace(' ', '-');
    return `donations-badge-condition condition-${c}`;
  };

  const filteredDonations = donations.filter((donation) => {
    const title = (donation.bookTitle || donation.customTitle || '').toLowerCase();
    const author = (donation.bookAuthor || donation.customAuthor || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return title.includes(q) || author.includes(q);
  });

  return (
    <div className="donations-page">
      <div className="donations-container">
        
        {/* Header */}
        <header className="donations-header">
          <div className="donations-header-title">
            <h1>Book Donations</h1>
            <p>Give away your read books or find a copy donated by fellow community members.</p>
          </div>
          <div className="donations-header-actions">
            <Link href="/donations/my-donations" className="donations-btn-secondary">
              <i className="fa-solid fa-list-check" /> My Listings & Requests
            </Link>
            <Link href="/donations/donate" className="donations-btn-primary">
              <i className="fa-solid fa-hand-holding-heart" /> List a Book
            </Link>
          </div>
        </header>

        {/* Filter bar */}
        <div className="donations-filter-bar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label htmlFor="donationSearch" className="donations-label" style={{ display: 'none' }}>
              Search Donations
            </label>
            <input
              type="text"
              id="donationSearch"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or author…"
              className="donations-search-input"
              autoComplete="off"
            />
          </div>
        </div>

        {/* List Grid */}
        {loading ? (
          <div className="donations-loading">
            <div className="donations-loading-spinner" />
            <p>Loading available donations…</p>
          </div>
        ) : filteredDonations.length > 0 ? (
          <div className="donations-grid">
            {filteredDonations.map((donation) => {
              const title = donation.bookTitle || donation.customTitle;
              const author = donation.bookAuthor || donation.customAuthor;
              const coverUrl = donation.bookCoverUrl || `https://placehold.co/120x180?text=${encodeURIComponent(title || 'Book')}`;

              return (
                <article key={donation.id} className="donations-card">
                  <div className="donations-card-cover-wrapper">
                    <img
                      src={coverUrl}
                      alt={title}
                      className="donations-card-cover"
                    />
                    <span className={getConditionClass(donation.condition)}>
                      {donation.condition}
                    </span>
                  </div>
                  <div className="donations-card-body">
                    <h2 className="donations-card-title">{title}</h2>
                    <p className="donations-card-author">by {author}</p>
                    <p className="donations-card-desc">
                      {donation.description || 'No description provided by the donor.'}
                    </p>
                    
                    <div className="donations-card-meta">
                      <span className="donations-donor">
                        <i className="fa-solid fa-user" /> {donation.donorName}
                      </span>
                      <span>
                        {donation.createdAt ? new Date(donation.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRequest(donation)}
                      className="donations-request-btn"
                    >
                      <i className="fa-solid fa-circle-arrow-down" /> Request Book
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="donations-empty">
            <i className="fa-solid fa-book-open" />
            <h3>No donations found</h3>
            {searchQuery ? (
              <p>Try searching for a different title or author.</p>
            ) : (
              <p>Be the first to list a donation for the community!</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default function DiscoverDonations() {
  return (
    <ClientOnly>
      <DiscoverDonationsInner />
    </ClientOnly>
  );
}
