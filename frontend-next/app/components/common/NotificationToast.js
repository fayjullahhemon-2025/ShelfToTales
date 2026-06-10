'use client';
import React, { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function NotificationToast({ userId, onNavigate }) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (!userId) return;
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      onConnect: () => {
        client.subscribe(`/topic/notifications/${userId}`, (msg) => {
          const n = JSON.parse(msg.body);
          const id = Date.now();
          setToasts(prev => [...prev, { ...n, id }]);
          setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 8000);
        });
      },
    });
    client.activate();
    return () => client.deactivate();
  }, [userId]);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));
  const handleAction = (t) => {
    if (t.type === 'ROOM_INVITE' && t.referenceId) onNavigate?.(`/reading-room/${t.referenceId}`);
    else onNavigate?.('/friends');
    remove(t.id);
  };

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', padding: '16px 20px', maxWidth: 360, borderLeft: '4px solid #EAA451' }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>
            {t.type === 'ROOM_INVITE' ? '📚 Room Invite' : t.type === 'FRIEND_REQUEST' ? '👤 Friend Request' : '✅ Friend Accepted'}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#555', marginBottom: 10 }}>{t.message}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => handleAction(t)} style={{ padding: '5px 14px', borderRadius: 16, border: 'none', background: '#EAA451', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              {t.type === 'ROOM_INVITE' ? 'View Room' : 'View'}
            </button>
            <button onClick={() => remove(t.id)} style={{ padding: '5px 14px', borderRadius: 16, border: '1px solid #ddd', background: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}>Dismiss</button>
          </div>
        </div>
      ))}
    </div>
  );
}
