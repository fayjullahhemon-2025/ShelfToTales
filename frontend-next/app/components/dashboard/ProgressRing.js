'use client';
import React from 'react';

export default function ProgressRing({ progress, size = 120, strokeWidth = 10, color = '#6f42c1', label, sublabel }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <div className="d-flex flex-column align-items-center">
      <svg width={size} height={size} className="d-block">
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#e9ecef" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-in-out', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
        <text x="50%" y="50%" textAnchor="middle" dy=".3em"
          className="fw-bold" style={{ fontSize: size * 0.22, fill: '#1a1a2e' }}>
          {Math.round(progress)}%
        </text>
      </svg>
      {label && <div className="fw-semibold mt-2">{label}</div>}
      {sublabel && <div className="text-muted small">{sublabel}</div>}
    </div>
  );
}
