'use client';
import React from 'react';
import FriendButton from './FriendButton';

export default function FriendCard({ user, onFriendStateChanged }) {
  const avatar = user.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'User')}&background=EAA451&color=fff&size=80`;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <img src={avatar} alt={user.fullName || 'User'} width={48} height={48} style={{ borderRadius: '50%', objectFit: 'cover' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.fullName || 'Unknown'}</div>
        {user.email && <div style={{ fontSize: '0.8rem', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>}
      </div>
      <FriendButton userId={user.id} onStateChanged={onFriendStateChanged} />
    </div>
  );
}
