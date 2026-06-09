'use client';

import React from 'react';
import Swal from 'sweetalert2';
import { reportService } from '@/lib/api';

/**
 * Reusable button to report flagged content (Review, Blog, Listing).
 * Opens a SweetAlert2 modal with a form that adheres to Vercel Web Interface Guidelines.
 */
export default function ReportButton({ targetType, targetId, className }) {
  const handleReportClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if user is logged in
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
    if (!token) {
      Swal.fire({
        icon: 'warning',
        title: 'Authentication Required',
        text: 'Please log in to report content.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    await Swal.fire({
      title: 'Report Content',
      html: `
        <style>
          .report-form-group {
            margin-bottom: 1.25rem;
            text-align: left;
          }
          .report-label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151;
            margin-bottom: 0.375rem;
          }
          .report-select, .report-textarea {
            width: 100%;
            padding: 0.625rem;
            font-size: 0.875rem;
            border: 1px solid #d1d5db;
            border-radius: 0.375rem;
            background-color: #fff;
            color: #111827;
            outline: none;
            box-sizing: border-box;
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
          }
          .report-select:focus-visible, .report-textarea:focus-visible {
            border-color: #3b82f6 !important;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5) !important;
          }
          .report-textarea {
            height: 100px;
            resize: vertical;
          }
        </style>
        <div class="report-form-group">
          <label for="report-reason" class="report-label">Reason</label>
          <select id="report-reason" class="report-select" autocomplete="off" required>
            <option value="" disabled selected>Select a reason…</option>
            <option value="SPAM">Spam</option>
            <option value="HARASSMENT">Harassment or Abuse</option>
            <option value="INAPPROPRIATE">Inappropriate Content</option>
            <option value="SPOILER">Spoiler without Warning</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div class="report-form-group">
          <label for="report-explanation" class="report-label">Explanation</label>
          <textarea id="report-explanation" class="report-textarea" placeholder="Please describe why this content should be reviewed…" autocomplete="off" required></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Submit Report',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      focusConfirm: false,
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const reasonElement = document.getElementById('report-reason');
        const explanationElement = document.getElementById('report-explanation');
        
        const reason = reasonElement ? reasonElement.value : '';
        const explanation = explanationElement ? explanationElement.value : '';

        if (!reason) {
          Swal.showValidationMessage('Please select a reason…');
          return false;
        }
        if (!explanation || !explanation.trim()) {
          Swal.showValidationMessage('Please enter an explanation…');
          return false;
        }

        try {
          const response = await reportService.create({
            targetType,
            targetId: parseInt(targetId, 10),
            reason,
            explanation: explanation.trim(),
          });
          return response.data;
        } catch (err) {
          const errMsg = err.response?.data?.message || 'Failed to submit report. Please try again.';
          Swal.showValidationMessage(errMsg);
          return false;
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: 'success',
          title: 'Report Submitted',
          text: 'Thank you for keeping our community safe.',
          confirmButtonColor: '#3b82f6',
          timer: 2000,
          showConfirmButton: false,
        });
      }
    });
  };

  const buttonStyle = className 
    ? { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }
    : { fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', border: 'none', background: 'none', cursor: 'pointer' };

  return (
    <button
      type="button"
      onClick={handleReportClick}
      className={className || "btn btn-link p-0 text-decoration-none text-muted"}
      style={buttonStyle}
      aria-label={`Report this ${targetType.toLowerCase()}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ verticalAlign: 'middle' }}
      >
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
      <span>Report</span>
    </button>
  );
}
