'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './admin.css';

const navItems = [
  { href: '/admin/dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
  { href: '/admin/books', icon: 'fa-book', label: 'Books' },
  { href: '/admin/categories', icon: 'fa-tags', label: 'Categories' },
  { href: '/admin/users', icon: 'fa-users-gear', label: 'Users' },
  { href: '/admin/orders', icon: 'fa-boxes-stacked', label: 'Orders' },
  { href: '/admin/coupons', icon: 'fa-ticket', label: 'Coupons' },
  { href: '/admin/moderation', icon: 'fa-triangle-exclamation', label: 'Moderation' },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="adm-layout">
      <aside className="adm-sidebar">
        <div className="adm-sidebar-header">
          <i className="fa-solid fa-shield-halved"/>
          <span>Admin Panel</span>
        </div>
        <nav className="adm-nav">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className={`adm-nav-item ${pathname === item.href ? 'active' : ''}`}>
              <i className={`fa-solid ${item.icon}`}/>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="adm-sidebar-footer">
          <Link href="/dashboard" className="adm-nav-item">
            <i className="fa-solid fa-arrow-left"/>
            <span>Back to App</span>
          </Link>
        </div>
      </aside>
      <main className="adm-main">{children}</main>
    </div>
  );
}
