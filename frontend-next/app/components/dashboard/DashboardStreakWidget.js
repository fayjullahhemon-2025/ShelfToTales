'use client';
import React from 'react';
import { useApi } from '../../hooks/useApi';
import api from '../../lib/api';

export default function DashboardStreakWidget() {
  const { data, loading } = useApi(() => api.get('/streaks'));

  if (loading) return null;

  const streak = data?.data || data || { currentStreak: 0, longestStreak: 0 };
  const days = Array.from({ length: 7 }, (_, i) => i < streak.currentStreak % 7);

  return (
    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
      <div className="card-body text-center">
        <div className="mb-2">
          <span style={{ fontSize: '2.5rem' }}>🔥</span>
        </div>
        <h3 className="fw-bold mb-0" style={{ color: '#f59e0b' }}>{streak.currentStreak}</h3>
        <div className="text-muted small mb-3">Day Streak</div>
        <div className="d-flex justify-content-center gap-1 mb-3">
          {days.map((active, i) => (
            <div key={i} className="rounded-circle" style={{
              width: 12, height: 12,
              background: active ? '#f59e0b' : '#e9ecef',
              transition: 'background 0.3s'
            }} />
          ))}
        </div>
        <div className="text-muted small">
          Longest: <span className="fw-semibold">{streak.longestStreak} days</span>
        </div>
      </div>
    </div>
  );
}
