'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { socialService } from '../lib/api';
import PageTitle from '../components/layout/PageTitle';

function BlogGrid() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user's blogs from localStorage + community feed
    const userBlogs = (() => {
      try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return JSON.parse(localStorage.getItem(`shelftotales_blogs_${u.id || 'guest'}`) || '[]'); }
      catch { return []; }
    })();
    setPosts(userBlogs.filter(b => b.status === 'Published'));
    setLoading(false);
  }, []);

  return (
    <div className="page-content bg-grey">
      <PageTitle parentPage="Blog" childPage="Blog Grid" />
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 style={{ fontFamily: 'Playfair Display, serif' }}>Blog Posts</h3>
          <Link href="/blog-management" className="btn btn-dark rounded-pill px-4"><i className="fa-solid fa-pen me-2"/>Write a Post</Link>
        </div>
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-secondary"/></div>
        ) : posts.length > 0 ? (
          <div className="row g-4">
            {posts.map(post => (
              <div key={post.id} className="col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
                  <div style={{ height: 180, background: `linear-gradient(135deg, #${(post.id*123456).toString(16).slice(0,6)}, #1a1a2e)`, borderRadius: '16px 16px 0 0' }}/>
                  <div className="card-body">
                    <small className="text-muted">{post.date}</small>
                    <h5 className="fw-bold mt-2 mb-2">{post.title}</h5>
                    <p className="text-muted small" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.content}</p>
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <div className="d-flex gap-3 text-muted small">
                        <span><i className="fa-solid fa-eye me-1"/>{post.views || 0}</span>
                        <span><i className="fa-solid fa-heart me-1"/>{post.likes || 0}</span>
                      </div>
                      <Link href="/blog-management" className="btn btn-sm btn-outline-dark rounded-pill">Read</Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <i className="fa-solid fa-pen-nib fa-3x text-muted opacity-25 mb-3" style={{ display: 'block' }}/>
            <h5>No published posts yet</h5>
            <p className="text-muted">Create your first blog post!</p>
            <Link href="/blog-management" className="btn btn-dark rounded-pill px-4">Start Writing</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default BlogGrid;
