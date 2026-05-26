'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { userService, uploadService } from '../lib/api';
import Swal from 'sweetalert2';
import './MyProfile.css';
import './MyProfile.css';

function MyProfileInner() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    userService.getProfile().then(r => setProfile(r.data)).catch(() => Swal.fire('Error', 'Failed to load profile', 'error')).finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleImageUpload = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) { Swal.fire('Error', 'Please select an image file', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { Swal.fire('Error', 'Image must be under 5MB', 'error'); return; }
    setUploading(true);
    try {
      const res = await uploadService.image(file);
      const url = res.data.url;
      setProfile(p => ({ ...p, profileImageUrl: url }));
      await userService.updateProfile({ profileImageUrl: url });
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, profileImageUrl: url }));
      Swal.fire({ icon: 'success', title: 'Photo updated!', timer: 1200, showConfirmButton: false });
    } catch (e) {
      Swal.fire('Error', e.response?.data?.message || 'Upload failed. Check R2 credentials.', 'error');
    } finally { setUploading(false); }
  }, []);

  const onDrop = useCallback((e) => { e.preventDefault(); setDragOver(false); handleImageUpload(e.dataTransfer.files[0]); }, [handleImageUpload]);
  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await userService.updateProfile({
        fullName: profile.fullName, bio: profile.bio, profileImageUrl: profile.profileImageUrl,
        phone: profile.phone, address: profile.address, hobbies: profile.hobbies, dateOfBirth: profile.dateOfBirth || null,
      });
      setProfile(res.data);
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, ...res.data }));
      Swal.fire({ icon: 'success', title: 'Profile saved!', timer: 1200, showConfirmButton: false });
    } catch (e) { Swal.fire('Error', e.response?.data?.message || 'Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="prof-page"><div className="prof-loading"><div className="spinner-border text-secondary"/></div></div>;

  const avatarUrl = profile?.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.fullName||'U')}&background=1a1a2e&color=eaa451&size=200&bold=true`;

  return (
    <div className="prof-page">
      <div className="prof-container">
        {/* Header Card */}
        <div className="prof-header">
          <div className="prof-header-bg"/>
          <div className="prof-avatar-section" onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}>
            <div className={`prof-avatar-wrap ${dragOver ? 'drag-over' : ''}`} onClick={() => fileRef.current?.click()}>
              <img src={avatarUrl} alt="Profile" className="prof-avatar-img"/>
              <div className="prof-avatar-overlay">
                {uploading ? <div className="spinner-border spinner-border-sm text-white"/> : <><i className="fa-solid fa-camera"/><span>Change</span></>}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="d-none" onChange={e => handleImageUpload(e.target.files[0])}/>
            <p className="prof-avatar-hint">Click or drag & drop to change photo</p>
          </div>
          <div className="prof-header-info">
            <h2 className="prof-name">{profile?.fullName || 'Reader'}</h2>
            <p className="prof-email">{profile?.email}</p>
            {profile?.bio && <p className="prof-bio">{profile.bio}</p>}
            <div className="prof-meta">
              <span><i className="fa-solid fa-calendar-days"/> Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}</span>
              {profile?.phone && <span><i className="fa-solid fa-phone"/> {profile.phone}</span>}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="prof-form">
          <div className="prof-form-grid">
            <div className="prof-field">
              <label>Full Name</label>
              <input type="text" name="fullName" value={profile?.fullName||''} onChange={handleChange} required/>
            </div>
            <div className="prof-field">
              <label>Email</label>
              <input type="email" value={profile?.email||''} disabled className="prof-disabled"/>
            </div>
            <div className="prof-field">
              <label>Phone</label>
              <input type="tel" name="phone" value={profile?.phone||''} onChange={handleChange} placeholder="+880 1XXX-XXXXXX"/>
            </div>
            <div className="prof-field">
              <label>Date of Birth</label>
              <input type="date" name="dateOfBirth" value={profile?.dateOfBirth||''} onChange={handleChange}/>
            </div>
            <div className="prof-field full">
              <label>Address</label>
              <input type="text" name="address" value={profile?.address||''} onChange={handleChange} placeholder="Your address"/>
            </div>
            <div className="prof-field full">
              <label>Hobbies & Interests</label>
              <input type="text" name="hobbies" value={profile?.hobbies||''} onChange={handleChange} placeholder="Reading, writing, hiking..."/>
            </div>
            <div className="prof-field full">
              <label>Bio <span className="prof-char-count">{(profile?.bio||'').length}/500</span></label>
              <textarea name="bio" value={profile?.bio||''} onChange={handleChange} placeholder="Tell us about yourself..." maxLength={500} rows={3}/>
            </div>
          </div>
          <div className="prof-actions">
            <button type="submit" className="prof-save-btn" disabled={saving}>
              {saving ? <><span className="spinner-border spinner-border-sm me-2"/>Saving...</> : <><i className="fa-solid fa-check me-2"/>Save Changes</>}
            </button>
            <Link href="/dashboard" className="prof-cancel-btn">Back to Dashboard</Link>
          </div>
        </form>

        {/* Quick Links */}
        <div className="prof-links">
          <Link href="/shop-cart" className="prof-link-card"><i className="fa-solid fa-cart-shopping"/><span>Cart</span></Link>
          <Link href="/wishlist" className="prof-link-card"><i className="fa-solid fa-heart"/><span>Wishlist</span></Link>
          <Link href="/purchase-history" className="prof-link-card"><i className="fa-solid fa-box"/><span>Orders</span></Link>
          <Link href="/virtual-bookshelf" className="prof-link-card"><i className="fa-solid fa-book"/><span>Bookshelf</span></Link>
        </div>
      </div>
    </div>
  );
}

import ClientOnly from '../components/ClientOnly';
export default function MyProfile() { return <ClientOnly><MyProfileInner/></ClientOnly>; }
