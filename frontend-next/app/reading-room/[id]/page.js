'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { readingRoomService } from '../../lib/api';
import '../../assets/css/reader-network.css';
import { FadeIn } from '../../components/common/AnimationUtils';

// Ensure global is defined for SockJS in browser environments
if (typeof window !== 'undefined' && typeof window.global === 'undefined') {
    window.global = window;
}

const ReadingRoom = () => {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;
    const roomId = id ? parseInt(id, 10) : null;

    const [room, setRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [connected, setConnected] = useState(false);
    const [readersCount, setReadersCount] = useState(1);

    const stompClientRef = useRef(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        // Load current user from localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        } else {
            router.push('/shop-login');
            return;
        }

        if (!roomId) {
            router.push('/reader-network');
            return;
        }

        // Fetch Room metadata and past messages
        const loadRoomData = async () => {
            try {
                const roomsRes = await readingRoomService.getAll();
                const currentRoom = (roomsRes.data || []).find(r => r.id === roomId);
                if (currentRoom) {
                    setRoom(currentRoom);
                } else {
                    router.push('/reader-network');
                    return;
                }

                const msgRes = await readingRoomService.getMessages(roomId);
                setMessages(msgRes.data || []);
            } catch (err) {
                console.error("Failed to load room details", err);
                router.push('/reader-network');
            }
        };

        loadRoomData();

        // Connect to WebSocket using @stomp/stompjs Client
        const client = new Client({
            brokerURL: `ws://${process.env.NEXT_PUBLIC_WS_URL || 'localhost:8080'}/ws`,
            webSocketFactory: () => new SockJS(`http://${process.env.NEXT_PUBLIC_WS_URL || 'localhost:8080'}/ws`),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = (frame) => {
            setConnected(true);
            stompClientRef.current = client;

            // Subscribe to room messages topic
            client.subscribe(`/topic/room/${roomId}`, (message) => {
                const receivedMsg = JSON.parse(message.body);
                setMessages(prev => {
                    if (prev.some(m => m.id === receivedMsg.id)) return prev;
                    return [...prev, receivedMsg];
                });
            });

            setReadersCount(Math.floor(Math.random() * 12) + 3);
        };

        client.onDisconnect = () => {
            setConnected(false);
        };

        client.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        };

        client.activate();

        // Unmount Cleanup
        return () => {
            if (client) {
                client.deactivate();
            }
        };
    }, [roomId, router]);

    // Scroll to bottom on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || !stompClientRef.current || !connected || !currentUser) return;

        const payload = {
            content: newMessage,
            senderEmail: currentUser.email
        };

        // Publish over STOMP
        stompClientRef.current.publish({
            destination: `/app/chat/${roomId}`,
            body: JSON.stringify(payload)
        });

        setNewMessage('');
    };

    if (!room) {
        return (
            <div className="text-center p-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2">Loading Virtual Room...</p>
            </div>
        );
    }

    return (
        <div className="reader-view-layout">
            {/* Sidebar Left */}
            <div className="dashboard-sidebar" style={{ width: '200px' }}>
                <nav>
                    <div className="nav-item-dash" onClick={() => router.push('/reading-dashboard')}>
                        <i className="fa-solid fa-house"></i>
                        <span>Home</span>
                    </div>
                    <div className="nav-item-dash active" onClick={() => router.push('/reader-network')}>
                        <i className="fa-solid fa-compass"></i>
                        <span>Explore</span>
                    </div>
                    <div className="nav-item-dash" onClick={() => router.push('/virtual-bookshelf')}>
                        <i className="fa-solid fa-bookmark"></i>
                        <span>Virtual Shelf</span>
                    </div>
                    <div className="nav-item-dash" onClick={() => router.push('/shop-list')}>
                        <i className="fa-solid fa-bag-shopping"></i>
                        <span>Store</span>
                    </div>
                </nav>
            </div>

            {/* Book Reader View Area */}
            <div className="reader-content-area">
                <div className="d-flex align-items-center mb-5">
                    <button className="btn btn-link text-dark text-decoration-none p-0 me-4" onClick={() => router.push('/reader-network')}>
                        <i className="fa-solid fa-arrow-left"></i>
                    </button>
                    <div>
                        <h4 className="fw-bold mb-0">{room.name}</h4>
                        <span className="small text-muted text-uppercase">{room.description || "Live group reading session"}</span>
                    </div>
                    <div className="ms-auto d-flex gap-4 align-items-center text-muted">
                        <i className="fa-solid fa-font cursor-pointer"></i>
                        <i className="fa-solid fa-book-open cursor-pointer"></i>
                        <i className="fa-solid fa-ellipsis-vertical cursor-pointer"></i>
                    </div>
                </div>

                <div className="text-center mb-5">
                    <img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400" alt="" className="img-fluid rounded shadow-lg mb-5" style={{ maxWidth: '250px' }} />
                </div>

                <div className="reader-text mx-auto" style={{ maxWidth: '700px', fontSize: '1.2rem', lineHeight: '1.8', color: '#444' }}>
                    <p><span className="display-4 fw-bold float-start me-3" style={{ lineHeight: '0.8' }}>T</span>he air in the Silent Library did not just carry silence; it carried the weight of a thousand unspoken thoughts. Elias moved his candle along the shelf, the flickering flame dancing across the spines of books that had not been opened in centuries. These were the Whispering Manuscripts—rare volumes rumored to contain the very echoes of their authors' final moments.</p>
                    <p>He stopped at a shelf made of dark, petrified oak. There, bound in silver-threaded silk, lay the journal of the last Archivist. As Elias reached out, a soft murmur seemed to fill the room, like the distant sound of waves crashing against a shore of glass. It wasn't sound, precisely, but a vibration in his marrow.</p>
                    <p>"Do you hear them too?" a voice asked from the shadows. Elias didn't startle; he had expected company. In the Silent Library, one was never truly alone.</p>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-5 pt-5 pb-5">
                    <button className="btn btn-link text-dark text-decoration-none fw-bold"><i className="fa-solid fa-chevron-left me-2"></i> Previous</button>
                    <div className="d-flex flex-column align-items-center gap-2">
                        <span className="small text-muted">Page 114 of 342</span>
                        <div className="progress" style={{ width: '200px', height: '4px' }}>
                            <div className="progress-bar bg-dark" style={{ width: '33%' }}></div>
                        </div>
                    </div>
                    <button className="btn btn-link text-dark text-decoration-none fw-bold">Next <i className="fa-solid fa-chevron-right ms-2"></i></button>
                </div>
            </div>

            {/* Chat Room Sidebar Right */}
            <div className="reader-sidebar-chat">
                <div className="p-4 border-bottom bg-white d-flex justify-content-between align-items-center">
                    <h6 className="fw-bold mb-0">Room Chat & Thoughts</h6>
                    <span className={`badge ${connected ? 'bg-success' : 'bg-danger'} rounded-pill`} style={{ fontSize: '0.6rem' }}>
                        {connected ? 'Live' : 'Offline'}
                    </span>
                </div>
                <div className="p-3 bg-light border-bottom d-flex align-items-center gap-2 overflow-hidden">
                    <div className="d-flex">
                        <img loading="lazy" decoding="async" src="https://i.pravatar.cc/150?u=a" alt="" className="rounded-circle border border-white" style={{ width: '24px', height: '24px', marginRight: '-8px' }} />
                        <img loading="lazy" decoding="async" src="https://i.pravatar.cc/150?u=b" alt="" className="rounded-circle border border-white" style={{ width: '24px', height: '24px', marginRight: '-8px' }} />
                        <img loading="lazy" decoding="async" src="https://i.pravatar.cc/150?u=c" alt="" className="rounded-circle border border-white" style={{ width: '24px', height: '24px' }} />
                    </div>
                    <span className="small text-muted text-nowrap">+{readersCount} readers online</span>
                </div>

                <div className="chat-messages" style={{ overflowY: 'auto', flex: 1, padding: '15px' }}>
                    {messages.length === 0 ? (
                        <p className="text-muted small text-center py-4">No thoughts shared yet. Say something to the room!</p>
                    ) : (
                        messages.map(msg => {
                            const isMe = currentUser && msg.sender?.email === currentUser.email;
                            return (
                                <div className="mb-3" key={msg.id}>
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className={`fw-bold small ${isMe ? 'text-primary' : ''}`}>
                                            {msg.sender?.fullName || 'Anonymous'} {isMe ? '(You)' : ''}
                                        </span>
                                        <span className="small text-muted" style={{ fontSize: '0.75rem' }}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className={`chat-bubble ${isMe ? 'bg-primary text-white border-start border-4 border-primary' : ''}`} style={isMe ? {} : { background: '#f0f4ff' }}>
                                        {msg.content}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={chatEndRef} />
                </div>

                <div className="p-4 bg-white border-top">
                    <form onSubmit={handleSendMessage}>
                        <div className="position-relative mb-3">
                            <textarea
                                className="form-control bg-light border-0"
                                rows="3"
                                placeholder="Share your thought..."
                                style={{ borderRadius: '15px', paddingRight: '45px' }}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                            ></textarea>
                            <button
                                type="submit"
                                className="btn btn-primary rounded-circle position-absolute"
                                style={{ bottom: '10px', right: '10px', width: '35px', height: '35px', padding: '0' }}
                                disabled={!newMessage.trim()}
                            >
                                <i className="fa-solid fa-paper-plane small"></i>
                            </button>
                        </div>
                    </form>
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex gap-3 text-muted">
                            <i className="fa-solid fa-paperclip cursor-pointer"></i>
                            <i className="fa-regular fa-face-smile cursor-pointer"></i>
                        </div>
                        <div className="form-check small">
                            <input className="form-check-input" type="checkbox" id="anon" disabled />
                            <label className="form-check-label text-muted" htmlFor="anon">Post anonymously</label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="reader-bottom-controls">
                <div className="d-flex align-items-center gap-3">
                    <div className="bg-warning rounded-circle p-2 text-white">
                        <i className="fa-solid fa-music"></i>
                    </div>
                    <div>
                        <span className="small text-muted text-uppercase fw-bold" style={{ fontSize: '0.6rem' }}>Lofi Study Session</span>
                        <h6 className="mb-0 fw-bold">Coffee Shop Ambience - 2:45</h6>
                    </div>
                </div>
                <div className="d-flex align-items-center gap-4 text-dark fs-5">
                    <i className="fa-solid fa-backward-step cursor-pointer"></i>
                    <i className="fa-solid fa-pause cursor-pointer fs-3"></i>
                    <i className="fa-solid fa-forward-step cursor-pointer"></i>
                </div>
                <div className="d-flex align-items-center gap-3">
                    <i className="fa-solid fa-volume-high text-muted"></i>
                    <div className="progress" style={{ width: '100px', height: '4px' }}>
                        <div className="progress-bar bg-dark" style={{ width: '60%' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReadingRoom;
