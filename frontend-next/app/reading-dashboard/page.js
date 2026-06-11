'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dashboardService, socialService, gamificationService, goalService } from '../lib/api';
import '../assets/css/reader-network.css';
import { FadeIn } from '../components/common/AnimationUtils';
import { useLofi } from '../contexts/LofiContext';

const ReadingDashboard = () => {
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState(null);
    const [feed, setFeed] = useState([]);
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);
    const [revealedSpoilers, setRevealedSpoilers] = useState({});
    const [streak, setStreak] = useState(null);
    const [activeGoal, setActiveGoal] = useState(null);
    const [myAchievements, setMyAchievements] = useState([]);

    const {
        isPlaying,
        currentTime,
        duration,
        volume,
        currentTrack,
        ambientStates,
        ambientSounds,
        nextTrack,
        prevTrack,
        togglePlay,
        setVolume,
        seek,
        toggleAmbient,
        setAmbientVolume
    } = useLofi();

    const formatTime = (timeInSeconds) => {
        if (isNaN(timeInSeconds) || timeInSeconds === null) return "00:00";
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const [dashRes, feedRes] = await Promise.all([
                    dashboardService.getDashboard(),
                    socialService.getFeed()
                ]);
                setDashboardData(dashRes.data);
                setFeed(feedRes.data?.content || feedRes.data || []);

                const currentUserStr = localStorage.getItem('user');
                if (currentUserStr) {
                    const followingRes = await socialService.getFollowing();
                    setFollowing(followingRes.data?.content || followingRes.data || []);
                }

                const [streakRes, goalRes, achievementsRes] = await Promise.allSettled([
                    gamificationService.getStreak(),
                    goalService.getActiveGoal(),
                    gamificationService.getMyAchievements()
                ]);
                if (streakRes.status === 'fulfilled') setStreak(streakRes.value.data);
                if (goalRes.status === 'fulfilled') setActiveGoal(goalRes.value.data);
                if (achievementsRes.status === 'fulfilled') setMyAchievements(achievementsRes.value.data || []);
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
                    <div className="bg-light p-3 rounded-4 mb-3 d-inline-block w-100 text-truncate">
                        <span className={`${isPlaying ? 'text-success' : 'text-danger'} small fw-bold`}>
                            {isPlaying ? '\u25CF Lofi Session Live' : '\u25CF Session Paused'}
                        </span>
                        <p className="mb-0 style-lofi small fw-bold text-truncate mt-1" style={{ maxWidth: '100%' }}>
                            {currentTrack?.title || "Study Ambient Mix"}
                        </p>
                    </div>
                    <button className="rn-btn-join w-100 btn-sm mt-2" onClick={() => router.push('/reader-network')}>
                        Join Reading Room
                    </button>
                </div>

                <nav aria-label="Dashboard navigation">
                    <button className="nav-item-dash active" onClick={() => router.push('/reading-dashboard')}>
                        <i className="fa-solid fa-house" aria-hidden="true"></i>
                        <span>Home</span>
                    </button>
                    <button className="nav-item-dash" onClick={() => router.push('/reader-network')}>
                        <i className="fa-solid fa-compass" aria-hidden="true"></i>
                        <span>Explore</span>
                    </button>
                    <button className="nav-item-dash" onClick={() => router.push('/virtual-bookshelf')}>
                        <i className="fa-solid fa-bookmark" aria-hidden="true"></i>
                        <span>Virtual Shelf</span>
                    </button>
                    <button className="nav-item-dash" onClick={() => router.push('/shop-list')}>
                        <i className="fa-solid fa-bag-shopping" aria-hidden="true"></i>
                        <span>Store</span>
                    </button>
                </nav>

                <div className="mt-5 pt-5">
                    <button className="nav-item-dash">
                        <i className="fa-solid fa-circle-play" aria-hidden="true"></i>
                        <span>Music Player</span>
                    </button>
                    <button className="nav-item-dash">
                        <i className="fa-solid fa-circle-question" aria-hidden="true"></i>
                        <span>Help</span>
                    </button>
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
                        <div className="spinner-border text-primary" role="status" aria-label="Loading dashboard"></div>
                    </div>
                ) : (
                    <div className="row">
                        <div className="col-lg-8">
                            {/* Currently Reading Section */}
                            {!dashboardData || !dashboardData.currentlyReading || dashboardData.currentlyReading.length === 0 ? (
                                <div className="rn-card mb-4 text-center p-5" style={{ background: '#fffefb' }}>
                                    <i className="fa-solid fa-book display-4 text-muted mb-3" aria-hidden="true"></i>
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
                                                            alt={`Cover of ${item.title}`}
                                                            width="400"
                                                            height="200"
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
                                                                    aria-valuenow={progress}
                                                                    aria-valuemin="0"
                                                                    aria-valuemax="100"
                                                                    aria-label={`${progress}% complete`}
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
                                                            <i className="fa-solid fa-book-open me-2" aria-hidden="true"></i> Resume Reading
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Stats widgets */}
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

                            {/* Recommendations */}
                            {dashboardData?.recommendations && dashboardData.recommendations.length > 0 && (
                                <div className="mt-4">
                                    <h5 className="fw-bold mb-3">Recommended for You</h5>
                                    <div className="row">
                                        {dashboardData.recommendations.map((rec) => (
                                            <div className="col-md-4 mb-3" key={rec.bookId}>
                                                <button
                                                    className="rn-mood-book-card"
                                                    onClick={() => router.push(`/shop-detail/${rec.bookId}`)}
                                                >
                                                    <span className="badge bg-warning text-dark mb-1">{rec.matchCategory || 'Recommended'}</span>
                                                    <img
                                                        src={rec.coverUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400"}
                                                        alt={`Cover of ${rec.title}`}
                                                        width="80"
                                                        height="115"
                                                        className="rn-mood-book-cover"
                                                    />
                                                    <h6 className="rn-mood-book-title">{rec.title}</h6>
                                                    <span className="text-muted rn-mood-book-author">By {rec.author}</span>
                                                    {rec.score > 0 && (
                                                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, background: '#eaa451', color: '#fff', fontSize: '0.75rem', fontWeight: 600, marginTop: 4 }}>
                                                            {Math.round(rec.score * 100)}% Match
                                                        </span>
                                                    )}
                                                    {rec.reason && (
                                                        <span className="rn-mood-tag">{rec.reason}</span>
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar Columns */}
                        <div className="col-lg-4">
                            {/* Streak & Goal Widget */}
                            <div className="rn-card h-auto mb-4">
                                <h5 className="fw-bold mb-3">Reading Streak</h5>
                                {streak ? (
                                    <div className="d-flex align-items-center gap-3 mb-3">
                                        <div className="text-center">
                                            <h2 className="fw-bold text-warning mb-0">{streak.currentStreak || 0}</h2>
                                            <small className="text-muted">Day Streak</small>
                                        </div>
                                        <div className="text-center">
                                            <h2 className="fw-bold text-primary mb-0">{streak.longestStreak || 0}</h2>
                                            <small className="text-muted">Best Streak</small>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="small text-muted text-center py-2">Start reading daily to build a streak!</p>
                                )}

                                {activeGoal && (
                                    <div className="mt-3 pt-3 border-top">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="small fw-bold">Annual Goal</span>
                                            <span className="small text-muted">{activeGoal.booksRead || 0} / {activeGoal.targetCount || 0} books</span>
                                        </div>
                                        <div className="progress" style={{ height: '6px', borderRadius: '10px' }}>
                                            <div
                                                className="progress-bar bg-warning"
                                                role="progressbar"
                                                style={{ width: `${getProgressPercentage(activeGoal.booksRead || 0, activeGoal.targetCount || 1)}%` }}
                                                aria-label={`Goal ${getProgressPercentage(activeGoal.booksRead || 0, activeGoal.targetCount || 1)}% complete`}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Achievements Widget */}
                            <div className="rn-card h-auto mb-4">
                                <h5 className="fw-bold mb-3">Achievements</h5>
                                {myAchievements.length === 0 ? (
                                    <p className="small text-muted text-center py-2">Complete challenges to earn badges!</p>
                                ) : (
                                    <div className="d-flex flex-wrap gap-2">
                                        {myAchievements.slice(0, 6).map((ua) => (
                                            <div key={ua.id} className="text-center" style={{ width: '60px' }}>
                                                <div className="rounded-circle bg-warning d-flex align-items-center justify-content-center mx-auto mb-1" style={{ width: '40px', height: '40px' }}>
                                                    <i className="fa-solid fa-trophy text-white" style={{ fontSize: '0.9rem' }} aria-hidden="true"></i>
                                                </div>
                                                <small className="text-muted" style={{ fontSize: '0.65rem' }}>{ua.achievement?.name || 'Badge'}</small>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Follower / Activity Feed */}
                            <div className="rn-card h-auto mb-4">
                                <h5 className="fw-bold mb-3">Reader Feed</h5>
                                {feed.length === 0 ? (
                                    <p className="small text-muted text-center py-3">No recent activities in your network.</p>
                                ) : (
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {feed.map(activity => {
                                            const isQuote = activity.activityType === "SHARE_QUOTE";
                                            const isReview = activity.activityType === "POSTED_REVIEW";

                                            let quoteText = '';
                                            let bookTitle = '';
                                            let themeStyle = 'sunset';
                                            let reviewComment = '';
                                            let rating = 0;
                                            let isSpoiler = false;

                                            if (isQuote && activity.metadata) {
                                                try {
                                                    const meta = JSON.parse(activity.metadata);
                                                    quoteText = meta.quoteText || '';
                                                    bookTitle = meta.bookTitle || '';
                                                    themeStyle = meta.themeStyle || 'sunset';
                                                } catch(e) {
                                                    const matchText = activity.metadata.match(/"quoteText":"([^"]+)"/);
                                                    const matchTitle = activity.metadata.match(/"bookTitle":"([^"]+)"/);
                                                    if (matchText) quoteText = matchText[1];
                                                    if (matchTitle) bookTitle = matchTitle[1];
                                                }
                                            }

                                            if (isReview && activity.metadata) {
                                                try {
                                                    const meta = JSON.parse(activity.metadata);
                                                    reviewComment = meta.reviewComment || '';
                                                    bookTitle = meta.bookTitle || '';
                                                    rating = meta.rating || 0;
                                                    isSpoiler = meta.isSpoiler || false;
                                                } catch(e) {
                                                    const matchComment = activity.metadata.match(/"reviewComment":"([^"]+)"/);
                                                    const matchTitle = activity.metadata.match(/"bookTitle":"([^"]+)"/);
                                                    const matchSpoiler = activity.metadata.match(/"isSpoiler":(true|false)/);
                                                    if (matchComment) reviewComment = matchComment[1];
                                                    if (matchTitle) bookTitle = matchTitle[1];
                                                    if (matchSpoiler) isSpoiler = matchSpoiler[1] === 'true';
                                                }
                                            }

                                            const isBlurred = isSpoiler && !revealedSpoilers[activity.id];

                                            const THEMES = {
                                                sunset: 'linear-gradient(135deg, #ff5e62, #ff9966)',
                                                midnight: 'linear-gradient(135deg, #2c3e50, #000000)',
                                                forest: 'linear-gradient(135deg, #11998e, #38ef7d)',
                                                paper: '#fcf8f2'
                                            };

                                            return (
                                                <div key={activity.id} className="d-flex align-items-start gap-2 mb-3 border-bottom pb-3">
                                                    <img
                                                        src={activity.user.profileImageUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${activity.user.email}`}
                                                        alt=""
                                                        width="28"
                                                        height="28"
                                                        className="rounded-circle border"
                                                        style={{ objectFit: 'cover' }}
                                                    />
                                                    <div className="flex-grow-1">
                                                        <div className="d-flex justify-content-between">
                                                            <span className="fw-bold small">{activity.user.fullName}</span>
                                                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                                {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </small>
                                                        </div>

                                                        {isQuote ? (
                                                            <div className="mt-2">
                                                                <div style={{
                                                                    background: THEMES[themeStyle] || THEMES.sunset,
                                                                    color: themeStyle === 'paper' ? '#333' : '#fff',
                                                                    padding: '1.25rem',
                                                                    borderRadius: '8px',
                                                                    position: 'relative',
                                                                    fontSize: '0.9rem',
                                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                                                    fontFamily: 'Playfair Display, Georgia, serif'
                                                                }}>
                                                                    <span style={{ fontSize: '1.2rem', opacity: 0.4, display: 'block' }}><i className="fa-solid fa-quote-left" aria-hidden="true"/></span>
                                                                    <p className="mb-2" style={{ fontStyle: 'italic', fontWeight: 500 }}>{quoteText}</p>
                                                                    <div className="text-end fw-bold" style={{ fontSize: '0.75rem', opacity: 0.8 }}>\u2014 {bookTitle}</div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="mb-0 small" style={{ lineHeight: '1.3' }}>
                                                                <p className="mb-1">
                                                                    {activity.content}
                                                                </p>
                                                                {isReview && reviewComment && (
                                                                    <div className="mt-1">
                                                                        <div className="dz-rating mb-1" style={{ fontSize: '0.75rem' }}>
                                                                            {[...Array(5)].map((_, i) => (
                                                                                <i key={i} className={`fa fa-star ${i < rating ? 'text-warning' : 'text-muted'}`} aria-hidden="true"></i>
                                                                            ))}
                                                                            <span className="visually-hidden">{rating} out of 5 stars</span>
                                                                        </div>
                                                                        <div style={{ position: 'relative' }}>
                                                                            <div style={{
                                                                                filter: isBlurred ? 'blur(5px)' : 'none',
                                                                                transition: 'filter 0.3s ease',
                                                                                pointerEvents: isBlurred ? 'none' : 'auto',
                                                                                userSelect: isBlurred ? 'none' : 'auto'
                                                                            }}>
                                                                                <p className="mb-0 text-muted font-italic small">{reviewComment}</p>
                                                                            </div>
                                                                            {isBlurred && (
                                                                                <button
                                                                                    className="text-danger fw-bold"
                                                                                    style={{
                                                                                        position: 'absolute',
                                                                                        top: 0, left: 0, right: 0, bottom: 0,
                                                                                        display: 'flex', flexDirection: 'column',
                                                                                        alignItems: 'center', justifyContent: 'center',
                                                                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                                                        border: '1px dashed #ff5e5e',
                                                                                        borderRadius: '6px',
                                                                                        cursor: 'pointer',
                                                                                        padding: '5px',
                                                                                        textAlign: 'center',
                                                                                        zIndex: 2,
                                                                                        fontSize: '10px'
                                                                                    }}
                                                                                    onClick={() => setRevealedSpoilers(prev => ({ ...prev, [activity.id]: true }))}
                                                                                    aria-label="Reveal spoiler review"
                                                                                >
                                                                                    <span>\u26A0\uFE0F Spoiler Warning</span>
                                                                                    <span className="text-muted" style={{ fontSize: '8px' }}>
                                                                                        Click to reveal review
                                                                                    </span>
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
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
                                                    width="32"
                                                    height="32"
                                                    className="friend-avatar"
                                                    style={{ objectFit: 'cover' }}
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
                    <img
                        loading="lazy"
                        decoding="async"
                        src={currentTrack?.coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300"}
                        alt={currentTrack?.title ? `Cover of ${currentTrack.title}` : "Music cover"}
                        width="60"
                        height="60"
                        className="music-cover"
                        style={{ borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div className="flex-grow-1">
                        <span className="small text-muted fw-bold">NOW PLAYING</span>
                        <h2 className="fw-bold my-1" style={{ fontSize: '1.2rem' }}>{currentTrack?.title || "Autumn Rainfall"}</h2>
                        <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>By {currentTrack?.artist || "Lofi Girl & Study Beats"}</p>

                        <div className="d-flex align-items-center gap-3">
                            <button className="btn btn-link p-0 text-muted" onClick={prevTrack} aria-label="Previous track">
                                <i className="fa-solid fa-backward-step"></i>
                            </button>
                            <button
                                className="bg-primary p-2 rounded-circle text-white d-flex align-items-center justify-content-center"
                                style={{ width: '40px', height: '40px' }}
                                onClick={togglePlay}
                                aria-label={isPlaying ? "Pause" : "Play"}
                            >
                                <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                            </button>
                            <button className="btn btn-link p-0 text-muted" onClick={nextTrack} aria-label="Next track">
                                <i className="fa-solid fa-forward-step"></i>
                            </button>
                            <label htmlFor="seek-slider" className="visually-hidden">Seek</label>
                            <input
                                id="seek-slider"
                                type="range"
                                className="form-range flex-grow-1 mx-3"
                                style={{ height: '6px', cursor: 'pointer' }}
                                min="0"
                                max={duration || 100}
                                value={currentTime}
                                onChange={(e) => seek(parseFloat(e.target.value))}
                            />
                            <span className="small text-muted" style={{ minWidth: '85px', textAlign: 'right' }}>
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                            <div className="d-flex align-items-center gap-2 ms-2">
                                <i className="fa-solid fa-volume-high text-muted" style={{ fontSize: '0.8rem' }} aria-hidden="true"></i>
                                <label htmlFor="volume-slider" className="visually-hidden">Volume</label>
                                <input
                                    id="volume-slider"
                                    type="range"
                                    className="form-range"
                                    style={{ width: '50px', height: '4px', cursor: 'pointer' }}
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="d-flex flex-wrap gap-2 justify-content-center align-items-center" style={{ width: '180px' }}>
                        {ambientSounds.map((sound) => {
                            const state = ambientStates[sound.id];
                            const isActive = state?.active;
                            return (
                                <button
                                    key={sound.id}
                                    className={`p-2 border rounded-3 text-center position-relative d-flex flex-column justify-content-center align-items-center ${isActive ? 'border-primary bg-primary bg-opacity-10 text-primary' : 'bg-white text-muted'}`}
                                    style={{ width: '80px', minHeight: '72px', transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease', border: '1px solid #dee2e6' }}
                                    onClick={() => toggleAmbient(sound.id)}
                                    aria-label={`${isActive ? 'Disable' : 'Enable'} ${sound.name} ambient sound`}
                                    aria-pressed={isActive}
                                >
                                    <i className={`fa-solid ${sound.icon} d-block mb-1`} style={{ fontSize: '1rem' }} aria-hidden="true"></i>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>{sound.name}</span>
                                    {isActive && (
                                        <div className="mt-1 w-100" onClick={(e) => e.stopPropagation()}>
                                            <label htmlFor={`ambient-${sound.id}`} className="visually-hidden">{sound.name} volume</label>
                                            <input
                                                id={`ambient-${sound.id}`}
                                                type="range"
                                                className="form-range"
                                                style={{ height: '3px', padding: 0, margin: 0, cursor: 'pointer' }}
                                                min="0"
                                                max="1"
                                                step="0.05"
                                                value={state.volume}
                                                onChange={(e) => setAmbientVolume(sound.id, parseFloat(e.target.value))}
                                            />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
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
                                Explore Rooms <i className="fa-solid fa-arrow-right ms-2" aria-hidden="true"></i>
                            </button>
                        </div>
                        <div className="col-md-5">
                            <div className="d-flex gap-3">
                                <img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=300" alt="Stack of books" width="300" height="200" className="img-fluid rounded-4 shadow" style={{ objectFit: 'cover' }} />
                                <img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=80&w=300" alt="Open book on table" width="300" height="200" className="img-fluid rounded-4 shadow" style={{ objectFit: 'cover' }} />
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
