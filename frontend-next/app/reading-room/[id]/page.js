'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { readingRoomService } from '../../lib/api';
import { useLofi } from '../../contexts/LofiContext';
import './RoomChat.css';

if (typeof window !== 'undefined' && typeof window.global === 'undefined') window.global = window;

export default function ReadingRoomDetail() {
  const { id } = useParams();
  const router = useRouter();
  const roomId = id ? parseInt(id, 10) : null;

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [user, setUser] = useState(null);
  const [connected, setConnected] = useState(false);
  const [members] = useState(Math.floor(Math.random() * 8) + 2);
  const [showReader, setShowReader] = useState(false);

  const {
    isPlaying,
    currentTrack,
    ambientStates,
    ambientSounds,
    nextTrack,
    prevTrack,
    togglePlay,
    volume,
    setVolume,
    toggleAmbient
  } = useLofi();

  const stompRef = useRef(null);
  const chatEnd = useRef(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { router.push('/shop-login'); return; }
    setUser(JSON.parse(u));
    if (!roomId) { router.push('/reading-room'); return; }

    // Fetch room + messages
    (async () => {
      try {
        const rooms = await readingRoomService.getAll();
        const found = (rooms.data || []).find(r => r.id === roomId);
        if (found) setRoom(found); else router.push('/reading-room');
        const msgs = await readingRoomService.getMessages(roomId);
        setMessages(msgs.data || []);
      } catch { router.push('/reading-room'); }
    })();

    // WebSocket
    const client = new Client({
      webSocketFactory: () => new SockJS(`http://${process.env.NEXT_PUBLIC_WS_URL || 'localhost:8080'}/ws`),
      reconnectDelay: 5000,
    });
    client.onConnect = () => {
      setConnected(true);
      stompRef.current = client;
      client.subscribe(`/topic/room/${roomId}`, (msg) => {
        const m = JSON.parse(msg.body);
        setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]);
      });
    };
    client.onDisconnect = () => setConnected(false);
    client.activate();
    return () => client.deactivate();
  }, [roomId, router]);

  useEffect(() => {
    if (typeof chatEnd.current?.scrollIntoView === 'function') {
      chatEnd.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const send = (e) => {
    e?.preventDefault();
    if (!newMsg.trim() || !stompRef.current || !connected) return;
    stompRef.current.publish({ destination: `/app/chat/${roomId}`, body: JSON.stringify({ content: newMsg, senderEmail: user.email }) });
    setNewMsg('');
  };

  if (!room) return <div className="rc-page"><div className="rc-loading"><div className="spinner-border text-secondary"/></div></div>;

  return (
    <div className="rc-page">
      {/* Header */}
      <header className="rc-header">
        <button className="rc-back" onClick={() => router.push('/reading-room')}><i className="fa-solid fa-arrow-left"/></button>
        <div className="rc-header-info">
          <h1 className="rc-room-name">{room.name}</h1>
          <span className="rc-room-meta">{room.bookTitle || 'Open Discussion'} · {members} members</span>
        </div>
        <div className="rc-header-right">
          {room.pdfUrl && (
            <button className="btn btn-outline-primary btn-sm rounded-pill me-3" onClick={() => setShowReader(!showReader)}>
              <i className={`fa-solid ${showReader ? 'fa-square-minus' : 'fa-book-open'} me-1`}/>
              {showReader ? 'Close Reader' : 'Open Reader'}
            </button>
          )}
          <span className={`rc-status ${connected ? 'live' : ''}`}>{connected ? '● Live' : '○ Offline'}</span>
        </div>
      </header>

      <div className="rc-body">
        {showReader && room.pdfUrl && (
          <div className="rc-reader-pane">
            <iframe src={room.pdfUrl} title={room.bookTitle || 'Book PDF'} />
          </div>
        )}

        <div className="rc-content-wrapper">
          {/* Chat */}
          <main className="rc-chat">
            <div className="rc-messages">
              {messages.length === 0 ? (
                <div className="rc-empty">
                  <i className="fa-solid fa-comments"/>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : messages.map((msg, i) => {
                const isMe = msg.sender?.email === user?.email;
                return (
                  <div key={msg.id || i} className={`rc-msg ${isMe ? 'mine' : ''}`}>
                    {!isMe && <div className="rc-msg-avatar">{(msg.sender?.fullName || '?')[0]}</div>}
                    <div className="rc-msg-bubble">
                      {!isMe && <span className="rc-msg-name">{msg.sender?.fullName || 'Reader'}</span>}
                      <p className="rc-msg-text">{msg.content}</p>
                      <span className="rc-msg-time">{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEnd}/>
            </div>

            {/* Input */}
            <form className="rc-input" onSubmit={send}>
              <input type="text" placeholder="Type a message..." value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) send(e); }}/>
              <button type="submit" disabled={!newMsg.trim()}><i className="fa-solid fa-paper-plane"/></button>
            </form>
          </main>

          {/* Sidebar */}
          <aside className="rc-sidebar">
            <div className="rc-sidebar-section">
              <h4>About this room</h4>
              {room.bookTitle && <div className="rc-book-badge"><i className="fa-solid fa-book-open"/> {room.bookTitle}</div>}
              <p className="rc-desc">{room.description || 'A space for readers to discuss and share thoughts.'}</p>
            </div>

            {/* Lofi Session */}
            <div className="rc-sidebar-section lofi-widget">
              <h4>Lofi Session</h4>
              <div className="lofi-player-box p-3 rounded mb-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="fw-bold small text-truncate mb-2 text-light" style={{ fontSize: '0.82rem' }}>
                  <i className="fa-solid fa-music text-warning me-2"/>
                  {currentTrack?.title || 'Not Playing'}
                </p>
                <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
                  <button type="button" className="btn btn-sm btn-dark rounded-circle" onClick={prevTrack} style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', border: 'none', width: '30px', height: '30px', padding: 0 }}>
                    <i className="fa-solid fa-backward"/>
                  </button>
                  <button type="button" className="btn btn-sm btn-primary rounded-circle" style={{ width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onClick={togglePlay}>
                    <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}/>
                  </button>
                  <button type="button" className="btn btn-sm btn-dark rounded-circle" onClick={nextTrack} style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', border: 'none', width: '30px', height: '30px', padding: 0 }}>
                    <i className="fa-solid fa-forward"/>
                  </button>
                </div>
                <div>
                  <label className="form-label small text-muted mb-1 d-flex justify-content-between" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                    Volume <span>{Math.round(volume * 100)}%</span>
                  </label>
                  <input type="range" className="form-range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(parseFloat(e.target.value))}/>
                </div>
              </div>
              
              <h5 className="small fw-bold mb-2 text-light" style={{ fontSize: '0.8rem', opacity: 0.8 }}>Ambient Toggles</h5>
              <div className="ambient-sounds d-flex flex-wrap gap-2">
                {ambientSounds && ambientSounds.map(sound => {
                  const state = ambientStates?.[sound.id] || { active: false, volume: 0.5 };
                  return (
                    <button
                      key={sound.id}
                      type="button"
                      className={`btn btn-xs rounded-pill px-3 py-1 ${state.active ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
                      onClick={() => toggleAmbient(sound.id)}
                      style={{ fontSize: '11px', border: state.active ? 'none' : '1px solid rgba(255,255,255,0.2)', color: state.active ? '#000' : '#fff', background: state.active ? '#eaa451' : 'transparent' }}
                    >
                      <i className={`fa-solid ${sound.icon} me-1`}/> {sound.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rc-sidebar-section">
              <h4>Members ({members})</h4>
              <div className="rc-member-list">
                <div className="rc-member"><div className="rc-member-dot you"/>{user?.fullName || 'You'} <span>(you)</span></div>
                {[...Array(Math.min(members - 1, 4))].map((_, i) => (
                  <div key={i} className="rc-member"><div className="rc-member-dot"/>{['Alex', 'Priya', 'Marcus', 'Sarah'][i]}</div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
