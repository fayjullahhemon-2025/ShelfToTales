'use client';
import React, { useState, useEffect } from 'react';
import { readingRoomService } from '@/lib/api';
import Swal from 'sweetalert2';

export default function RoomMembersPanel({ roomId, isOwner, show, onClose, onInvite }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchMembers = () => { setLoading(true); readingRoomService.getMembers(roomId).then(r => setMembers(r.data || [])).catch(() => setMembers([])).finally(() => setLoading(false)); };
  useEffect(() => { if (show) fetchMembers(); }, [show, roomId]);
  if (!show) return null;

  const handleRemove = async (id, name) => {
    const r = await Swal.fire({ title: `Remove ${name}?`, text: 'They will lose access to this room.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Remove' });
    if (!r.isConfirmed) return;
    try { await readingRoomService.removeMember(roomId, id); fetchMembers(); }
    catch (e) { Swal.fire('Error', e.response?.data?.message || 'Failed', 'error'); }
  };

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 320, background: '#fff', zIndex: 1050, boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h6 style={{ margin: 0, fontWeight: 700 }}>Members ({members.length})</h6>
        <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }} aria-label="Close panel">×</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px' }}>
        {loading ? <p style={{ textAlign: 'center', color: '#888' }}>Loading…</p> :
         members.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
            <img src={m.user?.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.user?.fullName || 'U')}&background=EAA451&color=fff&size=36`} alt="" width={36} height={36} style={{ borderRadius: '50%' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.user?.fullName || 'Unknown'}</div>
              <div style={{ fontSize: '0.75rem', color: m.role === 'OWNER' ? '#EAA451' : '#888' }}>{m.role}</div>
            </div>
            {isOwner && m.role !== 'OWNER' && (
              <button onClick={() => handleRemove(m.user?.id, m.user?.fullName)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }} aria-label={`Remove ${m.user?.fullName}`}>✕</button>
            )}
          </div>
        ))}
      </div>
      {isOwner && (
        <div style={{ padding: '14px 20px', borderTop: '1px solid #f0f0f0' }}>
          <button onClick={onInvite} style={{ width: '100%', padding: 10, borderRadius: 12, border: 'none', background: '#EAA451', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Invite Friends</button>
        </div>
      )}
    </div>
  );
}
