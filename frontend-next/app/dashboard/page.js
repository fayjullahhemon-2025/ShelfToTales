'use client';

export const dynamic = 'force-dynamic';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useApi } from '../hooks/useApi';
import { dashboardService, gamificationService, notificationService, goalService } from '../lib/api';
import Swal from 'sweetalert2';
import './Dashboard.css';

/* --- Mini Chart Components --- */

function GoalRing({ completed, goal }) {
  const pct = Math.min((completed / goal) * 100, 100);
  const r = 50, c = 2 * Math.PI * r;
  return (
    <div className="dash-goal-ring">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <defs><linearGradient id="goalGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#eaa451"/><stop offset="100%" stopColor="#e58c23"/></linearGradient></defs>
        <circle className="ring-bg" cx="60" cy="60" r={r}/>
        <circle className="ring-fill" cx="60" cy="60" r={r} strokeDasharray={c} strokeDashoffset={c - (pct/100)*c}/>
      </svg>
      <div className="dash-goal-text"><div className="number">{completed}</div><div className="label">of {goal}</div></div>
    </div>
  );
}

function MiniBarChart({ data, maxVal }) {
  const max = maxVal || Math.max(...data.map(d => d.value), 1);
  return (
    <div className="mini-bar-chart">
      {data.map((d, i) => (
        <div key={i} className="mini-bar-col">
          <div className="mini-bar" style={{ height: `${(d.value / max) * 100}%` }}/>
          <span className="mini-bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let cumulative = 0;
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 36 36" className="donut-svg">
        {segments.map((seg, i) => {
          const pct = (seg.value / total) * 100;
          const offset = 100 - cumulative;
          cumulative += pct;
          return <circle key={i} className="donut-seg" cx="18" cy="18" r="15.9" strokeDasharray={`${pct} ${100-pct}`} strokeDashoffset={offset} stroke={seg.color}/>;
        })}
      </svg>
      <div className="donut-center"><span>{total}</span><small>books</small></div>
    </div>
  );
}

function WeekHeatmap({ activities }) {
  const days = ['M','T','W','T','F','S','S'];
  const levels = days.map((_, i) => {
    const count = activities?.filter(a => new Date(a.date || Date.now()).getDay() === (i+1)%7).length || Math.floor(Math.random()*4);
    return count;
  });
  const max = Math.max(...levels, 1);
  return (
    <div className="week-heatmap">
      {days.map((d, i) => (
        <div key={i} className="heat-cell" style={{ opacity: 0.2 + (levels[i]/max)*0.8 }}><span>{d}</span></div>
      ))}
    </div>
  );
}

/* --- Main Dashboard --- */

function Dashboard() {
  const { data, loading, error, refetch } = useApi(() => dashboardService.getDashboard());
  const [achievements, setAchievements] = useState([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [annualGoal, setAnnualGoal] = useState(24);

  useEffect(() => {
    if (data) {
      gamificationService.getMyAchievements().then(r => setAchievements(r.data || [])).catch(() => {});
      notificationService.getUnreadCount().then(r => setUnreadNotifs(r.data?.count || r.data || 0)).catch(() => {});
      goalService.getActiveGoal().then(r => {
        if (r.data && r.data.targetCount) {
          setAnnualGoal(r.data.targetCount);
        }
      }).catch(() => {});
    }
  }, [data]);

  const handleEditGoal = async () => {
    const { value: newGoal } = await Swal.fire({
      title: 'Update Annual Reading Goal',
      input: 'number',
      inputLabel: 'How many books do you want to read this year?',
      inputValue: annualGoal,
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value || parseInt(value, 10) <= 0) {
          return 'Please enter a number greater than 0';
        }
      }
    });

    if (newGoal) {
      try {
        const targetCount = parseInt(newGoal, 10);
        await goalService.saveGoal(targetCount);
        setAnnualGoal(targetCount);
        Swal.fire({
          icon: 'success',
          title: 'Goal updated successfully',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Failed to update goal',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false
        });
      }
    }
  };

  const weeklyData = useMemo(() => {
    if (!data) return [];
    return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((label, i) => ({
      label, value: Math.floor(Math.random() * (data.totalPagesRead || 50) / 7 * (0.5 + Math.random()))
    }));
  }, [data]);

  const categoryColors = ['#eaa451','#3b82f6','#10b981','#ef4444','#8b5cf6','#f59e0b'];

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="container" style={{ maxWidth: 1200, padding: '4rem 1.5rem' }}>
          <div className="dash-stats">{[1,2,3,4].map(i => <div key={i} className="dash-stat-card skeleton-card"><div className="skel-block"/><div className="skel-line"/></div>)}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="container" style={{ maxWidth: 1200, padding: '4rem 1.5rem', textAlign: 'center' }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '2.5rem', color: '#eaa451' }}/>
          <h2 style={{ fontFamily: 'Playfair Display, serif', marginTop: 16 }}>Could not load dashboard</h2>
          <button onClick={refetch} className="dash-action-btn" style={{ display: 'inline-flex', margin: '1rem auto' }}><i className="fa-solid fa-rotate"/> Retry</button>
        </div>
      </div>
    );
  }

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const isAdmin = user.role === 'ADMIN';
  const firstName = (data.fullName || 'Reader').split(' ')[0];
  const avatarUrl = data.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName||'U')}&background=eaa451&color=fff&size=72&bold=true`;

  const stats = [
    { icon: 'fa-book-open', label: 'Reading Now', value: data.totalBooksReading||0, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { icon: 'fa-check-circle', label: 'Completed', value: data.totalBooksCompleted||0, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { icon: 'fa-file-lines', label: 'Pages Read', value: (data.totalPagesRead||0).toLocaleString(), color: '#eaa451', bg: 'rgba(234,164,81,0.1)' },
    { icon: 'fa-box', label: 'Orders', value: data.totalOrders||0, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  ];

  const categorySegments = (data.booksByCategory || []).slice(0, 5).map((cat, i) => ({
    label: cat.categoryName || cat.name, value: cat.count || cat.bookCount || 1, color: categoryColors[i]
  }));

  return (
    <div className="dashboard-page">
      <div className="container" style={{ maxWidth: 1200, padding: '0 1.5rem' }}>

        {/* Hero */}
        <div className="dash-hero">
          <div className="dash-hero-inner">
            <img src={avatarUrl} alt="" className="dash-avatar"/>
            <div>
              <h1 className="dash-greeting">Welcome back, {firstName}</h1>
              <p className="dash-subtitle">{data.email} · Member since {data.memberSince ? new Date(data.memberSince).getFullYear() : '2024'}</p>
              <span className={`dash-role-badge ${isAdmin?'admin':'user'}`}>
                <i className={`fa-solid ${isAdmin?'fa-shield-halved':'fa-book-reader'}`}/> {isAdmin?'Admin':'Reader'}
              </span>
            </div>
          </div>
        </div>

        {/* Admin Panel */}
        {isAdmin && (
          <div className="dash-admin-section dash-animate">
            <div className="dash-admin-header">
              <div><h3>Platform Analytics</h3><p>Real-time overview</p></div>
              <Link href="/admin/dashboard" className="dash-action-btn" style={{ background:'rgba(255,255,255,0.08)', color:'#eaa451', border:'1px solid rgba(234,164,81,0.3)' }}><i className="fa-solid fa-chart-line"/> Full Panel</Link>
            </div>
            <div className="dash-admin-stats">
              <div className="dash-admin-stat"><div className="value">{data.totalBooksOwned||0}</div><div className="label">Books in Catalog</div></div>
              <div className="dash-admin-stat"><div className="value">{data.totalOrders||0}</div><div className="label">Total Orders</div></div>
              <div className="dash-admin-stat"><div className="value">{data.totalCategoriesOwned||0}</div><div className="label">Categories</div></div>
              <div className="dash-admin-stat"><div className="value">${data.totalSpent||'0'}</div><div className="label">Revenue</div></div>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="dash-stats">
          {stats.map((s, i) => (
            <div key={i} className="dash-stat-card dash-animate">
              <div className="dash-stat-icon" style={{ background: s.bg, color: s.color }}><i className={`fa-solid ${s.icon}`}/></div>
              <div className="dash-stat-value">{s.value}</div>
              <div className="dash-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Analytics Row */}
        <div className="dash-analytics-row">
          <div className="dash-card dash-animate">
            <h3 className="dash-card-title">Weekly Reading</h3>
            <MiniBarChart data={weeklyData}/>
          </div>
          <div className="dash-card dash-animate">
            <h3 className="dash-card-title">By Category</h3>
            {categorySegments.length > 0 ? (
              <>
                <DonutChart segments={categorySegments}/>
                <div className="donut-legend">
                  {categorySegments.map((s,i) => <span key={i}><i style={{color:s.color}}>●</i> {s.label}</span>)}
                </div>
              </>
            ) : <p style={{color:'#8b8b9e',textAlign:'center'}}>No category data yet</p>}
          </div>
          <div className="dash-card dash-animate">
            <h3 className="dash-card-title">This Week</h3>
            <WeekHeatmap activities={data.recentActivities}/>
            <div className="week-summary">
              <div><strong>{data.totalBooksReading||0}</strong><span>In Progress</span></div>
              <div><strong>{data.cartItemCount||0}</strong><span>In Cart</span></div>
              <div><strong>{data.wishlistCount||0}</strong><span>Wishlisted</span></div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="dash-content">
          <div>
            {/* Recommendations Panel ("Ad-style" premium display) */}
            {data.recommendations && data.recommendations.length > 0 && (
              <div className="dash-card dash-animate dash-recommendations-banner mb-4">
                <div className="dash-recs-header">
                  <div>
                    <h3 className="dash-card-title mb-1" style={{ color: '#eaa451' }}>Tailored For You</h3>
                    <p className="text-muted small mb-0">AI-powered recommendations based on books you read and buy</p>
                  </div>
                  <span className="dash-recs-tag"><i className="fa-solid fa-sparkles me-1"/> AI Match</span>
                </div>
                <div className="dash-recs-grid mt-3">
                  {data.recommendations.map((book, idx) => (
                    <div key={idx} className="dash-rec-ad-card">
                      <div className="dash-rec-badge">{book.matchCategory || 'Featured Pick'}</div>
                      <div className="dash-rec-cover-wrap">
                        <img src={book.coverUrl || 'https://via.placeholder.com/150x220/EAA451/fff?text=Book'} alt={book.title} className="dash-rec-cover"/>
                      </div>
                      <div className="dash-rec-info">
                        <h5 className="dash-rec-title">{book.title}</h5>
                        <p className="dash-rec-author">by {book.author}</p>
                        {book.score > 0 && (
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, background: '#eaa451', color: '#fff', fontSize: '0.75rem', fontWeight: 600, marginBottom: 6 }}>
                            {Math.round(book.score * 100)}% Match
                          </span>
                        )}
                        <div className="dash-rec-reason">{book.reason}</div>
                        <Link href={`/shop-detail/${book.bookId}`} className="dash-rec-btn">
                          View Details <i className="fa-solid fa-arrow-right ms-1"/>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Currently Reading */}
            <div className="dash-card dash-animate">
              <h3 className="dash-card-title">Currently Reading</h3>
              {data.currentlyReading?.length > 0 ? data.currentlyReading.slice(0,4).map((book,i) => (
                <div key={i} className="dash-reading-item">
                  <img src={book.coverUrl||'/assets/images/book-placeholder.jpg'} alt="" className="dash-reading-cover"/>
                  <div style={{flex:1}}>
                    <h6 className="dash-reading-title">{book.title}</h6>
                    <p className="dash-reading-author">{book.author}</p>
                    <div className="dash-progress-bar"><div className="dash-progress-fill" style={{width:`${book.progress||35}%`}}/></div>
                  </div>
                  <span className="dash-reading-pct">{book.progress||35}%</span>
                </div>
              )) : (
                <div className="dash-empty"><i className="fa-solid fa-book-open"/><p>Start reading to see progress here</p>
                  <Link href="/books-grid-view" className="dash-action-btn"><i className="fa-solid fa-compass"/> Browse</Link></div>
              )}
            </div>

            {/* Activity */}
            <div className="dash-card dash-animate" style={{marginTop:'1.5rem'}}>
              <h3 className="dash-card-title">Recent Activity</h3>
              {data.recentActivities?.length > 0 ? data.recentActivities.slice(0,6).map((act,i) => (
                <div key={i} className="dash-activity-item">
                  <div className="dash-activity-dot" style={{background:categoryColors[i%6]}}/>
                  <span className="dash-activity-text">{act.description||act.activityType}</span>
                  <span className="dash-activity-time">{act.timeAgo||''}</span>
                </div>
              )) : <p style={{color:'#8b8b9e',textAlign:'center',padding:'1.5rem'}}>No activity yet</p>}
            </div>
          </div>

          {/* Right Sidebar */}
          <div>
            <div className="dash-streak-card dash-animate">
              <div className="dash-streak-number">{data.currentStreak||0}</div>
              <div className="dash-streak-label">Day Streak 🔥</div>
              <p style={{color:'rgba(255,255,255,0.4)',fontSize:'0.8rem',marginTop:10,marginBottom:0}}>
                {data.currentStreak > 0 ? `Best: ${data.longestStreak||data.currentStreak} days` : 'Read today to start'}
              </p>
            </div>

            <div className="dash-goal-card dash-animate" style={{marginTop:'1.5rem'}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 className="dash-goal-title" style={{ margin: 0 }}>Annual Goal</h4>
                <button 
                  onClick={handleEditGoal} 
                  style={{ background: 'none', border: 'none', color: '#eaa451', cursor: 'pointer', fontSize: '0.9rem', padding: 0 }}
                  title="Edit Goal"
                >
                  <i className="fa-solid fa-pen-to-square" />
                </button>
              </div>
              <div onClick={handleEditGoal} style={{ cursor: 'pointer' }} title="Click to edit goal">
                <GoalRing completed={data.totalBooksCompleted||0} goal={annualGoal}/>
              </div>
              <p className="dash-goal-sub">{Math.max(annualGoal-(data.totalBooksCompleted||0),0)} books remaining</p>
            </div>

            <div className="dash-card dash-animate" style={{marginTop:'1.5rem'}}>
              <h3 className="dash-card-title">Quick Actions</h3>
              <div className="dash-actions">
                <Link href="/books-grid-view" className="dash-action-btn"><i className="fa-solid fa-compass"/> Explore</Link>
                <Link href="/shop-cart" className="dash-action-btn"><i className="fa-solid fa-cart-shopping"/> Cart</Link>
                <Link href="/wishlist" className="dash-action-btn"><i className="fa-solid fa-heart"/> Wishlist</Link>
                <Link href="/reading-room" className="dash-action-btn"><i className="fa-solid fa-users"/> Rooms</Link>
                {isAdmin && <Link href="/admin/books" className="dash-action-btn"><i className="fa-solid fa-plus"/> Add Book</Link>}
                {isAdmin && <Link href="/admin/categories" className="dash-action-btn"><i className="fa-solid fa-tags"/> Manage</Link>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
