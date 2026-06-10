'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { readingRoomService } from '../../lib/api';
import BookPreviewPanel from '../../components/features/ReadingRoom/BookPreviewPanel';
import MusicPlayerPanel from '../../components/features/ReadingRoom/MusicPlayerPanel';
import AdminSongManager from '../../components/features/ReadingRoom/AdminSongManager';
import RoomMembersPanel from '../../components/features/ReadingRoom/RoomMembersPanel';
import InviteFriendsModal from '../../components/features/ReadingRoom/InviteFriendsModal';
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
  const [showReader, setShowReader] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const isOwner = room?.createdBy?.id === user?.id;

  const stompRef = useRef(null);
  const chatEnd = useRef(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { router.push('/shop-login'); return; }
    setUser(JSON.parse(u));
    if (!roomId) { router.push('/reading-room'); return; }

    (async () => {
      try {
        const rooms = await readingRoomService.getAll();
        const found = (rooms.data || []).find(r => r.id === roomId);
        if (found) setRoom(found); else router.push('/reading-room');
        const msgs = await readingRoomService.getMessages(roomId);
        setMessages(msgs.data || []);
      } catch { router.push('/reading-room'); }
    })();

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
        <button className="rc-back" onClick={() => router.push('/reading-room')} aria-label="Back to rooms">
          <i className="fa-solid fa-arrow-left"/>
        </button>
        <div className="rc-header-info">
          <h1 className="rc-room-name">{room.name}</h1>
          <span className="rc-room-meta">{room.bookTitle || 'Open Discussion'}</span>
        </div>
        <div className="rc-header-right">
          <button onClick={() => setShowMembers(true)} className="btn btn-sm btn-outline-secondary rounded-pill me-2" style={{ fontSize: '0.8rem' }} aria-label="Show members">
            <i className="fa-solid fa-users me-1" /> Members
          </button>
          <span className={`rc-status ${connected ? 'live' : ''}`}>{connected ? '● Live' : '○ Offline'}</span>
        </div>
      </header>

      <div className="rc-body">
        {/* PDF Reader (overlay when toggled) */}
        {showReader && room.pdfUrl && (
          <div className="rc-reader-overlay">
            <div className="rc-reader-header">
              <span>{room.bookTitle}</span>
              <button onClick={() => setShowReader(false)} aria-label="Close reader">
                <i className="fa-solid fa-xmark"/>
              </button>
            </div>
            <iframe src={room.pdfUrl} title={room.bookTitle || 'Book PDF'} />
          </div>
        )}

        {/* Left Column: Book Preview */}
        <div className="rc-left-col">
          <BookPreviewPanel room={room} onOpenReader={() => setShowReader(true)} />
        </div>

        {/* Right Column: Chat + Music */}
        <div className="rc-right-col">
          {/* Chat Section */}
          <div className="rc-chat-section">
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
                      <div className="d-flex align-items-center gap-2">
                        <span className="rc-msg-time">{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        {isOwner && (
                          <button onClick={async () => {
                            const r = await import('sweetalert2').then(m => m.default.fire({ title: 'Delete message?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete' }));
                            if (r.isConfirmed) {
                              try { await readingRoomService.deleteMessage(roomId, msg.id); setMessages(prev => prev.filter(m => m.id !== msg.id)); } catch { }
                            }
                          }} style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '0.7rem', cursor: 'pointer', padding: 0 }} aria-label="Delete message">
                            <i className="fa-solid fa-trash" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEnd}/>
            </div>

            <form className="rc-input" onSubmit={send}>
              <input
                type="text"
                placeholder="Type a message…"
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) send(e); }}
                aria-label="Chat message"
              />
              <button type="submit" disabled={!newMsg.trim()} aria-label="Send message">
                <i className="fa-solid fa-paper-plane"/>
              </button>
            </form>
          </div>

          {/* Music Section */}
          <div className="rc-music-section">
            <MusicPlayerPanel isAdmin={user?.role === 'ADMIN'} onOpenAdmin={() => setShowAdmin(true)} />
          </div>
        </div>
      </div>

      {/* Admin Modal */}
      {showAdmin && (
        <AdminSongManager onClose={() => setShowAdmin(false)} onSongsUpdated={() => {}} />
      )}

      {/* Members Panel */}
      <RoomMembersPanel
        roomId={roomId}
        isOwner={isOwner}
        show={showMembers}
        onClose={() => setShowMembers(false)}
        onInvite={() => { setShowMembers(false); setShowInvite(true); }}
      />

      {/* Invite Friends Modal */}
      <InviteFriendsModal
        roomId={roomId}
        roomName={room?.name}
        show={showInvite}
        onClose={() => setShowInvite(false)}
        onInvited={() => {}}
      />
    </div>
  );
}
