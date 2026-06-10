'use client';
export const dynamic = 'force-dynamic';
import React, { useState, useEffect } from 'react';
import { friendService, socialService } from '@/lib/api';
import FriendCard from '@/components/features/Social/FriendCard';

const TABS = ['Friends', 'Requests', 'Find Readers'];
const tabS = (active) => ({ padding: '8px 20px', borderRadius: 20, border: 'none', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', background: active ? '#EAA451' : '#f0f0f0', color: active ? '#fff' : '#666' });

export default function FriendsPage() {
  const [tab, setTab] = useState('Friends');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchFriends = () => { setLoading(true); friendService.getFriends().then(r => setFriends(r.data?.content || r.data || [])).catch(() => setFriends([])).finally(() => setLoading(false)); };
  const fetchRequests = () => { setLoading(true); friendService.getRequests().then(r => setRequests(r.data?.content || r.data || [])).catch(() => setRequests([])).finally(() => setLoading(false)); };
  const doSearch = () => { if (!search.trim()) return; setLoading(true); socialService.search(search).then(r => setSearchResults(r.data?.content || r.data || [])).catch(() => setSearchResults([])).finally(() => setLoading(false)); };

  useEffect(() => { if (tab === 'Friends') fetchFriends(); else if (tab === 'Requests') fetchRequests(); }, [tab]);

  return (
    <div className="container py-4" style={{ maxWidth: 800 }}>
      <h2 className="fw-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>My Friends</h2>
      <div className="d-flex gap-2 mb-4">
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} style={tabS(tab === t)}>{t}</button>)}
      </div>

      {tab === 'Find Readers' && (
        <div className="mb-4">
          <div className="input-group">
            <input type="text" className="form-control" placeholder="Search readers…" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} />
            <button className="btn btn-primary" style={{ background: '#EAA451', borderColor: '#EAA451' }} onClick={doSearch}>Search</button>
          </div>
        </div>
      )}

      {loading ? <div className="text-center py-5"><div className="spinner-border text-secondary" /></div> : (
        <div className="d-flex flex-column gap-3">
          {tab === 'Friends' && (friends.length ? friends.map(f => <FriendCard key={f.userId || f.id} user={f} onFriendStateChanged={fetchFriends} />) : <p className="text-center text-muted py-5">No friends yet. Find readers to connect with!</p>)}
          {tab === 'Requests' && (requests.length ? requests.map(r => <FriendCard key={r.requestId || r.id} user={r} onFriendStateChanged={fetchRequests} />) : <p className="text-center text-muted py-5">No pending requests</p>)}
          {tab === 'Find Readers' && (searchResults.length ? searchResults.map(u => <FriendCard key={u.id} user={u} onFriendStateChanged={() => doSearch()} />) : <p className="text-center text-muted py-5">Search for readers by name</p>)}
        </div>
      )}
    </div>
  );
}
