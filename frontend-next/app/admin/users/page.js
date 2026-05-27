'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { adminUserService } from '../../lib/api';
import Swal from 'sweetalert2';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = () => {
    setLoading(true);
    adminUserService.getAll().then(r => setUsers(r.data?.content || r.data || [])).catch(() => {}).finally(() => setLoading(false));
  };

  const handleBan = async (userId, name) => {
    const r = await Swal.fire({ title: `Ban ${name}?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ban User' });
    if (r.isConfirmed) { await adminUserService.ban(userId); fetchUsers(); Swal.fire({ icon: 'success', title: 'User banned', timer: 1200, showConfirmButton: false }); }
  };

  const handleUnban = async (userId) => {
    await adminUserService.unban(userId); fetchUsers();
    Swal.fire({ icon: 'success', title: 'User unbanned', timer: 1200, showConfirmButton: false });
  };

  const handleWarn = async (userId) => {
    const { value } = await Swal.fire({ title: 'Warn User', input: 'text', inputPlaceholder: 'Reason for warning', showCancelButton: true });
    if (value) { await adminUserService.warn(userId, { reason: value }); Swal.fire({ icon: 'success', title: 'Warning sent', timer: 1200, showConfirmButton: false }); }
  };

  const handleRoleChange = async (userId, currentRole) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    const r = await Swal.fire({ title: `Change role to ${newRole}?`, icon: 'question', showCancelButton: true });
    if (r.isConfirmed) { await adminUserService.changeRole(userId, newRole); fetchUsers(); }
  };

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold" style={{ fontFamily: 'Playfair Display, serif' }}>User Management</h2>
        <span className="badge bg-dark rounded-pill px-3 py-2">{users.length} users</span>
      </div>

      {loading ? <div className="text-center py-5"><div className="spinner-border text-secondary"/></div> : (
        <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead style={{ background: '#1a1a2e', color: '#fff' }}>
                <tr>
                  <th className="ps-4">User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="ps-4">
                      <div className="d-flex align-items-center gap-2">
                        <img src={u.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName||'U')}&size=32&background=eaa451&color=fff`} alt="" style={{ width: 32, height: 32, borderRadius: 8 }}/>
                        <strong>{u.fullName || 'Unknown'}</strong>
                      </div>
                    </td>
                    <td className="text-muted small">{u.email}</td>
                    <td><span className={`badge ${u.role==='ADMIN'?'bg-dark':'bg-secondary'} rounded-pill`}>{u.role}</span></td>
                    <td><span className={`badge ${u.banned?'bg-danger':'bg-success'} rounded-pill`}>{u.banned ? 'Banned' : 'Active'}</span></td>
                    <td className="text-muted small">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="text-end pe-4">
                      <div className="d-flex gap-1 justify-content-end">
                        <button className="btn btn-sm btn-outline-warning" onClick={() => handleWarn(u.id)} title="Warn"><i className="fa-solid fa-triangle-exclamation"/></button>
                        {u.banned
                          ? <button className="btn btn-sm btn-outline-success" onClick={() => handleUnban(u.id)} title="Unban"><i className="fa-solid fa-unlock"/></button>
                          : <button className="btn btn-sm btn-outline-danger" onClick={() => handleBan(u.id, u.fullName)} title="Ban"><i className="fa-solid fa-ban"/></button>
                        }
                        <button className="btn btn-sm btn-outline-dark" onClick={() => handleRoleChange(u.id, u.role)} title="Toggle Role"><i className="fa-solid fa-user-shield"/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
