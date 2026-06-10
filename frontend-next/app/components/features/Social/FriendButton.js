'use client';
import React, { useState, useEffect } from 'react';
import { friendService } from '@/lib/api';
import Swal from 'sweetalert2';

const S = {
  base: { padding: '6px 16px', borderRadius: 20, border: 'none', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 6 },
  add: { background: '#EAA451', color: '#fff' },
  pending: { background: 'rgba(234,164,81,0.15)', color: '#EAA451' },
  friends: { background: 'rgba(34,197,94,0.15)', color: '#22c55e' },
  decline: { background: 'rgba(239,68,68,0.1)', color: '#ef4444' },
};

export default function FriendButton({ userId, onStateChanged }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    friendService.getStatus(userId).then(r => setStatus(r.data.status)).catch(() => setStatus('NONE')).finally(() => setLoading(false));
  }, [userId]);

  const act = async (fn) => {
    setBusy(true);
    try { await fn(); const r = await friendService.getStatus(userId); setStatus(r.data.status); onStateChanged?.(); }
    catch (e) { Swal.fire({ icon: 'error', title: e.response?.data?.message || 'Failed', timer: 2000, showConfirmButton: false }); }
    finally { setBusy(false); }
  };

  if (loading) return <button style={{ ...S.base, ...S.pending }} disabled>Loading…</button>;

  if (status === 'NONE')
    return <button style={{ ...S.base, ...S.add }} onClick={() => act(() => friendService.sendRequest(userId))} disabled={busy} aria-label="Add Friend">{busy ? '…' : '+ Add Friend'}</button>;
  if (status === 'REQUEST_SENT')
    return <button style={{ ...S.base, ...S.pending }} onClick={() => act(() => friendService.rejectRequest(userId))} disabled={busy} aria-label="Cancel request">{busy ? '…' : 'Request Sent'}</button>;
  if (status === 'REQUEST_RECEIVED')
    return (<div style={{ display: 'flex', gap: 6 }}>
      <button style={{ ...S.base, ...S.add }} onClick={() => act(() => friendService.acceptRequest(userId))} disabled={busy}>{busy ? '…' : 'Accept'}</button>
      <button style={{ ...S.base, ...S.decline }} onClick={() => act(() => friendService.rejectRequest(userId))} disabled={busy}>Decline</button>
    </div>);
  if (status === 'FRIENDS')
    return <button style={{ ...S.base, ...S.friends }} onClick={() => act(() => friendService.unfriend(userId))} disabled={busy} aria-label="Unfriend">{busy ? '…' : 'Friends ✓'}</button>;
  return null;
}
