'use client';

import React from 'react';
import Link from 'next/link';

const PageTitle = ({ parentPage, childPage }) => {
  return (
    <div className="stt-page-title">
      <div className="stt-page-title-bg" />
      <div className="stt-page-title-particles">
        <span className="stt-ptcl stt-ptcl-1" />
        <span className="stt-ptcl stt-ptcl-2" />
        <span className="stt-ptcl stt-ptcl-3" />
      </div>
      <div className="container position-relative" style={{ zIndex: 2 }}>
        <div className="stt-page-title-content">
          <h1>{childPage}</h1>
          <nav aria-label="breadcrumb" className="stt-breadcrumb">
            <Link href="/">Home</Link>
            <span className="stt-breadcrumb-sep">/</span>
            <span className="stt-breadcrumb-current">{childPage}</span>
          </nav>
        </div>
      </div>

      <style jsx>{`
        .stt-page-title {
          position: relative;
          background: linear-gradient(135deg, #0f0c3d 0%, #1a1668 40%, #2d2799 100%);
          padding: 5rem 0 3.5rem;
          overflow: hidden;
        }

        .stt-page-title-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 80% 20%, rgba(234, 164, 81, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 20% 80%, rgba(2, 158, 118, 0.06) 0%, transparent 50%);
          pointer-events: none;
        }

        .stt-page-title-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .stt-ptcl {
          position: absolute;
          border-radius: 50%;
          background: rgba(234, 164, 81, 0.3);
          animation: ptclFloat 6s ease-in-out infinite;
        }

        .stt-ptcl-1 {
          width: 6px;
          height: 6px;
          top: 30%;
          left: 15%;
          animation-delay: 0s;
        }

        .stt-ptcl-2 {
          width: 4px;
          height: 4px;
          top: 60%;
          right: 20%;
          background: rgba(2, 158, 118, 0.25);
          animation-delay: 2s;
        }

        .stt-ptcl-3 {
          width: 5px;
          height: 5px;
          bottom: 25%;
          left: 60%;
          animation-delay: 4s;
        }

        @keyframes ptclFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-15px) scale(1.3); opacity: 0.7; }
        }

        .stt-page-title-content {
          text-align: center;
        }

        .stt-page-title-content h1 {
          font-family: var(--font-heading);
          font-size: 2.8rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 1rem;
          letter-spacing: -0.5px;
        }

        .stt-breadcrumb {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          font-family: var(--font-body);
          font-size: 0.88rem;
        }

        .stt-breadcrumb a {
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          transition: color 0.2s;
        }

        .stt-breadcrumb a:hover {
          color: #EAA451;
        }

        .stt-breadcrumb-sep {
          color: rgba(255, 255, 255, 0.2);
          font-size: 0.75rem;
        }

        .stt-breadcrumb-current {
          color: #EAA451;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .stt-page-title {
            padding: 4rem 0 2.5rem;
          }
          .stt-page-title-content h1 {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PageTitle;
