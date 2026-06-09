'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import { blogService } from '../lib/api';
import PageTitle from '../components/layout/PageTitle';

function BlogDetail() {
  const searchParams = useSearchParams();
  const blogId = searchParams?.get('id');
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (blogId) {
      setLoading(true);
      blogService.getById(blogId)
        .then(res => {
          setBlog(res.data);
          setLoading(false);
        })
        .catch(() => {
          setBlog(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [blogId]);

  const handleLike = () => {
    if (!blog) return;
    blogService.like(blog.id)
      .then(res => {
        setBlog(res.data);
        Swal.fire({ icon: 'success', title: 'Liked!', timer: 1000, showConfirmButton: false });
      })
      .catch(err => {
        Swal.fire('Error', err.response?.data?.message || 'Failed to like blog', 'error');
      });
  };

  if (loading) {
    return (
      <div className="page-content bg-grey">
        <PageTitle parentPage="Blog" childPage="Loading..." />
        <div className="container py-5 text-center">
          <div className="spinner-border text-secondary"/>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="page-content bg-grey">
        <PageTitle parentPage="Blog" childPage="Post Not Found" />
        <div className="container py-5 text-center">
          <h5>No blog post found</h5>
          <Link href="/blog-management" className="btn btn-dark rounded-pill mt-3">Go to Blog Management</Link>
        </div>
      </div>
    );
  }

  const isPublished = blog.status === 'PUBLISHED' || blog.status === 'Published';
  const displayDate = blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : '';

  return (
    <div className="page-content bg-grey">
      <PageTitle parentPage="Blog" childPage={blog.title} />
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 20 }}>
              <div style={{ height: 220, background: `linear-gradient(135deg, #eaa451, #1a1a2e)`, borderRadius: '20px 20px 0 0' }}/>
              <div className="card-body p-4 p-lg-5">
                <div className="d-flex flex-wrap gap-3 mb-3 text-muted small align-items-center">
                  <span><i className="fa-regular fa-calendar me-1"/>{displayDate}</span>
                  <span><i className="fa-solid fa-eye me-1"/>{blog.viewsCount ?? 0} views</span>
                  <span><i className="fa-solid fa-user me-1"/>By {blog.authorName || 'Anonymous'}</span>
                  <span className={`badge ${isPublished ? 'bg-success' : 'bg-secondary'}`}>{isPublished ? 'Published' : 'Draft'}</span>
                </div>
                <h2 className="fw-bold mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#1a1a2e' }}>{blog.title}</h2>
                <div style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#444' }}>
                  {blog.content?.split('\n').map((p, i) => <p key={i}>{p}</p>)}
                </div>
                <div className="d-flex gap-3 mt-4 pt-3 border-top">
                  <button className="btn btn-outline-dark rounded-pill" onClick={handleLike}><i className="fa-regular fa-heart me-2"/>{blog.likesCount ?? 0} Likes</button>
                  <Link href="/blog-management" className="btn btn-outline-secondary rounded-pill"><i className="fa-solid fa-arrow-left me-2"/>Back to Posts</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlogDetail;
