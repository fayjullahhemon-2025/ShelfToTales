'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import PageTitle from '../components/layout/PageTitle';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { FadeIn } from '../components/common/AnimationUtils';

function BlogManagement() {
    const [blogs, setBlogs] = useState([
        { id: 1, title: 'The Future of Reading', date: '2026-04-15', status: 'Published', views: 450 },
        { id: 2, title: 'Top 10 Classic Must-Reads', date: '2026-04-20', status: 'Draft', views: 0 },
        { id: 3, title: 'How to Build a Personal Library', date: '2026-05-01', status: 'Published', views: 1200 }
    ]);

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EAA451',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                setBlogs(blogs.filter(blog => blog.id !== id));
                Swal.fire('Deleted!', 'Your blog post has been deleted.', 'success');
            }
        });
    };

    return (
        <div className="page-content bg-grey">
            <PageTitle parentPage="User" childPage="Blog Management" />
            <div className="container py-5">
                <div className="row mb-4">
                    <div className="col-lg-12 d-flex justify-content-between align-items-center">
                        <h2 className="title mb-0">Manage Your Blog Posts</h2>
                        <Link href="/blog-large-sidebar" className="btn btn-primary btnhover"><i className="fa-solid fa-plus me-2"></i> Create New Post</Link>
                    </div>
                </div>

                <div className="card shadow-sm border-0">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0 align-middle">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="ps-4">Title</th>
                                        <th>Date Created</th>
                                        <th>Status</th>
                                        <th>Views</th>
                                        <th className="text-end pe-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {blogs.map((blog) => (
                                        <tr key={blog.id}>
                                            <td className="ps-4">
                                                <h6 className="mb-0">{blog.title}</h6>
                                            </td>
                                            <td>{blog.date}</td>
                                            <td>
                                                <span className={`badge ${blog.status === 'Published' ? 'bg-success' : 'bg-secondary'}`}>
                                                    {blog.status}
                                                </span>
                                            </td>
                                            <td>{blog.views}</td>
                                            <td className="text-end pe-4">
                                                <Link href="/blog-detail" className="btn btn-info btn-sm me-2 text-white"><i className="fa-solid fa-eye"></i></Link>
                                                <button className="btn btn-warning btn-sm me-2 text-white"><i className="fa-solid fa-pen-to-square"></i></button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(blog.id)}><i className="fa-solid fa-trash"></i></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="row mt-5">
                    <div className="col-lg-4 col-md-6 mb-4">
                        <div className="card bg-primary text-white border-0 shadow-sm">
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between">
                                    <div>
                                        <h2 className="mb-0">1.8k</h2>
                                        <p className="mb-0 opacity-75">Total Readers</p>
                                    </div>
                                    <i className="fa-solid fa-users fa-3x opacity-25"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4 col-md-6 mb-4">
                        <div className="card bg-info text-white border-0 shadow-sm">
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between">
                                    <div>
                                        <h2 className="mb-0">12</h2>
                                        <p className="mb-0 opacity-75">Active Posts</p>
                                    </div>
                                    <i className="fa-solid fa-file-lines fa-3x opacity-25"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4 col-md-12 mb-4">
                        <div className="card bg-success text-white border-0 shadow-sm">
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between">
                                    <div>
                                        <h2 className="mb-0">45</h2>
                                        <p className="mb-0 opacity-75">Comments Received</p>
                                    </div>
                                    <i className="fa-solid fa-comments fa-3x opacity-25"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BlogManagement;


