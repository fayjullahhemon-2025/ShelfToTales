'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { donationService } from '../../lib/api';
import Swal from 'sweetalert2';
import ClientOnly from '../../components/ClientOnly';
import './MyDonations.css';

// Subcomponent to handle individual listing cards & their async request loading
function MyListingCard({ listing, onApprove }) {
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const loadRequests = useCallback(async () => {
    if (listing.status !== 'AVAILABLE') return;
    setLoadingRequests(true);
    try {
      const res = await donationService.getRequests(listing.id);
      setRequests(res.data || []);
    } catch (err) {
      console.error('Failed to load requests for listing', listing.id, err);
    } finally {
      setLoadingRequests(false);
    }
  }, [listing.id, listing.status]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const title = listing.bookTitle || listing.customTitle;
  const author = listing.bookAuthor || listing.customAuthor;
  const coverUrl = listing.bookCoverUrl || `https://placehold.co/120x180?text=${encodeURIComponent(title || 'Book')}`;

  return (
    <div className="mydonations-card">
      <div className="mydonations-card-header">
        <div className="mydonations-card-info">
          <img src={coverUrl} alt={title} className="mydonations-card-cover" />
          <div className="mydonations-card-text">
            <h3 className="mydonations-card-title">{title}</h3>
            <span className="mydonations-card-author">by {author}</span>
            <div className="mydonations-card-meta">
              <span className="mydonations-badge badge-status-good" style={{ background: '#f1ede9', color: '#1a1a2e' }}>
                Condition: {listing.condition}
              </span>
              <span className={`mydonations-badge badge-status-${listing.status.toLowerCase()}`}>
                {listing.status}
              </span>
              <span className="mydonations-date">
                Listed: {listing.createdAt ? new Date(listing.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {listing.description && (
        <p className="mydonations-description">{listing.description}</p>
      )}

      {/* Received Requests Section */}
      {listing.status === 'AVAILABLE' && (
        <div className="mydonations-requests-section">
          <h4 className="mydonations-requests-title">Requests Received</h4>
          {loadingRequests ? (
            <p className="mydonations-no-requests">Loading requests…</p>
          ) : requests.length > 0 ? (
            <div className="mydonations-requests-list">
              {requests.map((req) => (
                <div key={req.id} className="mydonations-request-item">
                  <div>
                    <div className="mydonations-request-user">
                      {req.recipientName}
                      <span className="mydonations-request-email">({req.recipientEmail})</span>
                    </div>
                    <p className="mydonations-request-reason">
                      &ldquo;{req.reason}&rdquo;
                    </p>
                    <div className="mydonations-request-date">
                      Requested on {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => onApprove(req, title)}
                    className="mydonations-request-approve-btn"
                  >
                    Approve & Match
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mydonations-no-requests">No requests received yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

function MyDonationsInner() {
  const [activeTab, setActiveTab] = useState('listings'); // 'listings' or 'requests'
  const [listings, setListings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'listings') {
        const res = await donationService.getMyListings();
        setListings(res.data || []);
      } else {
        const res = await donationService.getMyRequests();
        setRequests(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch user donations data', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (request, bookTitle) => {
    const result = await Swal.fire({
      title: 'Approve & Match Request?',
      html: `
        <div style="text-align: left; font-size: 0.9rem; color: #555;">
          <p>Are you sure you want to donate <strong>${bookTitle}</strong> to <strong>${request.recipientName}</strong>?</p>
          <p><strong>This action is permanent:</strong></p>
          <ul>
            <li>This request will be marked as APPROVED.</li>
            <li>All other requests for this listing will be REJECTED.</li>
            <li>This donation listing status will update to MATCHED.</li>
          </ul>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Approve Match',
      confirmButtonColor: '#eaa451',
      cancelButtonColor: '#c9c5c0',
    });

    if (result.isConfirmed) {
      try {
        await donationService.approveRequest(request.id);
        await Swal.fire({
          icon: 'success',
          title: 'Donation Matched!',
          text: `You have matched this book with ${request.recipientName}.`,
          confirmButtonColor: '#eaa451',
        });
        fetchData();
      } catch (err) {
        Swal.fire('Error', err.response?.data?.message || 'Failed to approve request', 'error');
      }
    }
  };

  return (
    <div className="mydonations-page">
      <div className="mydonations-container">
        
        {/* Header */}
        <header className="mydonations-header">
          <h1 className="mydonations-title">My Donations Manager</h1>
          <Link href="/donations" className="mydonations-back-btn">
            <i className="fa-solid fa-arrow-left" /> Back to Discover
          </Link>
        </header>

        {/* Semantic Button Tabs */}
        <div className="mydonations-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'listings'}
            className={`mydonations-tab-btn ${activeTab === 'listings' ? 'active' : ''}`}
            onClick={() => setActiveTab('listings')}
          >
            My Listings
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'requests'}
            className={`mydonations-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            My Requests
          </button>
        </div>

        {/* Tab Panel */}
        {loading ? (
          <div className="donations-loading">
            <div className="donations-loading-spinner" />
            <p>Loading your donations data…</p>
          </div>
        ) : activeTab === 'listings' ? (
          <div className="mydonations-list">
            {listings.length > 0 ? (
              listings.map((listing) => (
                <MyListingCard
                  key={listing.id}
                  listing={listing}
                  onApprove={handleApprove}
                />
              ))
            ) : (
              <div className="mydonations-empty">
                <i className="fa-solid fa-hand-holding-heart" />
                <h3>No Listings Yet</h3>
                <p>You haven't listed any books for donation yet.</p>
                <Link href="/donations/donate" className="donations-btn-primary" style={{ marginTop: '1rem' }}>
                  List a Book Now
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="mydonations-list">
            {requests.length > 0 ? (
              requests.map((req) => (
                <div key={req.id} className="mydonations-card">
                  <div className="mydonations-card-header">
                    <div className="mydonations-card-text">
                      <h3 className="mydonations-card-title">{req.donationBookTitle}</h3>
                      <span className="mydonations-card-author">
                        Listed by User ID: {req.recipientId === req.recipientId ? 'Donor' : ''} (Recipient Name: {req.recipientName})
                      </span>
                      <div className="mydonations-card-meta">
                        <span className={`mydonations-badge badge-status-${req.status.toLowerCase()}`}>
                          {req.status}
                        </span>
                        <span className="mydonations-date">
                          Requested: {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mydonations-description">
                    <strong>My Request Message:</strong> &ldquo;{req.reason}&rdquo;
                  </div>
                  {req.status === 'APPROVED' && (
                    <div style={{ background: '#e3f9e5', color: '#1f7a26', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '500' }}>
                      <i className="fa-solid fa-circle-check" /> Approved! You have been matched with this copy. Please coordinate directly with the donor.
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="mydonations-empty">
                <i className="fa-solid fa-circle-arrow-down" />
                <h3>No Requests Yet</h3>
                <p>You haven't requested any book donations yet.</p>
                <Link href="/donations" className="donations-btn-primary" style={{ marginTop: '1rem' }}>
                  Explore Available Books
                </Link>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default function MyDonations() {
  return (
    <ClientOnly>
      <MyDonationsInner />
    </ClientOnly>
  );
}
