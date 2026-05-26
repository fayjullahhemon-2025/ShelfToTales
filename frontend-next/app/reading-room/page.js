'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { readingRoomService } from '../lib/api';
import Swal from 'sweetalert2';
import PageTitle from '../components/layout/PageTitle';

function ReadingRoom() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', description: '', bookTitle: '' });

  useEffect(() => {
    readingRoomService.getAll()
      .then(res => setRooms(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newRoom.name.trim()) return;
    try {
      const res = await readingRoomService.create(newRoom);
      setRooms([res.data, ...rooms]);
      setNewRoom({ name: '', description: '', bookTitle: '' });
      setShowCreate(false);
      Swal.fire({ icon: 'success', title: 'Room created!', timer: 1200, showConfirmButton: false });
    } catch (e) {
      Swal.fire('Error', e.response?.data?.message || 'Failed to create room', 'error');
    }
  };

  return (
    <div className="page-content bg-grey">
      <PageTitle parentPage="Community" childPage="Reading Rooms" />
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', color: '#1a1a2e' }}>Reading Rooms</h3>
            <p className="text-muted mb-0">Join a room to discuss books with other readers in real-time</p>
          </div>
          <button className="btn btn-dark rounded-pill px-4" onClick={() => setShowCreate(!showCreate)}>
            <i className="fa-solid fa-plus me-2"/>{showCreate ? 'Cancel' : 'Create Room'}
          </button>
        </div>

        {showCreate && (
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
            <div className="card-body p-4">
              <form onSubmit={handleCreate}>
                <div className="row g-3">
                  <div className="col-md-4">
                    <input type="text" className="form-control" placeholder="Room name" value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} required/>
                  </div>
                  <div className="col-md-4">
                    <input type="text" className="form-control" placeholder="Book being discussed" value={newRoom.bookTitle} onChange={e => setNewRoom({ ...newRoom, bookTitle: e.target.value })}/>
                  </div>
                  <div className="col-md-4">
                    <input type="text" className="form-control" placeholder="Short description" value={newRoom.description} onChange={e => setNewRoom({ ...newRoom, description: e.target.value })}/>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary rounded-pill mt-3 px-4">Create</button>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-secondary"/></div>
        ) : rooms.length > 0 ? (
          <div className="row g-3">
            {rooms.map(room => (
              <div key={room.id} className="col-md-6 col-lg-4">
                <Link href={`/reading-room/${room.id}`} className="text-decoration-none">
                  <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16, transition: 'all 0.3s' }}>
                    <div className="card-body p-4">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, background: 'rgba(234,164,81,0.1)' }}>
                          <i className="fa-solid fa-book-open" style={{ color: '#eaa451' }}/>
                        </div>
                        <h6 className="fw-bold mb-0" style={{ color: '#1a1a2e' }}>{room.name}</h6>
                      </div>
                      {room.bookTitle && <p className="text-muted small mb-1"><i className="fa-solid fa-bookmark me-1"/>{room.bookTitle}</p>}
                      {room.description && <p className="text-muted small mb-0">{room.description}</p>}
                      <div className="mt-3 d-flex gap-3 text-muted small">
                        <span><i className="fa-solid fa-users me-1"/>{room.memberCount || 0} members</span>
                        <span><i className="fa-solid fa-message me-1"/>{room.messageCount || 0} messages</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <i className="fa-solid fa-door-open fa-3x text-muted opacity-25 mb-3" style={{ display: 'block' }}/>
            <h5 style={{ fontFamily: 'Playfair Display, serif' }}>No reading rooms yet</h5>
            <p className="text-muted">Be the first to create a room and start a discussion!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReadingRoom;
