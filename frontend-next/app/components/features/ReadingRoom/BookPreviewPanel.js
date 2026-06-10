'use client';

import React from 'react';

export default function BookPreviewPanel({ room, onOpenReader }) {
  if (!room) return null;

  return (
    <div className="rp-book-panel">
      {room.bookTitle ? (
        <>
          {room.pdfUrl && (
            <button
              className="rp-reader-btn"
              onClick={onOpenReader}
              aria-label="Open book reader"
            >
              <i className="fa-solid fa-book-open" />
              <span>Open Reader</span>
            </button>
          )}
          <h2 className="rp-book-title">{room.bookTitle}</h2>
        </>
      ) : (
        <div className="rp-no-book">
          <i className="fa-solid fa-book" />
          <p>No book selected for this room</p>
        </div>
      )}

      <div className="rp-room-info">
        <h3 className="rp-room-name">{room.name}</h3>
        {room.description && (
          <p className="rp-room-desc">{room.description}</p>
        )}
        <div className="rp-room-meta">
          <span>
            <i className="fa-solid fa-user" /> Created by {room.createdBy?.fullName || 'Unknown'}
          </span>
          {room.createdAt && (
            <span>
              <i className="fa-regular fa-calendar" />{' '}
              {new Date(room.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
