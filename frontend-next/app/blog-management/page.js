'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import PageTitle from '../components/layout/PageTitle';
import Swal from 'sweetalert2';
import { socialService, blogService } from '../lib/api';
import BlogEditor from '../../components/features/Blog/BlogEditor';

function BlogManagement() {
  const [blogs, setBlogs] = useState([]);
  const [tab, setTab] = useState('my'); // 'my' | 'create' | 'feed'
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [editId, setEditId] = useState(null);
  const [feedPosts, setFeedPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);

  const loadMyBlogs = () => {
    blogService.getMy()
      .then(res => setBlogs(res.data || []))
      .catch(() => setBlogs([]));
  };

  // Load blogs on mount
  useEffect(() => {
    loadMyBlogs();
  }, []);

  // Fetch community feed
  useEffect(() => {
    if (tab === 'feed') {
      setFeedLoading(true);
      socialService.getFeed()
        .then(res => {
          const items = res.data?.content || res.data || [];
          setFeedPosts(items);
        })
        .catch(() => {
          // Fallback: try discover feed
          socialService.getDiscoverFeed()
            .then(res => setFeedPosts(res.data?.recentActivity || res.data?.popularBooks || []))
            .catch(() => setFeedPosts([]));
        })
        .finally(() => setFeedLoading(false));
    }
  }, [tab]);

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) {
      Swal.fire('Missing Fields', 'Please fill in both title and content.', 'warning');
      return;
    }
    if (editId) {
      const existingBlog = blogs.find(b => b.id === editId);
      const currentStatus = existingBlog ? existingBlog.status : 'PUBLISHED';
      blogService.update(editId, { title, content, coverImage: coverImage || undefined, status: currentStatus })
        .then(() => {
          loadMyBlogs();
          setEditId(null);
          Swal.fire({ icon: 'success', title: 'Updated!', timer: 1500, showConfirmButton: false });
          setTitle(''); setContent(''); setCoverImage(''); setTab('my');
        })
        .catch(err => {
          Swal.fire('Error', err.response?.data?.message || 'Failed to update blog', 'error');
        });
    } else {
      blogService.create({ title, content, coverImage: coverImage || undefined, status: 'PUBLISHED' })
        .then(() => {
          loadMyBlogs();
          Swal.fire({ icon: 'success', title: 'Published!', timer: 1500, showConfirmButton: false });
          setTitle(''); setContent(''); setCoverImage(''); setTab('my');
        })
        .catch(err => {
          Swal.fire('Error', err.response?.data?.message || 'Failed to publish blog', 'error');
        });
    }
  };

  const handleEdit = (blog) => {
    setTitle(blog.title); setContent(blog.content); setCoverImage(blog.coverImage || ''); setEditId(blog.id); setTab('create');
  };

  const handleDelete = (id) => {
    Swal.fire({ title: 'Delete this post?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete' }).then(r => {
      if (r.isConfirmed) {
        blogService.delete(id)
          .then(() => {
            loadMyBlogs();
            Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false });
          })
          .catch(err => {
            Swal.fire('Error', err.response?.data?.message || 'Failed to delete blog', 'error');
          });
      }
    });
  };

  const toggleStatus = (blog) => {
    const isPublished = blog.status === 'PUBLISHED' || blog.status === 'Published';
    const newStatus = isPublished ? 'DRAFT' : 'PUBLISHED';
    blogService.update(blog.id, { title: blog.title, content: blog.content, status: newStatus })
      .then(() => {
        loadMyBlogs();
        Swal.fire({ icon: 'success', title: 'Status updated!', timer: 1200, showConfirmButton: false });
      })
      .catch(err => {
        Swal.fire('Error', err.response?.data?.message || 'Failed to update status', 'error');
      });
  };

  const totalViews = blogs.reduce((s, b) => s + (b.viewsCount ?? 0), 0);
  const published = blogs.filter(b => b.status === 'PUBLISHED' || b.status === 'Published').length;
  const totalLikes = blogs.reduce((s, b) => s + (b.likesCount ?? 0), 0);

  return (
    <div className="page-content bg-grey">
      <PageTitle parentPage="User" childPage="Blog Management" />
      <div className="container py-4">

        {/* Tabs */}
        <div className="d-flex gap-2 mb-4 flex-wrap">
          <button className={`btn ${tab==='my'?'btn-dark':'btn-outline-dark'} rounded-pill px-4`} onClick={() => setTab('my')}>
            <i className="fa-solid fa-file-lines me-2"/>My Posts ({blogs.length})
          </button>
          <button className={`btn ${tab==='create'?'btn-dark':'btn-outline-dark'} rounded-pill px-4`} onClick={() => { setTab('create'); setEditId(null); setTitle(''); setContent(''); setCoverImage(''); }}>
            <i className="fa-solid fa-plus me-2"/>{editId ? 'Edit Post' : 'Create New'}
          </button>
          <button className={`btn ${tab==='feed'?'btn-dark':'btn-outline-dark'} rounded-pill px-4`} onClick={() => setTab('feed')}>
            <i className="fa-solid fa-globe me-2"/>Community Feed
          </button>
        </div>

        {/* My Posts Tab */}
        {tab === 'my' && (
          <>
            {/* Stats */}
            <div className="row g-3 mb-4">
              <div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body d-flex align-items-center gap-3"><div className="rounded-circle d-flex align-items-center justify-content-center" style={{width:48,height:48,background:'rgba(234,164,81,0.1)'}}><i className="fa-solid fa-eye" style={{color:'#eaa451'}}/></div><div><h4 className="mb-0 fw-bold">{totalViews.toLocaleString()}</h4><small className="text-muted">Total Views</small></div></div></div></div>
              <div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body d-flex align-items-center gap-3"><div className="rounded-circle d-flex align-items-center justify-content-center" style={{width:48,height:48,background:'rgba(16,185,129,0.1)'}}><i className="fa-solid fa-check" style={{color:'#10b981'}}/></div><div><h4 className="mb-0 fw-bold">{published}</h4><small className="text-muted">Published</small></div></div></div></div>
              <div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body d-flex align-items-center gap-3"><div className="rounded-circle d-flex align-items-center justify-content-center" style={{width:48,height:48,background:'rgba(139,92,246,0.1)'}}><i className="fa-solid fa-heart" style={{color:'#8b5cf6'}}/></div><div><h4 className="mb-0 fw-bold">{totalLikes}</h4><small className="text-muted">Total Likes</small></div></div></div></div>
            </div>

            {/* Blog List */}
            {blogs.length === 0 ? (
              <div className="text-center py-5"><i className="fa-solid fa-pen-nib fa-3x text-muted opacity-25 mb-3"/><p className="text-muted">No posts yet. Create your first blog!</p></div>
            ) : (
              <div className="row g-3">
                {blogs.map(blog => {
                  const isPublished = blog.status === 'PUBLISHED' || blog.status === 'Published';
                  const displayDate = blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : '';
                  return (
                    <div key={blog.id} className="col-md-6 col-lg-4">
                      <div className="card border-0 shadow-sm h-100" style={{borderRadius:16}}>
                        <div className="card-body d-flex flex-column">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <span className={`badge ${isPublished ? 'bg-success' : 'bg-secondary'}`}>
                              {isPublished ? 'Published' : 'Draft'}
                            </span>
                            <small className="text-muted">{displayDate}</small>
                          </div>
                          <h6 className="fw-bold mb-2">{blog.title}</h6>
                          <p className="text-muted small flex-grow-1" style={{display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{blog.content}</p>
                          <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                            <div className="d-flex gap-3 text-muted small">
                              <span><i className="fa-solid fa-eye me-1"/>{blog.viewsCount ?? 0}</span>
                              <span><i className="fa-solid fa-heart me-1"/>{blog.likesCount ?? 0}</span>
                            </div>
                            <div className="d-flex gap-1">
                              <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleStatus(blog)} title={isPublished ? 'Unpublish' : 'Publish'}><i className={`fa-solid ${isPublished ? 'fa-eye-slash' : 'fa-eye'}`}/></button>
                              <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(blog)}><i className="fa-solid fa-pen"/></button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(blog.id)}><i className="fa-solid fa-trash"/></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Create/Edit Tab */}
        {tab === 'create' && (
          <div className="card border-0 shadow-sm" style={{borderRadius:16}}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">{editId ? 'Edit Post' : 'Create New Post'}</h5>
              <div className="mb-3">
                <label className="form-label fw-bold">Title</label>
                <input type="text" className="form-control form-control-lg" placeholder="Enter your blog title..." value={title} onChange={e => setTitle(e.target.value)} style={{borderRadius:12}}/>
              </div>
              <div className="mb-4">
                <label className="form-label fw-bold">Content</label>
                <BlogEditor
                  content={content}
                  onChange={(val) => setContent(val)}
                  placeholder="Write your blog post here..."
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Cover Image URL (optional)</label>
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://example.com/image.jpg"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  style={{borderRadius:12}}
                />
                <small className="text-muted">Enter a URL for the blog post cover image</small>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-dark rounded-pill px-4" onClick={handleCreate}><i className="fa-solid fa-paper-plane me-2"/>{editId ? 'Update' : 'Publish'}</button>
                {editId && <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => { setEditId(null); setTitle(''); setContent(''); setCoverImage(''); }}>Cancel</button>}
              </div>
            </div>
          </div>
        )}

        {/* Community Feed Tab */}
        {tab === 'feed' && (
          <div>
            <p className="text-muted mb-4">See what the community is reading and writing about</p>
            {feedLoading ? (
              <div className="text-center py-5"><div className="spinner-border text-secondary"/><p className="text-muted mt-2">Loading feed...</p></div>
            ) : feedPosts.length > 0 ? (
              feedPosts.map((post, idx) => (
                <div key={post.id || idx} className="card border-0 shadow-sm mb-3" style={{borderRadius:16}}>
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.user?.fullName || post.activityType || 'User')}&background=3b82f6&color=fff`} alt="" className="rounded-circle" style={{width:40,height:40}}/>
                      <div>
                        <strong>{post.user?.fullName || 'Community Member'}</strong>
                        <small className="text-muted d-block">{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}</small>
                      </div>
                    </div>
                    <h6 className="fw-bold mb-2">{post.activityType?.replace(/_/g, ' ') || post.title || 'Activity'}</h6>
                    <p className="text-muted mb-0">{post.metadata ? (JSON.parse(post.metadata).bookTitle || post.metadata) : (post.description || post.referenceType || '')}</p>
                    <div className="d-flex gap-4 pt-2 border-top mt-3">
                      <button className="btn btn-sm btn-link text-muted text-decoration-none"><i className="fa-regular fa-heart me-1"/>Like</button>
                      <button className="btn btn-sm btn-link text-muted text-decoration-none"><i className="fa-regular fa-comment me-1"/>Comment</button>
                      <button className="btn btn-sm btn-link text-muted text-decoration-none"><i className="fa-regular fa-bookmark me-1"/>Save</button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-5">
                <i className="fa-solid fa-users fa-3x text-muted opacity-25 mb-3" style={{display:'block'}}/>
                <p className="text-muted">No community activity yet. Follow other readers to see their updates here!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BlogManagement;
