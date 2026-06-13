'use client';

import { useState } from 'react';
import Link from 'next/link';
import ReportButton from '../ReportButton';

const DEFAULT_AVATAR = '/assets/images/profile2.jpg';

/**
 * A single book review rendered with an optional spoiler blur.
 *
 * @param {object} props
 * @param {number|string} props.id Review id (used for the report button).
 * @param {string} props.title Reviewer display name.
 * @param {string} props.comment Review body.
 * @param {string} props.date ISO date string.
 * @param {number} props.rating 0-5 integer.
 * @param {string} [props.avatar] Avatar URL; falls back to a default asset.
 * @param {boolean} [props.isSpoiler=false] When true, the comment is blurred
 *   until the user explicitly reveals it.
 * @returns {JSX.Element}
 */
export default function ReviewCard({
  id,
  title,
  comment,
  date,
  rating,
  avatar,
  isSpoiler = false,
}) {
  const [revealed, setRevealed] = useState(false);
  const isBlurred = isSpoiler && !revealed;

  const handleReveal = () => setRevealed(true);

  return (
    <div className="comment-body" style={{ position: 'relative' }}>
      <div className="comment-author vcard">
        <img
          loading="lazy"
          decoding="async"
          src={avatar || DEFAULT_AVATAR}
          alt=""
          className="avatar"
          onError={(event) => {
            event.target.onerror = null;
            event.target.src = DEFAULT_AVATAR;
          }}
        />
        <cite className="fn">{title}</cite> <span className="says">says:</span>
        <div className="comment-meta" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link href="#">{new Date(date).toLocaleDateString()}</Link>
          {id && <ReportButton targetType="REVIEW" targetId={id} />}
        </div>
      </div>
      <div className="comment-content dlab-page-text" style={{ position: 'relative' }}>
        <div
          aria-hidden={isBlurred}
          style={{
            filter: isBlurred ? 'blur(6px)' : 'none',
            transition: 'filter 0.3s ease',
            pointerEvents: isBlurred ? 'none' : 'auto',
            userSelect: isBlurred ? 'none' : 'auto',
          }}
        >
          <p>{comment}</p>
        </div>
        {isBlurred && (
          <button
            type="button"
            className="fb-spoiler-reveal"
            onClick={handleReveal}
            aria-label="Reveal spoiler"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              border: '1px dashed #ff5e5e',
              borderRadius: '8px',
              cursor: 'pointer',
              padding: '10px',
              textAlign: 'center',
              zIndex: 10,
            }}
          >
            <span style={{ color: '#d9534f', fontWeight: 'bold', fontSize: '13px' }}>
              <i className="fa fa-warning" aria-hidden="true" /> Spoiler Warning
            </span>
            <span style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
              Click to reveal this review.
            </span>
          </button>
        )}
        <div className="dz-rating" style={{ marginTop: '10px' }} aria-label={`Rated ${rating} out of 5`}>
          {[...Array(5)].map((_, i) => (
            <i
              key={i}
              className={`fa fa-star ${i < rating ? 'text-yellow' : 'text-muted'}`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
