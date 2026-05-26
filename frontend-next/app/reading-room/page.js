'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React from 'react';
import '../assets/css/reader-network.css';
import { FadeIn } from '../components/common/AnimationUtils';

const ReadingRoom = () => {
    return (
        <div className="reader-view-layout">
            <div className="dashboard-sidebar" style={{width: '200px'}}>
                 <nav>
                    <div className="nav-item-dash">
                        <i className="fa-solid fa-house"></i>
                        <span>Home</span>
                    </div>
                    <div className="nav-item-dash active">
                        <i className="fa-solid fa-compass"></i>
                        <span>Explore</span>
                    </div>
                    <div className="nav-item-dash">
                        <i className="fa-solid fa-bookmark"></i>
                        <span>Bookmarks</span>
                    </div>
                    <div className="nav-item-dash">
                        <i className="fa-solid fa-users"></i>
                        <span>Groups</span>
                    </div>
                    <div className="nav-item-dash">
                        <i className="fa-solid fa-gear"></i>
                        <span>Settings</span>
                    </div>
                </nav>
            </div>

            <div className="reader-content-area">
                <div className="d-flex align-items-center mb-5">
                    <button className="btn btn-link text-dark text-decoration-none p-0 me-4">
                        <i className="fa-solid fa-arrow-left"></i>
                    </button>
                    <div>
                        <h4 className="fw-bold mb-0">Echoes of the Silent Library</h4>
                        <span className="small text-muted text-uppercase">Chapter 4: The Whispering Manuscripts</span>
                    </div>
                    <div className="ms-auto d-flex gap-4 align-items-center text-muted">
                        <i className="fa-solid fa-font cursor-pointer"></i>
                        <i className="fa-solid fa-book-open cursor-pointer"></i>
                        <i className="fa-solid fa-ellipsis-vertical cursor-pointer"></i>
                    </div>
                </div>

                <div className="text-center mb-5">
                    <img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400" alt="" className="img-fluid rounded shadow-lg mb-5" style={{maxWidth: '300px'}} />
                </div>

                <div className="reader-text mx-auto" style={{maxWidth: '700px', fontSize: '1.2rem', lineHeight: '1.8', color: '#444'}}>
                    <p><span className="display-4 fw-bold float-start me-3" style={{lineHeight: '0.8'}}>T</span>he air in the Silent Library did not just carry silence; it carried the weight of a thousand unspoken thoughts. Elias moved his candle along the shelf, the flickering flame dancing across the spines of books that had not been opened in centuries. These were the Whispering Manuscripts—rare volumes rumored to contain the very echoes of their authors' final moments.</p>
                    <p>He stopped at a shelf made of dark, petrified oak. There, bound in silver-threaded silk, lay the journal of the last Archivist. As Elias reached out, a soft murmur seemed to fill the room, like the distant sound of waves crashing against a shore of glass. It wasn't sound, precisely, but a vibration in his marrow.</p>
                    <p>"Do you hear them too?" a voice asked from the shadows. Elias didn't startle; he had expected company. In the Silent Library, one was never truly alone.</p>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-5 pt-5 pb-5">
                    <button className="btn btn-link text-dark text-decoration-none fw-bold"><i className="fa-solid fa-chevron-left me-2"></i> Previous</button>
                    <div className="d-flex flex-column align-items-center gap-2">
                        <span className="small text-muted">Page 114 of 342</span>
                        <div className="progress" style={{width: '200px', height: '4px'}}>
                            <div className="progress-bar bg-dark" style={{width: '33%'}}></div>
                        </div>
                    </div>
                    <button className="btn btn-link text-dark text-decoration-none fw-bold">Next <i className="fa-solid fa-chevron-right ms-2"></i></button>
                </div>
            </div>

            <div className="reader-sidebar-chat">
                <div className="p-4 border-bottom bg-white d-flex justify-content-between align-items-center">
                    <h6 className="fw-bold mb-0">Room Chat & Thoughts</h6>
                    <span className="badge bg-danger rounded-pill" style={{fontSize: '0.6rem'}}>Live</span>
                </div>
                <div className="p-3 bg-light border-bottom d-flex align-items-center gap-2 overflow-hidden">
                    <div className="d-flex">
                        <img loading="lazy" decoding="async" src="https://i.pravatar.cc/150?u=a" alt="" className="rounded-circle border border-white" style={{width: '24px', height: '24px', marginRight: '-8px'}} />
                        <img loading="lazy" decoding="async" src="https://i.pravatar.cc/150?u=b" alt="" className="rounded-circle border border-white" style={{width: '24px', height: '24px', marginRight: '-8px'}} />
                        <img loading="lazy" decoding="async" src="https://i.pravatar.cc/150?u=c" alt="" className="rounded-circle border border-white" style={{width: '24px', height: '24px'}} />
                    </div>
                    <span className="small text-muted text-nowrap">+12 readers online</span>
                </div>
                <div className="chat-messages">
                    <div className="mb-4">
                        <div className="d-flex justify-content-between mb-1">
                            <span className="fw-bold small">Julian M.</span>
                            <span className="small text-muted">2:15 PM</span>
                        </div>
                        <div className="chat-bubble">
                            The description of the library moss is so evocative. I can almost smell the damp stone and magic.
                        </div>
                    </div>
                    <div className="mb-4">
                        <div className="d-flex justify-content-between mb-1">
                            <span className="fw-bold small text-danger">Sarah Chen</span>
                            <span className="small text-muted">2:18 PM</span>
                        </div>
                        <div className="chat-bubble border-start border-4 border-primary" style={{background: '#f0f4ff'}}>
                            <p className="font-italic small mb-2 text-primary">"It was a paradox of grief, frozen in ink..."</p>
                            This line broke me. It perfectly captures how books act as time capsules for emotions.
                        </div>
                    </div>
                    <div className="mb-4">
                        <div className="d-flex justify-content-between mb-1">
                            <span className="fw-bold small">BookWorm99</span>
                            <span className="small text-muted">2:21 PM</span>
                        </div>
                        <div className="chat-bubble">
                            Is anyone else suspicious of Elias? He seems too comfortable in a place that's supposedly forbidden.
                        </div>
                    </div>
                    <div className="p-3 bg-warning bg-opacity-10 rounded-3 small">
                        <i className="fa-regular fa-lightbulb me-2 text-warning"></i>
                        Click a sentence in the text to share a thought with the room.
                    </div>
                </div>
                <div className="p-4 bg-white border-top">
                    <div className="position-relative mb-3">
                        <textarea className="form-control bg-light border-0" rows="3" placeholder="Share your thought or highlight..." style={{borderRadius: '15px'}}></textarea>
                        <button className="btn btn-primary rounded-circle position-absolute" style={{bottom: '10px', right: '10px', width: '35px', height: '35px', padding: '0'}}>
                            <i className="fa-solid fa-paper-plane small"></i>
                        </button>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex gap-3 text-muted">
                            <i className="fa-solid fa-paperclip cursor-pointer"></i>
                            <i className="fa-regular fa-face-smile cursor-pointer"></i>
                        </div>
                        <div className="form-check small">
                            <input className="form-check-input" type="checkbox" id="anon" />
                            <label className="form-check-label text-muted" htmlFor="anon">Post anonymously</label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="reader-bottom-controls">
                <div className="d-flex align-items-center gap-3">
                    <div className="bg-warning rounded-circle p-2 text-white">
                        <i className="fa-solid fa-music"></i>
                    </div>
                    <div>
                        <span className="small text-muted text-uppercase fw-bold" style={{fontSize: '0.6rem'}}>Lofi Study Session</span>
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
                    <div className="progress" style={{width: '100px', height: '4px'}}>
                        <div className="progress-bar bg-dark" style={{width: '60%'}}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReadingRoom;
