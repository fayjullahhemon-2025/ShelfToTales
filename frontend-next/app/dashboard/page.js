'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import PageTitle from '../components/layout/PageTitle';
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import DashboardCurrentlyReading from '../components/dashboard/DashboardCurrentlyReading';
import DashboardCategoryBreakdown from '../components/dashboard/DashboardCategoryBreakdown';
import DashboardRecentActivity from '../components/dashboard/DashboardRecentActivity';
import DashboardQuickActions from '../components/dashboard/DashboardQuickActions';
import DashboardStreakWidget from '../components/dashboard/DashboardStreakWidget';
import DashboardAchievements from '../components/dashboard/DashboardAchievements';
import ProgressRing from '../components/dashboard/ProgressRing';
import GradientStatCard from '../components/dashboard/GradientStatCard';
import { useApi } from '../hooks/useApi';
import { dashboardService } from '../lib/api';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/common/AnimationUtils';
import './Dashboard.css';

const TABS = [
  { key: 'reading', label: 'Reading', icon: 'fa-book-open' },
  { key: 'library', label: 'Library', icon: 'fa-books' },
  { key: 'shopping', label: 'Shopping', icon: 'fa-cart-shopping' },
  { key: 'activity', label: 'Activity', icon: 'fa-clock' },
];

function Dashboard() {
  const { data, loading, error, refetch } = useApi(() => dashboardService.getDashboard());
  const [activeTab, setActiveTab] = useState('reading');

  const renderSkeleton = () => (
    <div className="row g-3 mb-4">
      {[1, 2, 3, 4].map(i => (
        <div className="col-md-3 col-6" key={i}>
          <div className="card shadow-sm border-0">
            <div className="card-body placeholder-glow d-flex align-items-center gap-3">
              <div className="placeholder rounded-circle" style={{ width: '50px', height: '50px' }}></div>
              <div>
                <div className="placeholder col-8 mb-1"></div>
                <div className="placeholder col-4"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="page-content bg-grey">
        <PageTitle parentPage="User" childPage="Dashboard" />
        <div className="container py-4">{renderSkeleton()}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content bg-grey">
        <PageTitle parentPage="User" childPage="Dashboard" />
        <div className="container py-4">
          <div className="alert alert-danger d-flex align-items-center gap-3">
            <i className="fa-solid fa-triangle-exclamation fa-lg"></i>
            <span>{typeof error === 'string' ? error : 'Could not load dashboard data. Please try again.'}</span>
            <button className="btn btn-outline-danger btn-sm ms-auto" onClick={refetch}>
              <i className="fa-solid fa-rotate me-1"></i> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statCards = {
    reading: [
      { icon: 'fa-book-open', label: 'Currently Reading', value: data.totalBooksReading, color: '#0d6efd' },
      { icon: 'fa-check-circle', label: 'Books Completed', value: data.totalBooksCompleted, color: '#198754' },
      { icon: 'fa-file-lines', label: 'Pages Read', value: data.totalPagesRead.toLocaleString(), color: '#6f42c1' },
      { icon: 'fa-clock', label: 'Member Since', value: data.memberSince ? new Date(data.memberSince).getFullYear() : '-', color: '#fd7e14' },
    ],
    library: [
      { icon: 'fa-books', label: 'Bookshelves', value: data.totalBookshelves, color: '#0d6efd' },
      { icon: 'fa-book', label: 'Books Owned', value: data.totalBooksOwned, color: '#198754' },
      { icon: 'fa-tags', label: 'Categories', value: data.totalCategoriesOwned, color: '#6f42c1' },
      { icon: 'fa-layer-group', label: 'Avg per Shelf', value: data.totalBookshelves > 0 ? Math.round(data.totalBooksOwned / data.totalBookshelves) : 0, color: '#0dcaf0' },
    ],
    shopping: [
      { icon: 'fa-cart-shopping', label: 'Cart Items', value: data.cartItemCount, color: '#0d6efd' },
      { icon: 'fa-dollar-sign', label: 'Cart Value', value: data.cartTotalValue ? '$' + data.cartTotalValue : '$0', color: '#198754' },
      { icon: 'fa-heart', label: 'Wishlist', value: data.wishlistCount, color: '#dc3545' },
      { icon: 'fa-box', label: 'Orders', value: data.totalOrders, color: '#6f42c1' },
    ],
    activity: [
      { icon: 'fa-clock', label: 'Recent Activity', value: data.recentActivities?.length || 0, color: '#0d6efd' },
      { icon: 'fa-book-open', label: 'Currently Reading', value: data.totalBooksReading, color: '#198754' },
      { icon: 'fa-check-circle', label: 'Completed', value: data.totalBooksCompleted, color: '#6f42c1' },
      { icon: 'fa-dollar-sign', label: 'Total Spent', value: data.totalSpent ? '$' + data.totalSpent : '$0', color: '#fd7e14' },
    ],
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'reading':
        return (
          <div>
            <h5 className="fw-bold mb-3">Currently Reading</h5>
            <DashboardCurrentlyReading books={data.currentlyReading} />
          </div>
        );
      case 'library':
        return (
          <div>
            <h5 className="fw-bold mb-3">Books by Category</h5>
            <DashboardCategoryBreakdown categories={data.booksByCategory} />
          </div>
        );
      case 'shopping':
        return (
          <div>
            <h5 className="fw-bold mb-3">Quick Actions</h5>
            <DashboardQuickActions />
            {data.cartItemCount > 0 && (
              <div className="alert alert-info mt-3">
                <i className="fa-solid fa-info-circle me-2"></i>
                You have {data.cartItemCount} item{data.cartItemCount !== 1 ? 's' : ''} in your cart worth ${data.cartTotalValue || '0.00'}.
              </div>
            )}
          </div>
        );
      case 'activity':
        return (
          <div>
            <h5 className="fw-bold mb-3">Recent Activity</h5>
            <DashboardRecentActivity activities={data.recentActivities} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="page-content bg-grey">
      <PageTitle parentPage="User" childPage="Dashboard" />
      <FadeIn>
      <div className="container py-4">
        <div className="dashboard-welcome mb-4">
          <div className="d-flex align-items-center gap-3">
            <img src={data.profileImageUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.fullName || 'User') + '&background=9cd2ef&color=fff&size=60'}
                 alt="profile" className="rounded-circle"
                 style={{ width: '60px', height: '60px', objectFit: 'cover' }} />
            <div>
              <h2 className="fw-bold mb-0">Welcome back, {(data.fullName || 'Reader').split(' ')[0]}!</h2>
              <small className="text-muted">{data.email}</small>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          {statCards[activeTab].map((stat, idx) => (
            <div className="col-md-3 col-6" key={idx}>
              <DashboardStatCard {...stat} />
            </div>
          ))}
        </div>

        {/* Streak + Progress Ring Row */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <DashboardStreakWidget />
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100 d-flex align-items-center justify-content-center" style={{ borderRadius: 16 }}>
              <div className="card-body text-center py-4">
                <ProgressRing
                  progress={data.totalBooksCompleted ? Math.min((data.totalBooksCompleted / 24) * 100, 100) : 0}
                  size={100} color="#6f42c1"
                  label="Annual Goal"
                  sublabel={`${data.totalBooksCompleted || 0} / 24 books`}
                />
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <DashboardAchievements />
          </div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-header bg-white border-bottom px-0">
            <ul className="nav nav-tabs dashboard-tabs border-0 px-3">
              {TABS.map(tab => (
                <li className="nav-item" key={tab.key}>
                  <button className={'nav-link' + (activeTab === tab.key ? ' active' : '')}
                          onClick={() => setActiveTab(tab.key)}>
                    <i className={'fa-solid ' + tab.icon + ' me-2'}></i>{tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="card-body dashboard-tab-content">
            {renderTabContent()}
          </div>
        </div>
      </div>
      </FadeIn>
    </div>
  );
}

export default Dashboard;
