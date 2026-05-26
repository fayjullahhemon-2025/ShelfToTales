'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { userService } from '../lib/api';
import Swal from 'sweetalert2';

const profilePages = [
    { to: '/shop-cart', icon: 'flaticon-shopping-cart-1', name: 'My Cart' },
    { to: '/wishlist', icon: 'far fa-heart', name: 'Wishlist' },
    { to: '/books-grid-view', icon: 'fa fa-briefcase', name: 'Shop' },
    { to: '/shop-login', icon: 'fas fa-sign-out-alt', name: 'Log Out' },
];

function MyProfileInner() {
    const [profile, setProfile] = useState({
        fullName: '',
        email: '',
        bio: '',
        profileImageUrl: '',
        phone: '',
        address: '',
        hobbies: '',
        dateOfBirth: '',
        createdAt: '',
        updatedAt: '',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await userService.getProfile();
            setProfile(res.data);
        } catch (err) {
            console.error('Error fetching profile:', err);
            Swal.fire('Error', 'Failed to load profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await userService.updateProfile({
                fullName: profile.fullName,
                bio: profile.bio,
                profileImageUrl: profile.profileImageUrl,
                phone: profile.phone,
                address: profile.address,
                hobbies: profile.hobbies,
                dateOfBirth: profile.dateOfBirth || null,
            });
            setProfile(res.data);
            const stored = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...stored, ...res.data }));
            window.dispatchEvent(new Event('profile-updated'));
            Swal.fire('Success', 'Profile updated successfully', 'success');
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Failed to update profile', 'error');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/shop-login';
    };

    if (loading) {
        return (
            <div className="page-content bg-white">
                <div className="content-block text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    const avatarUrl = profile.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName || 'User')}&background=9cd2ef&color=fff&size=200`;

    return (
        <div className="page-content bg-white">
            <div className="content-block">
                <FadeIn>
                <section className="content-inner bg-white">
                    <div className="container">
                        <div className="row">
                            {/* Sidebar */}
                            <div className="col-xl-3 col-lg-4 m-b30">
                                <div className="sticky-top">
                                    <div className="shop-account">
                                        <div className="account-detail text-center">
                                            <div className="my-image">
                                                <img loading="lazy" decoding="async" alt="profile" src={avatarUrl} onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName || 'User')}&background=9cd2ef&color=fff&size=200`; }} />
                                            </div>
                                            <div className="account-title">
                                                <h4 className="m-b5">{profile.fullName || 'User'}</h4>
                                                <p className="m-b0">{profile.email}</p>
                                                {profile.bio && <p className="m-b0" style={{ fontSize: '0.85rem', color: '#888', marginTop: '8px' }}>{profile.bio}</p>}
                                            </div>
                                        </div>
                                        <ul className="account-list">
                                            <li>
                                                <Link href="/my-profile" className="active"><i className="far fa-user" aria-hidden="true"></i> <span>Profile</span></Link>
                                            </li>
                                            {profilePages.map((item, i) => (
                                                <li key={i}>
                                                    <Link href={item.to} onClick={item.name === 'Log Out' ? handleLogout : null}>
                                                        <i className={item.icon}></i> <span>{item.name}</span>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Profile Form */}
                            <div className="col-xl-9 col-lg-8 m-b30">
                                <div className="shop-bx shop-profile">
                                    <div className="shop-bx-title clearfix">
                                        <h5 className="text-uppercase">Profile Information</h5>
                                    </div>
                                    <form onSubmit={handleSubmit}>
                                        <div className="row m-b30">
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Full Name</label>
                                                    <input type="text" name="fullName" className="form-control" value={profile.fullName || ''} onChange={handleChange} required />
                                                </div>
                                            </div>
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Email</label>
                                                    <input type="email" className="form-control" value={profile.email || ''} readOnly disabled />
                                                    <small className="text-muted">Email cannot be changed</small>
                                                </div>
                                            </div>
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Phone</label>
                                                    <input type="tel" name="phone" className="form-control" value={profile.phone || ''} onChange={handleChange} placeholder="+1 (555) 123-4567" />
                                                </div>
                                            </div>
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Date of Birth</label>
                                                    <input type="date" name="dateOfBirth" className="form-control" value={profile.dateOfBirth || ''} onChange={handleChange} />
                                                </div>
                                            </div>
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Profile Image URL</label>
                                                    <input type="url" name="profileImageUrl" className="form-control" value={profile.profileImageUrl || ''} onChange={handleChange} placeholder="https://example.com/avatar.jpg" />
                                                </div>
                                            </div>
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Member Since</label>
                                                    <input type="text" className="form-control" value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'} readOnly disabled />
                                                </div>
                                            </div>
                                            <div className="col-12">
                                                <div className="mb-3">
                                                    <label className="form-label">Address</label>
                                                    <textarea name="address" className="form-control" rows="2" value={profile.address || ''} onChange={handleChange} placeholder="123 Main St, City, State, ZIP"></textarea>
                                                </div>
                                            </div>
                                            <div className="col-12">
                                                <div className="mb-3">
                                                    <label className="form-label">Hobbies & Interests</label>
                                                    <textarea name="hobbies" className="form-control" rows="2" value={profile.hobbies || ''} onChange={handleChange} placeholder="Reading, writing, hiking, photography..."></textarea>
                                                </div>
                                            </div>
                                            <div className="col-12">
                                                <div className="mb-3">
                                                    <label className="form-label">Bio</label>
                                                    <textarea name="bio" className="form-control" rows="3" value={profile.bio || ''} onChange={handleChange} placeholder="Tell us about yourself..." maxLength={500}></textarea>
                                                    <small className="text-muted">{(profile.bio || '').length}/500 characters</small>
                                                </div>
                                            </div>
                                        </div>
                                        <button type="submit" className="btn btn-primary btnhover mt-2">
                                            <i className="fa fa-save me-2"></i> Save Changes
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                </FadeIn>
            </div>
        </div>
    );
}

import ClientOnly from '../components/ClientOnly';
import { FadeIn } from '../components/common/AnimationUtils';
export default function MyProfile() {
  return <ClientOnly><MyProfileInner /></ClientOnly>;
}
