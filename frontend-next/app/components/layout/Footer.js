'use client';

import React from 'react';
import Link from 'next/link';
import './Footer.css';

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="stt-footer">
      <div className="stt-footer-main">
        <div className="container">
          <div className="stt-footer-grid">
            {/* Brand */}
            <div className="stt-footer-brand">
              <h3 className="stt-footer-logo">Shelf<span>To</span>Tales</h3>
              <p className="stt-footer-desc">Your digital home for reading, discovering, and sharing books with a community of passionate readers.</p>
              <div className="stt-footer-social">
                <a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook-f"/></a>
                <a href="#" aria-label="Twitter"><i className="fa-brands fa-x-twitter"/></a>
                <a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram"/></a>
                <a href="#" aria-label="GitHub"><i className="fa-brands fa-github"/></a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="stt-footer-col">
              <h5>Explore</h5>
              <ul>
                <li><Link href="/books-grid-view-sidebar">Browse Books</Link></li>
                <li><Link href="/books-grid-view">Book Grid</Link></li>
                <li><Link href="/reading-room">Reading Rooms</Link></li>
                <li><Link href="/challenges">Challenges</Link></li>
                <li><Link href="/blog-grid">Blog</Link></li>
              </ul>
            </div>

            {/* Account */}
            <div className="stt-footer-col">
              <h5>Account</h5>
              <ul>
                <li><Link href="/dashboard">Dashboard</Link></li>
                <li><Link href="/my-profile">My Profile</Link></li>
                <li><Link href="/wishlist">Wishlist</Link></li>
                <li><Link href="/purchase-history">Orders</Link></li>
                <li><Link href="/virtual-bookshelf">My Bookshelf</Link></li>
              </ul>
            </div>

            {/* Info */}
            <div className="stt-footer-col">
              <h5>Info</h5>
              <ul>
                <li><Link href="/about-us">About Us</Link></li>
                <li><Link href="/contact-us">Contact</Link></li>
                <li><Link href="/privacy-policy">Privacy Policy</Link></li>
                <li><Link href="/faq">FAQ</Link></li>
                <li><Link href="/help-desk">Help Center</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="stt-footer-bottom">
        <div className="container">
          <div className="stt-footer-bottom-inner">
            <p>© {year} ShelfToTales. Built with ❤️ for readers everywhere.</p>
            <p className="stt-footer-tech">Spring Boot · Next.js · PostgreSQL · Redis</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
