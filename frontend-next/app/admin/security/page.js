'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { adminSecurityService } from '../../lib/api';

const severityClass = {
  LOW: 'bg-secondary',
  MEDIUM: 'bg-warning text-dark',
  HIGH: 'bg-danger',
};

export default function AdminSecurityPage() {
  const [summary, setSummary] = useState({});
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      adminSecurityService.getSummary(),
      adminSecurityService.getEvents(50),
    ])
      .then(([summaryRes, eventsRes]) => {
        if (!active) return;
        setSummary(summaryRes.data || {});
        setEvents(eventsRes.data || []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const cards = [
    { label: 'Events 24h', value: summary.eventsLast24h || 0, icon: 'fa-shield-halved' },
    { label: 'Rate Limits', value: summary.rateLimitsLast24h || 0, icon: 'fa-gauge-high' },
    { label: 'Blocked Tokens', value: summary.blacklistedTokensLast24h || 0, icon: 'fa-ban' },
    { label: 'JWT Failures', value: summary.jwtFailuresLast24h || 0, icon: 'fa-key' },
  ];

  return (
    <div className="container-fluid py-4 px-4" style={{ background: '#f8f9fc', minHeight: '100vh' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>Security Monitoring</h2>
          <p className="text-muted mb-0">Authentication and rate-limit events</p>
        </div>
        <span className="badge bg-dark px-3 py-2 rounded-pill">
          <i className="fa-solid fa-lock me-1" /> Admin
        </span>
      </div>

      <div className="row g-3 mb-4">
        {cards.map((card) => (
          <div className="col-lg-3 col-md-6" key={card.label}>
            <div className="card border-0 shadow-sm" style={{ borderRadius: 8 }}>
              <div className="card-body d-flex align-items-center gap-3">
                <div className="rounded d-flex align-items-center justify-content-center bg-dark text-white" style={{ width: 44, height: 44 }}>
                  <i className={`fa-solid ${card.icon}`} />
                </div>
                <div>
                  <div className="fs-4 fw-bold">{card.value}</div>
                  <div className="text-muted small">{card.label}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card border-0 shadow-sm" style={{ borderRadius: 8 }}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-semibold mb-0">Recent Events</h5>
            <span className="text-muted small">{events.length} shown</span>
          </div>
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-secondary" /></div>
          ) : events.length === 0 ? (
            <div className="text-center py-5 text-muted">No security events recorded.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Severity</th>
                    <th>Type</th>
                    <th>IP</th>
                    <th>Route</th>
                    <th>Principal</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td className="text-muted small">{event.createdAt ? new Date(event.createdAt).toLocaleString() : '-'}</td>
                      <td><span className={`badge ${severityClass[event.severity] || 'bg-secondary'}`}>{event.severity}</span></td>
                      <td className="fw-semibold">{event.type?.replaceAll('_', ' ')}</td>
                      <td>{event.clientIp || '-'}</td>
                      <td><code>{event.method} {event.path}</code></td>
                      <td>{event.principal || '-'}</td>
                      <td className="text-muted small">{event.message || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
