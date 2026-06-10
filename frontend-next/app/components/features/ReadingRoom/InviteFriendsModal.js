'use client';
import React, { useState, useEffect } from 'react';
import { friendService, readingRoomService } from '@/lib/api';
import Swal from 'sweetalert2';

export default function InviteFriendsModal({ roomId, roomName, show, onClose, onInvited }) {
  const [friends, setFriends] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => { if (!show) return; setLoading(true); friendService.getFriends().then(r => setFriends(r.data?.content || r.data || [])).catch(() => setFriends([])).finally(() => setLoading(false)); }, [show]);
  if (!show) return null;

  const filtered = friends.filter(f => (f.fullName || '').toLowerCase().includes(search.toLowerCase()));
  const toggle = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const handleSend = async () => {
    if (!selected.size) return; setSending(true);
    try { await readingRoomService.invite(roomId, Array.from(selected)); Swal.fire({ icon: 'success', title: `${selected.size} invite(s) sent!`, timer: 1500, showConfirmButton: false }); onInvited?.(); onClose(); }
    catch (e) { Swal.fire({ icon: 'error', title: e.response?.data?.message || 'Failed', timer: 2000, showConfirmButton: false }); }
    finally { setSending(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '90%', maxWidth: 440, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h6 style={{ margin: 0, fontWeight: 700 }}>Invite Friends to {roomName}</h6>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }} aria-label="Close">×</button>
        </div>
        <div style={{ padding: '12px 20px' }}>
          <input type="text" placeholder="Search friends…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid #e0e0e0', fontSize: '0.9rem' }} aria-label="Search friends" />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
          {loading ? <p style={{ textAlign: 'center', color: '#888' }}>Loading…</p> :
           filtered.length === 0 ? <p style={{ textAlign: 'center', color: '#888' }}>No friends found</p> :
           filtered.map(f => (
            <div key={f.userId || f.id} onClick={() => toggle(f.userId || f.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' }}>
              <input type="checkbox" checked={selected.has(f.userId || f.id)} readOnly style={{ accentColor: '#EAA451', width: 18, height: 18 }} />
              <img src={f.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.fullName || 'U')}&background=EAA451&color=fff&size=40`} alt="" width={36} height={36} style={{ borderRadius: '50%' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{f.fullName || 'Unknown'}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSend} disabled={!selected.size || sending} style={{ padding: '8px 24px', borderRadius: 20, border: 'none', background: selected.size ? '#EAA451' : '#ccc', color: '#fff', fontWeight: 600, cursor: selected.size ? 'pointer' : 'not-allowed' }}>
            {sending ? 'Sending…' : `Send ${selected.size || ''} Invite${selected.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
