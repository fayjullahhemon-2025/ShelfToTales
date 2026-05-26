'use client';
import React from 'react';
import { useApi } from '../../hooks/useApi';
import api from '../../lib/api';

const BADGE_COLORS = ['#667eea', '#f093fb', '#43e97b', '#4facfe', '#fa709a', '#a18cd1', '#f5576c', '#38f9d7', '#fee140', '#764ba2'];

export default function DashboardAchievements() {
  const { data: allData } = useApi(() => api.get('/achievements'));
  const { data: mineData } = useApi(() => api.get('/achievements/mine'));

  const all = allData?.data || [];
  const mine = mineData?.data || [];
  const earnedIds = new Set(mine.map(a => a.achievement?.id || a.achievementId));

  if (!all.length) return null;

  return (
    <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
      <div className="card-body">
        <h6 className="fw-semibold mb-3">
          <i className="fa-solid fa-medal me-2 text-warning"></i>
          Achievements ({mine.length}/{all.length})
        </h6>
        <div className="d-flex flex-wrap gap-2">
          {all.map((achievement, i) => {
            const earned = earnedIds.has(achievement.id);
            return (
              <div key={achievement.id} title={achievement.description}
                className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
                style={{
                  background: earned ? BADGE_COLORS[i % BADGE_COLORS.length] + '20' : '#f8f9fa',
                  border: earned ? `1px solid ${BADGE_COLORS[i % BADGE_COLORS.length]}40` : '1px solid #e9ecef',
                  opacity: earned ? 1 : 0.5,
                  transition: 'all 0.3s'
                }}>
                <span style={{ fontSize: '1.1rem' }}>{earned ? '🏆' : '🔒'}</span>
                <span className="small fw-medium">{achievement.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
