'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { reportService } from '../../lib/api';
import './Moderation.css';

export default function AdminModerationPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [processingAction, setProcessingAction] = useState(null); // 'dismiss' or 'delete'
  const [expandedReports, setExpandedReports] = useState({});

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await reportService.getPending();
      setReports(response.data || []);
    } catch (err) {
      console.error('Failed to fetch pending reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const toggleExpand = (id) => {
    setExpandedReports(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDismiss = async (reportId) => {
    setProcessingId(reportId);
    setProcessingAction('dismiss');
    try {
      await reportService.dismiss(reportId);
      Swal.fire({
        icon: 'success',
        title: 'Report Dismissed',
        text: 'The report has been cleared from the queue.',
        timer: 1500,
        showConfirmButton: false,
        confirmButtonColor: '#3b82f6'
      });
      fetchReports();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Operation Failed',
        text: err.response?.data?.message || 'Failed to dismiss report. Please try again.',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  const handleDelete = async (report) => {
    const confirmResult = await Swal.fire({
      title: 'Confirm Deletion',
      text: 'Are you sure you want to delete this content? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete Content',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
    });

    if (!confirmResult.isConfirmed) return;

    setProcessingId(report.id);
    setProcessingAction('delete');
    try {
      await reportService.action(report.id);
      
      // Parse content creator name from the preview if possible
      let creatorName = '';
      if (report.contentPreview) {
        const match = report.contentPreview.match(/Review by\s+([^on]+?)\s+on/i);
        if (match && match[1]) {
          creatorName = match[1].trim();
        }
      }

      await Swal.fire({
        icon: 'success',
        title: 'Content Deleted',
        html: `
          <div style="text-align: left; font-size: 0.95rem; line-height: 1.5; color: #374151;">
            <p>The flagged content has been successfully deleted.</p>
            <p style="margin-top: 1rem;"><strong>Issue Warning?</strong></p>
            <p>If you want to manually warn the content creator ${creatorName ? `(<strong>${creatorName}</strong>)` : ''}, copy their name and head to the User Management dashboard.</p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Go to User Management',
        cancelButtonText: 'Stay Here',
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280'
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = '/admin/users';
        }
      });

      fetchReports();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Operation Failed',
        text: err.response?.data?.message || 'Failed to delete content. Please try again.',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  const getTargetBadgeClass = (type) => {
    switch (type) {
      case 'REVIEW': return 'badge-review';
      case 'BLOG_POST': return 'badge-blog';
      case 'EXCHANGE_LISTING': return 'badge-listing';
      default: return 'bg-secondary';
    }
  };

  const formatTargetType = (type) => {
    if (!type) return '';
    return type.replace('_', ' ');
  };

  return (
    <div className="mod-container container-fluid">
      <div className="mod-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>Moderation Queue</h2>
          <p className="text-muted small mb-0">Review content flagged by users and take action</p>
        </div>
        <span className="badge bg-dark rounded-pill px-3 py-2" aria-live="polite">
          {reports.length} pending reports
        </span>
      </div>

      {loading ? (
        <div className="text-center py-5" aria-busy="true" aria-label="Loading reports…">
          <div className="spinner-border text-secondary" role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
        </div>
      ) : reports.length === 0 ? (
        <div className="card mod-card p-5 text-center text-muted">
          <div className="mb-3">
            <i className="fa-solid fa-circle-check text-success" style={{ fontSize: '3rem' }}/>
          </div>
          <h4>Queue is Clear!</h4>
          <p className="mb-0 small">No pending content reports found.</p>
        </div>
      ) : (
        <div className="card mod-card">
          <div className="table-responsive">
            <table className="table table-hover mod-table align-middle">
              <thead style={{ background: '#1a1a2e', color: '#fff' }}>
                <tr>
                  <th scope="col" className="ps-4">Type</th>
                  <th scope="col">Reason</th>
                  <th scope="col">Reporter</th>
                  <th scope="col" style={{ width: '30%' }}>Flagged Content Preview</th>
                  <th scope="col" style={{ width: '25%' }}>Explanation / Details</th>
                  <th scope="col">Date Flagged</th>
                  <th scope="col" className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  const isExpanded = !!expandedReports[report.id];
                  const isBusy = processingId === report.id;
                  
                  return (
                    <tr key={report.id}>
                      <td className="ps-4">
                        <span className={`mod-badge-type ${getTargetBadgeClass(report.targetType)}`}>
                          {formatTargetType(report.targetType)}
                        </span>
                      </td>
                      <td>
                        <span className="mod-badge-reason">
                          {report.reason}
                        </span>
                      </td>
                      <td>
                        <div className="small fw-semibold">{report.reporterName || 'Anonymous'}</div>
                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>ID: {report.reporterId}</div>
                      </td>
                      <td>
                        <div className={`mod-preview-text ${isExpanded ? 'mod-preview-expanded' : ''}`}>
                          {report.contentPreview || '[No preview available]'}
                        </div>
                        {report.contentPreview && report.contentPreview.length > 50 && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(report.id)}
                            className="btn btn-link p-0 text-decoration-none text-primary"
                            style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? "Show less content preview" : "Show full content preview"}
                          >
                            {isExpanded ? 'Show Less' : 'Show More…'}
                          </button>
                        )}
                      </td>
                      <td>
                        <div className={`mod-explanation-text ${isExpanded ? 'mod-preview-expanded' : ''}`}>
                          {report.explanation || '—'}
                        </div>
                      </td>
                      <td>
                        <span className="mod-date">
                          {report.createdAt ? new Date(report.createdAt).toLocaleString() : '—'}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex gap-2 justify-content-end">
                          <button
                            type="button"
                            className="mod-btn mod-btn-dismiss"
                            disabled={isBusy}
                            onClick={() => handleDismiss(report.id)}
                            aria-label={`Dismiss report ${report.id}`}
                          >
                            {isBusy && processingAction === 'dismiss' ? (
                              <>
                                <span className="btn-spinner" aria-hidden="true"/>
                                <span>Dismissing…</span>
                              </>
                            ) : (
                              <>
                                <i className="fa-solid fa-xmark" aria-hidden="true"/>
                                <span>Dismiss</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            className="mod-btn mod-btn-delete"
                            disabled={isBusy}
                            onClick={() => handleDelete(report)}
                            aria-label={`Delete reported content for report ${report.id}`}
                          >
                            {isBusy && processingAction === 'delete' ? (
                              <>
                                <span className="btn-spinner" aria-hidden="true"/>
                                <span>Deleting…</span>
                              </>
                            ) : (
                              <>
                                <i className="fa-solid fa-trash-can" aria-hidden="true"/>
                                <span>Delete</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
