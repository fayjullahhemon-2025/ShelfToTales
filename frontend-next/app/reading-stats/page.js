'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { dashboardService, gamificationService, goalService } from '../lib/api';
import PageTitle from '../components/layout/PageTitle';

export default function ReadingStats() {
  const [data, setData] = useState(null);
  const [streak, setStreak] = useState(null);
  const [annualGoal, setAnnualGoal] = useState(24);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardService.getDashboard().catch(() => ({ data: {} })),
      gamificationService.getStreak().catch(() => ({ data: {} })),
      goalService.getActiveGoal().catch(() => ({ data: {} })),
    ]).then(([d, s, g]) => {
      setData(d.data);
      setStreak(s.data);
      if (g.data && g.data.targetCount) {
        setAnnualGoal(g.data.targetCount);
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-content bg-grey"><PageTitle parentPage="Reading" childPage="Statistics"/><div className="container py-5 text-center"><div className="spinner-border text-secondary"/></div></div>;

  const stats = [
    { label: 'Books Completed', value: data?.totalBooksCompleted || 0, icon: '📚' },
    { label: 'Currently Reading', value: data?.totalBooksReading || 0, icon: '📖' },
    { label: 'Pages Read', value: (data?.totalPagesRead || 0).toLocaleString(), icon: '📄' },
    { label: 'Day Streak', value: streak?.currentStreak || data?.currentStreak || 0, icon: '🔥' },
    { label: 'Longest Streak', value: streak?.longestStreak || 0, icon: '⭐' },
    { label: 'Bookshelves', value: data?.totalBookshelves || 0, icon: '🗂️' },
    { label: 'Categories Read', value: data?.totalCategoriesOwned || 0, icon: '🏷️' },
    { label: 'Total Orders', value: data?.totalOrders || 0, icon: '📦' },
  ];

  const categories = data?.booksByCategory || [];
  const goalPct = Math.min(((data?.totalBooksCompleted || 0) / annualGoal) * 100, 100);

  return (
    <div className="page-content" style={{ background: '#0f0f1a', minHeight: '100vh' }}>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#fff', margin: 0 }}>Reading Statistics</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', margin: '4px 0 0', fontSize: '0.85rem' }}>Your reading journey at a glance</p>
          </div>
          <span style={{ background: 'rgba(234,164,81,0.15)', color: '#eaa451', padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600 }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="row g-3 mb-4">
          {stats.map((s, i) => (
            <div key={i} className="col-6 col-md-3">
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', fontWeight: 700, color: '#fff' }}>{s.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-3">
          {/* Annual Goal */}
          <div className="col-md-6">
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '2rem' }}>
              <h5 style={{ color: '#fff', fontFamily: 'Playfair Display, serif', marginBottom: '1.5rem' }}>Annual Reading Goal</h5>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ position: 'relative', width: 100, height: 100 }}>
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#eaa451" strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${goalPct * 2.64} ${264 - goalPct * 2.64}`} transform="rotate(-90 50 50)"/>
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>{data?.totalBooksCompleted || 0}</span>
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>of {annualGoal}</span>
                  </div>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: 0 }}>{Math.round(goalPct)}% complete</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', margin: '4px 0 0' }}>{Math.max(annualGoal - (data?.totalBooksCompleted || 0), 0)} books remaining this year</p>
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="col-md-6">
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '2rem' }}>
              <h5 style={{ color: '#fff', fontFamily: 'Playfair Display, serif', marginBottom: '1.5rem' }}>Books by Category</h5>
              {categories.length > 0 ? categories.slice(0, 5).map((cat, i) => {
                const colors = ['#eaa451', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];
                const max = Math.max(...categories.map(c => c.count || c.bookCount || 1));
                const val = cat.count || cat.bookCount || 0;
                return (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem' }}>{cat.categoryName || cat.name}</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>{val}</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 6 }}>
                      <div style={{ height: '100%', width: `${(val / max) * 100}%`, background: colors[i % 5], borderRadius: 6, transition: 'width 1s ease' }}/>
                    </div>
                  </div>
                );
              }) : <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>No category data yet</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
