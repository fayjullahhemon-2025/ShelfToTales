'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { readingRoomService } from '../../lib/api';
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

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

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
          <span className={`rc-status ${connected ? 'live' : ''}`}>{connected ? '● Live' : '○ Offline'}</span>
        </div>
      </header>

      <div className="rc-body">
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
  );
}
