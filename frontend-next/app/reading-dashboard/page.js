'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dashboardService, socialService } from '../lib/api';
import '../assets/css/reader-network.css';
import { FadeIn } from '../components/common/AnimationUtils';

const ReadingDashboard = () => {
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState(null);
    const [feed, setFeed] = useState([]);
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const dashRes = await dashboardService.getDashboard();
                setDashboardData(dashRes.data);

                const feedRes = await socialService.getFeed();
                setFeed(feedRes.data);

                const currentUserStr = localStorage.getItem('user');
                if (currentUserStr) {
                    const currentUser = JSON.parse(currentUserStr);
                    const followingRes = await socialService.getFollowing();
                    setFollowing(followingRes.data);
                }
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    const getProgressPercentage = (current, total) => {
        if (!total || total === 0) return 0;
        return Math.min(Math.round((current / total) * 100), 100);
    };

    return (
        <FadeIn>
        <div className="rn-dashboard">
            {/* Sidebar */}
            <div className="dashboard-sidebar">
                <div className="mb-5 text-center">
                    <div className="bg-light p-3 rounded-4 mb-3 d-inline-block">
                        <span className="text-danger small fw-bold">● Lofi Session</span>
                        <p className="mb-0 style-lofi small fw-bold">Study Ambient Mix</p>
                    </div>
                    <button className="rn-btn-join w-100 btn-sm mt-2" onClick={() => router.push('/reader-network')}>
                        Join Reading Room
                    </button>
                </div>

                <nav>
                    <div className="nav-item-dash active" onClick={() => router.push('/reading-dashboard')}>
                        <i className="fa-solid fa-house"></i>
                        <span>Home</span>
                    </div>
                    <div className="nav-item-dash" onClick={() => router.push('/reader-network')}>
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

                <div className="mt-5 pt-5">
                    <div className="nav-item-dash">
                        <i className="fa-solid fa-circle-play"></i>
                        <span>Music Player</span>
                    </div>
                    <div className="nav-item-dash">
                        <i className="fa-solid fa-circle-question"></i>
                        <span>Help</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="dashboard-main">
                <div className="d-flex justify-content-between align-items-center mb-5">
                    <h2 className="fw-bold mb-0">My Reading Desk</h2>
                    <Link href="/virtual-bookshelf" className="text-primary text-decoration-none small fw-bold">View Library</Link>
                </div>

                {loading ? (
                    <div className="text-center p-5">
                        <div className="spinner-border text-primary" role="status"></div>
                    </div>
                ) : (
                    <div className="row">
                        <div className="col-lg-8">
                            {/* Currently Reading Section */}
                            {!dashboardData || !dashboardData.currentlyReading || dashboardData.currentlyReading.length === 0 ? (
                                <div className="rn-card mb-4 text-center p-5" style={{ background: '#fffefb' }}>
                                    <i className="fa-solid fa-book display-4 text-muted mb-3"></i>
                                    <h4 className="fw-bold">No Books in Progress</h4>
                                    <p className="text-muted small">Choose a book from your library or store to start reading!</p>
                                    <Link href="/shop-list" className="btn btn-primary rounded-pill px-4 mt-2">
                                        Browse Store
                                    </Link>
                                </div>
                            ) : (
                                <div>
                                    {dashboardData.currentlyReading.map((item) => {
                                        const progress = getProgressPercentage(item.currentPage, item.totalPagesRead || 300);
                                        return (
                                            <div className="rn-card mb-4" key={item.bookId} style={{ background: '#fffefb' }}>
                                                <div className="row align-items-center">
                                                    <div className="col-md-4">
                                                        <img
                                                            loading="lazy"
                                                            decoding="async"
                                                            src={item.coverUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400"}
                                                            alt=""
                                                            className="img-fluid rounded-3 shadow"
                                                            style={{ maxHeight: '200px', objectFit: 'cover' }}
                                                        />
                                                    </div>
                                                    <div className="col-md-8">
                                                        <span className="small text-muted fw-bold">Reading Session Active</span>
                                                        <h3 className="fw-bold my-2">{item.title}</h3>
                                                        <p className="text-muted mb-3">by {item.author}</p>

                                                        <div className="mt-3">
                                                            <div className="progress mb-2" style={{ height: '8px', borderRadius: '10px' }}>
                                                                <div
                                                                    className="progress-bar bg-primary"
                                                                    role="progressbar"
                                                                    style={{ width: `${progress}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="small text-muted fw-bold">{progress}% Completed ({item.currentPage} / {item.totalPagesRead || 300} pages)</span>
                                                        </div>

                                                        <button
                                                            className="btn btn-primary mt-4 px-4 py-2 rounded-pill fw-bold"
                                                            style={{ background: '#8b5a2b', border: 'none' }}
                                                            onClick={() => router.push(`/read-book/${item.bookId}`)}
                                                        >
                                                            <i className="fa-solid fa-book-open me-2"></i> Resume Reading
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Additional Stats widgets */}
                            <div className="row my-4">
                                <div className="col-md-4 mb-3">
                                    <div className="card border-0 shadow-sm p-3 text-center" style={{ background: '#f8f9fa' }}>
                                        <h2 className="fw-bold text-primary mb-1">{dashboardData?.totalBooksCompleted || 0}</h2>
                                        <span className="small text-muted fw-bold">Books Completed</span>
                                    </div>
                                </div>
                                <div className="col-md-4 mb-3">
                                    <div className="card border-0 shadow-sm p-3 text-center" style={{ background: '#f8f9fa' }}>
                                        <h2 className="fw-bold text-success mb-1">{dashboardData?.totalPagesRead || 0}</h2>
                                        <span className="small text-muted fw-bold">Pages Read</span>
                                    </div>
                                </div>
                                <div className="col-md-4 mb-3">
                                    <div className="card border-0 shadow-sm p-3 text-center" style={{ background: '#f8f9fa' }}>
                                        <h2 className="fw-bold text-warning mb-1">{dashboardData?.wishlistCount || 0}</h2>
                                        <span className="small text-muted fw-bold">Wishlist Items</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Columns */}
                        <div className="col-lg-4">
                            {/* Follower / Activity Feed */}
                            <div className="rn-card h-auto mb-4">
                                <h5 className="fw-bold mb-3">Reader Feed</h5>
                                {feed.length === 0 ? (
                                    <p className="small text-muted text-center py-3">No recent activities in your network.</p>
                                ) : (
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {feed.map(activity => (
                                            <div key={activity.id} className="d-flex align-items-start gap-2 mb-3 border-bottom pb-2">
                                                <img
                                                    src={activity.user.profileImageUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${activity.user.email}`}
                                                    alt=""
                                                    className="rounded-circle border"
                                                    style={{ width: '28px', height: '28px', objectFit: 'cover' }}
                                                />
                                                <div>
                                                    <p className="mb-0 small" style={{ lineHeight: '1.3' }}>
                                                        <span className="fw-bold">{activity.user.fullName}</span>: {activity.content}
                                                    </p>
                                                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                        {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </small>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Friend / Following List */}
                            <div className="rn-card h-auto">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h5 className="fw-bold mb-0">My Friends</h5>
                                    <span className="badge bg-warning rounded-pill text-dark" style={{ fontSize: '0.65rem' }}>
                                        {following.length} Followed
                                    </span>
                                </div>
                                {following.length === 0 ? (
                                    <div className="text-center py-3">
                                        <p className="small text-muted mb-2">Build your community by adding friends.</p>
                                        <button className="btn btn-outline-primary btn-sm rounded-pill" onClick={() => router.push('/reader-network')}>
                                            Find Readers
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                        {following.map(friend => (
                                            <div className="friend-item mb-3 d-flex align-items-center gap-2" key={friend.id}>
                                                <img
                                                    src={friend.profileImageUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${friend.email}`}
                                                    alt=""
                                                    className="friend-avatar"
                                                    style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                                />
                                                <div className="friend-info">
                                                    <h6 className="mb-0 fw-bold small">{friend.fullName}</h6>
                                                    <p className="small text-muted mb-0">{friend.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Music Player Bar */}
                <div className="rn-music-player mt-4">
                    <img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300" alt="" className="music-cover" />
                    <div className="flex-grow-1">
                        <span className="small text-muted fw-bold">NOW PLAYING</span>
                        <h2 className="fw-bold my-1">Autumn Rainfall</h2>
                        <p className="text-muted mb-4">By Lofi Girl & Study Beats</p>

                        <div className="d-flex align-items-center gap-3">
                            <i className="fa-solid fa-backward-step cursor-pointer"></i>
                            <div className="bg-primary p-2 rounded-circle text-white d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                                <i className="fa-solid fa-pause"></i>
                            </div>
                            <i className="fa-solid fa-forward-step cursor-pointer"></i>
                            <div className="progress flex-grow-1 mx-3" style={{ height: '6px' }}>
                                <div className="progress-bar bg-primary" style={{ width: '40%' }}></div>
                            </div>
                            <span className="small text-muted">14:20 / 35:00</span>
                        </div>
                    </div>
                    <div className="d-flex flex-wrap gap-2 justify-content-center" style={{ width: '180px' }}>
                        <div className="p-2 border rounded-3 text-center" style={{ width: '80px' }}>
                            <i className="fa-solid fa-cloud-showers-heavy d-block mb-1"></i>
                            <span style={{ fontSize: '0.65rem' }}>Rain</span>
                        </div>
                        <div className="p-2 border rounded-3 text-center" style={{ width: '80px' }}>
                            <i className="fa-solid fa-mug-hot d-block mb-1"></i>
                            <span style={{ fontSize: '0.65rem' }}>Cafe</span>
                        </div>
                        <div className="p-2 border rounded-3 text-center" style={{ width: '80px' }}>
                            <i className="fa-solid fa-fire d-block mb-1"></i>
                            <span style={{ fontSize: '0.65rem' }}>Fire</span>
                        </div>
                        <div className="p-2 border rounded-3 text-center" style={{ width: '80px' }}>
                            <i className="fa-solid fa-leaf d-block mb-1"></i>
                            <span style={{ fontSize: '0.65rem' }}>Nature</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Room Discover */}
                <div className="mt-5">
                    <h3 className="fw-bold mb-4">Discover what others are devouring this week.</h3>
                    <div className="row">
                        <div className="col-md-7">
                            <p className="text-muted mb-4">Join the conversation in the Reading Rooms where readers are currently discussing the latest thriller sensations.</p>
                            <div className="d-flex gap-2 mb-4">
                                <span className="badge rounded-pill bg-light text-dark px-3 py-2">#Suspense</span>
                                <span className="badge rounded-pill bg-light text-dark px-3 py-2">#Bestseller</span>
                                <span className="badge rounded-pill bg-light text-dark px-3 py-2">#Historical</span>
                            </div>
                            <button className="btn btn-primary rounded-pill px-4 py-2" style={{ background: '#8b5a2b', border: 'none' }} onClick={() => router.push('/reader-network')}>
                                Explore Rooms <i className="fa-solid fa-arrow-right ms-2"></i>
                            </button>
                        </div>
                        <div className="col-md-5">
                            <div className="d-flex gap-3">
                                <img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=300" alt="" className="img-fluid rounded-4 shadow" style={{ height: '200px', objectFit: 'cover' }} />
                                <img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=80&w=300" alt="" className="img-fluid rounded-4 shadow" style={{ height: '200px', objectFit: 'cover' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </FadeIn>
    );
};

export default ReadingDashboard;
