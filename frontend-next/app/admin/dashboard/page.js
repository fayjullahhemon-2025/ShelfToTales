'use client';
export const dynamic = 'force-dynamic';

import React from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import GradientStatCard from '../../components/dashboard/GradientStatCard';
import { useApi } from '../../hooks/useApi';
import api from '../../lib/api';
import { FadeIn, StaggerContainer, StaggerItem } from '../../components/common/AnimationUtils';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function AdminDashboardPage() {
  const { data, loading, error } = useApi(() => api.get('/admin/analytics/dashboard'));

  if (loading) return (
    <div className="container-fluid py-4 px-4">
      <h2 className="fw-bold mb-4">Admin Dashboard</h2>
      <div className="row g-3">{[1,2,3,4,5,6].map(i => (
        <div className="col-lg-2 col-md-4 col-6" key={i}>
          <div className="card border-0 shadow-sm" style={{borderRadius:16,height:100}}>
            <div className="card-body placeholder-glow"><span className="placeholder col-8"></span></div>
          </div>
        </div>
      ))}</div>
    </div>
  );

  if (error) return (
    <div className="container-fluid py-4 px-4">
      <div className="alert alert-danger">Failed to load analytics. Ensure you have ADMIN role.</div>
    </div>
  );

  const stats = data?.data || data || {};

  const statCards = [
    { icon: 'fa-users', label: 'Total Users', value: stats.totalUsers || 0, gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
    { icon: 'fa-book', label: 'Total Books', value: stats.totalBooks || 0, gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
    { icon: 'fa-shopping-bag', label: 'Total Orders', value: stats.totalOrders || 0, gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
    { icon: 'fa-dollar-sign', label: 'Revenue', value: stats.totalRevenue || 0, gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)', suffix: '৳' },
    { icon: 'fa-exchange-alt', label: 'Exchanges', value: stats.totalExchangeListings || 0, gradient: 'linear-gradient(135deg, #fa709a, #fee140)' },
    { icon: 'fa-trophy', label: 'Challenges', value: stats.totalChallenges || 0, gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
  ];

  // Mock chart data (in production, fetch from a time-series endpoint)
  const revenueChart = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Orders',
      data: [12, 19, 8, 15, 22, 30, 18],
      backgroundColor: 'rgba(79, 172, 254, 0.6)',
      borderRadius: 8,
    }]
  };

  const usersChart = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'New Users',
      data: [30, 45, 60, 80, 120, 150],
      borderColor: '#667eea',
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      fill: true,
      tension: 0.4,
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, grid: { color: '#f0f0f0' } }, x: { grid: { display: false } } }
  };

  return (
    <div className="container-fluid py-4 px-4" style={{ background: '#f8f9fc', minHeight: '100vh' }}>
      <FadeIn>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>Admin Dashboard</h2>
            <p className="text-muted mb-0">Platform overview and analytics</p>
          </div>
          <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">
            <i className="fa-solid fa-shield-halved me-1"></i> Admin
          </span>
        </div>
      </FadeIn>

      <StaggerContainer>
        <div className="row g-3 mb-4">
          {statCards.map((card, i) => (
            <StaggerItem key={i} className="col-lg-2 col-md-4 col-6">
              <GradientStatCard {...card} />
            </StaggerItem>
          ))}
        </div>
      </StaggerContainer>

      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
            <div className="card-body">
              <h6 className="fw-semibold mb-3"><i className="fa-solid fa-chart-bar me-2 text-primary"></i>Weekly Orders</h6>
              <Bar data={revenueChart} options={chartOptions} height={200} />
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
            <div className="card-body">
              <h6 className="fw-semibold mb-3"><i className="fa-solid fa-chart-line me-2 text-success"></i>User Growth</h6>
              <Line data={usersChart} options={chartOptions} height={200} />
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <div className="card-body">
          <h6 className="fw-semibold mb-3"><i className="fa-solid fa-clock-rotate-left me-2 text-warning"></i>Quick Stats</h6>
          <div className="row text-center">
            <div className="col-md-3 col-6 mb-3">
              <div className="fs-3 fw-bold text-primary">{stats.totalReviews || 0}</div>
              <div className="text-muted small">Total Reviews</div>
            </div>
            <div className="col-md-3 col-6 mb-3">
              <div className="fs-3 fw-bold text-success">{stats.totalBooks || 0}</div>
              <div className="text-muted small">Books in Catalog</div>
            </div>
            <div className="col-md-3 col-6 mb-3">
              <div className="fs-3 fw-bold text-warning">{stats.totalExchangeListings || 0}</div>
              <div className="text-muted small">Active Exchanges</div>
            </div>
            <div className="col-md-3 col-6 mb-3">
              <div className="fs-3 fw-bold text-info">{stats.totalChallenges || 0}</div>
              <div className="text-muted small">Reading Challenges</div>
            </div>
          </div>
          <div className="text-end">
            <a href="/admin/security" className="btn btn-sm btn-dark rounded-pill px-3">
              <i className="fa-solid fa-shield-halved me-1" /> Security Monitor
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
