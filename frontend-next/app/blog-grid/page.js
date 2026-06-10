'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { blogService } from '../lib/api';
import PageTitle from '../components/layout/PageTitle';

function BlogGrid() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    blogService.getAll()
      .then(res => {
        setPosts(res.data || []);
        setLoading(false);
      })
      .catch(() => {
        setPosts([]);
        setLoading(false);
      });
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
            {posts.map(post => {
              const displayDate = post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '';
              return (
                <div key={post.id} className="col-md-6 col-lg-4">
                  <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
                    <div style={{ height: 180, overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
                      <img
                        src={post.coverImage || `/images/blog-default.jpg`}
                        alt={post.title}
                        className="img-fluid w-100 h-100"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div className="card-body">
                      <small className="text-muted">{displayDate}</small>
                      <h5 className="fw-bold mt-2 mb-2">{post.title}</h5>
                      <p className="text-muted small" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.content}</p>
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <div className="d-flex gap-3 text-muted small">
                          <span><i className="fa-solid fa-eye me-1"/>{post.viewsCount ?? 0}</span>
                          <span><i className="fa-solid fa-heart me-1"/>{post.likesCount ?? 0}</span>
                        </div>
                        <Link href={`/blog-detail?id=${post.id}`} className="btn btn-sm btn-outline-dark rounded-pill">Read</Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
