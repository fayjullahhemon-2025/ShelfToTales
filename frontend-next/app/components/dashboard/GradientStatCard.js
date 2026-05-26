'use client';
import React from 'react';
import CountUp from 'react-countup';

export default function GradientStatCard({ icon, label, value, gradient, suffix = '' }) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const isNumeric = typeof value === 'number' || !isNaN(parseFloat(value));

  return (
    <div className="card border-0 shadow-sm h-100 overflow-hidden position-relative" 
         style={{ borderRadius: '16px' }}>
      <div className="position-absolute top-0 start-0 w-100 h-100" 
           style={{ background: gradient, opacity: 0.08 }} />
      <div className="card-body d-flex align-items-center gap-3 position-relative">
        <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
             style={{ width: 52, height: 52, background: gradient }}>
          <i className={`fa-solid ${icon} text-white`} style={{ fontSize: '1.2rem' }}></i>
        </div>
        <div>
          <div className="fw-bold fs-4 lh-1 mb-1" style={{ color: '#1a1a2e' }}>
            {isNumeric ? <CountUp end={numericValue} duration={1.5} separator="," suffix={suffix} /> : value}
          </div>
          <div className="text-muted small">{label}</div>
        </div>
      </div>
    </div>
  );
}
