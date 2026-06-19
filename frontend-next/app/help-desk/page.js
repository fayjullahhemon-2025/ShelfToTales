'use client';
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import PageTitle from '../components/layout/PageTitle';
import NewsLetter from '../components/features/NewsLetter';
import { FadeIn } from '../components/common/AnimationUtils';

const topics = [
  {
    icon: 'fa-user-circle',
    title: 'Account & Profile',
    color: '#4F46E5',
    desc: 'Login issues, password reset, profile settings, and account preferences.',
    links: [
      { label: 'Reset your password', href: '/shop-login' },
      { label: 'Update profile information', href: '/my-profile' },
      { label: 'Manage notifications', href: '/my-profile' },
    ],
  },
  {
    icon: 'fa-shopping-cart',
    title: 'Orders & Billing',
    color: '#E9AD28',
    desc: 'Payment methods, purchase history, invoices, and refund requests.',
    links: [
      { label: 'View purchase history', href: '/purchase-history' },
      { label: 'Download invoice', href: '/purchase-history' },
      { label: 'Request a refund', href: '/contact-us' },
    ],
  },
  {
    icon: 'fa-book-open',
    title: 'Books & Exchange',
    color: '#10B981',
    desc: 'Listing books, exchange requests, book reading, and catalog management.',
    links: [
      { label: 'Browse all books', href: '/book-list' },
      { label: 'Manage your bookshelf', href: '/virtual-bookshelf' },
      { label: 'Start a book exchange', href: '/virtual-bookshelf' },
    ],
  },
  {
    icon: 'fa-people-group',
    title: 'Community',
    color: '#EC4899',
    desc: 'Reading rooms, friends, challenges, and community features.',
    links: [
      { label: 'Join a reading room', href: '/reading-room' },
      { label: 'Find friends', href: '/reader-network' },
      { label: 'Reading challenges', href: '/reading-dashboard' },
    ],
  },
  {
    icon: 'fa-shield-halved',
    title: 'Privacy & Security',
    color: '#F97316',
    desc: 'Data privacy, account security, two-factor authentication.',
    links: [
      { label: 'Privacy policy', href: '/privacy-policy' },
      { label: 'Update password', href: '/my-profile' },
      { label: 'Report an issue', href: '/contact-us' },
    ],
  },
  {
    icon: 'fa-headset',
    title: 'Technical Support',
    color: '#1A162E',
    desc: 'Bug reports, performance issues, browser compatibility and more.',
    links: [
      { label: 'Report a bug', href: '/contact-us' },
      { label: 'View system status', href: '/contact-us' },
      { label: 'Email technical support', href: 'mailto:support@shelftotales.com' },
    ],
  },
];

const quickSteps = [
  { step: '01', title: 'Create Your Account', desc: 'Sign up free with email or Google. Set up your reader profile in minutes.' },
  { step: '02', title: 'Browse & Discover', desc: 'Explore thousands of books across all genres. Save favourites to your wishlist.' },
  { step: '03', title: 'Exchange & Purchase', desc: 'Buy books or trade with other readers using our secure exchange system.' },
  { step: '04', title: 'Read & Connect', desc: 'Join reading rooms, track progress, and connect with the community.' },
];

export default function HelpDeskPage() {
  const [search, setSearch] = useState('');

  return (
    <>
      <div className="page-content bg-white">
        <PageTitle parentPage="Pages" childPage="Help Desk" />
        <FadeIn>

          {/* ── Hero ── */}
          <section className="hd-hero">
            <div className="container text-center">
              <span className="hd-badge">Support Center</span>
              <h1 className="hd-hero-title">How Can We Help You?</h1>
              <p className="hd-hero-para">
                Search our knowledge base or browse topics below to find quick answers.
              </p>
              <div className="hd-search-wrap">
                <i className="fa-solid fa-magnifying-glass hd-search-icon"></i>
                <input
                  type="text"
                  className="hd-search-input"
                  placeholder="Search for help (e.g. 'reset password', 'book exchange'…)"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="hd-popular">
                <span className="hd-popular-label">Popular:</span>
                {['Password reset', 'Book exchange', 'Reading rooms', 'Purchase history'].map(t => (
                  <button key={t} className="hd-popular-tag" onClick={() => setSearch(t)}>{t}</button>
                ))}
              </div>
            </div>
          </section>

          {/* ── Topics Grid ── */}
          <section className="hd-topics">
            <div className="container">
              <div className="text-center mb-5">
                <span className="hd-badge">Browse by Topic</span>
                <h2 className="hd-section-title">What do you need help with?</h2>
              </div>
              <div className="row g-4">
                {topics.map((t, i) => (
                  <div className="col-md-6 col-lg-4" key={i}>
                    <div className="hd-topic-card">
                      <div className="hd-topic-icon" style={{ background: t.color + '18', color: t.color }}>
                        <i className={`fa-solid ${t.icon}`}></i>
                      </div>
                      <h5 className="hd-topic-title">{t.title}</h5>
                      <p className="hd-topic-desc">{t.desc}</p>
                      <ul className="hd-topic-links">
                        {t.links.map((l, j) => (
                          <li key={j}>
                            <Link href={l.href} className="hd-topic-link">
                              <i className="fa-solid fa-arrow-right hd-arrow"></i>{l.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Getting Started ── */}
          <section className="hd-getting-started">
            <div className="container">
              <div className="row align-items-center g-5">
                <div className="col-lg-5">
                  <img
                    src="https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=520&h=420&fit=crop"
                    alt="Getting started with ShelfToTales"
                    className="hd-gs-img"
                  />
                </div>
                <div className="col-lg-7">
                  <span className="hd-badge">New Here?</span>
                  <h2 className="hd-section-title">Getting Started<br />with ShelfToTales</h2>
                  <div className="hd-steps">
                    {quickSteps.map((s, i) => (
                      <div className="hd-step" key={i}>
                        <div className="hd-step-num">{s.step}</div>
                        <div>
                          <h6 className="hd-step-title">{s.title}</h6>
                          <p className="hd-step-desc">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link href="/shop-registration" className="hd-btn-primary mt-3 d-inline-flex">
                    Create Free Account <i className="fa-solid fa-arrow-right ms-2"></i>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ── Contact Banner ── */}
          <section className="hd-contact-cta">
            <div className="container">
              <div className="hd-contact-inner">
                <div className="hd-contact-img-col">
                  <img
                    src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=420&h=300&fit=crop"
                    alt="Support team"
                    className="hd-contact-img"
                  />
                </div>
                <div className="hd-contact-text">
                  <h3 className="hd-contact-title">Still Need Help?</h3>
                  <p className="hd-contact-desc">
                    Our friendly support team responds within 24 hours. You can also browse the FAQ
                    for quick answers to common questions.
                  </p>
                  <div className="d-flex gap-3 flex-wrap mt-3">
                    <Link href="/contact-us" className="hd-btn-primary">
                      <i className="fa-solid fa-envelope me-2"></i>Email Support
                    </Link>
                    <Link href="/faq" className="hd-btn-outline">
                      <i className="fa-solid fa-circle-question me-2"></i>Browse FAQ
                    </Link>
                  </div>
                  <div className="hd-response-note mt-3">
                    <i className="fa-solid fa-clock me-1"></i>
                    Average response time: <strong>under 4 hours</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </FadeIn>
        <NewsLetter />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        /* ─── Help Desk Styles ─── */
        .hd-badge {
          display: inline-block; padding: 5px 14px; border-radius: 20px;
          background: rgba(233,173,40,0.12); color: #E9AD28;
          font-size: 0.78rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; margin-bottom: 14px;
        }

        /* Hero */
        .hd-hero {
          padding: 80px 0 60px;
          background: linear-gradient(135deg, #1A162E 0%, #2d2654 100%);
        }
        .hd-hero-title { font-size: 2.6rem; font-weight: 800; color: #fff; line-height: 1.2; margin-bottom: 14px; }
        .hd-hero-para { font-size: 1rem; color: rgba(255,255,255,0.7); margin-bottom: 32px; }
        .hd-search-wrap {
          position: relative; max-width: 640px; margin: 0 auto 20px;
        }
        .hd-search-icon {
          position: absolute; left: 18px; top: 50%; transform: translateY(-50%);
          color: #999; font-size: 1rem;
        }
        .hd-search-input {
          width: 100%; padding: 16px 20px 16px 48px;
          border-radius: 14px; border: none; outline: none;
          font-size: 0.97rem; color: #333; background: #fff;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        }
        .hd-popular { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; justify-content: center; }
        .hd-popular-label { font-size: 0.82rem; color: rgba(255,255,255,0.6); }
        .hd-popular-tag {
          padding: 5px 14px; border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.3); background: transparent;
          color: rgba(255,255,255,0.85); font-size: 0.8rem; cursor: pointer;
          transition: all 0.2s;
        }
        .hd-popular-tag:hover { background: rgba(255,255,255,0.15); border-color: #E9AD28; color: #E9AD28; }

        /* Topics */
        .hd-topics { padding: 80px 0; background: #f8f8f8; }
        .hd-section-title { font-size: 1.9rem; font-weight: 800; color: #1A162E; margin: 10px 0 0; }
        .hd-topic-card {
          background: #fff; border-radius: 16px; padding: 28px 24px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.07);
          transition: transform 0.25s, box-shadow 0.25s; height: 100%;
        }
        .hd-topic-card:hover { transform: translateY(-5px); box-shadow: 0 10px 32px rgba(0,0,0,0.12); }
        .hd-topic-icon {
          width: 56px; height: 56px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.3rem; margin-bottom: 18px;
        }
        .hd-topic-title { font-size: 1rem; font-weight: 700; color: #1A162E; margin: 0 0 8px; }
        .hd-topic-desc { font-size: 0.83rem; color: #666; line-height: 1.6; margin: 0 0 16px; }
        .hd-topic-links { list-style: none; padding: 0; margin: 0; }
        .hd-topic-links li { margin-bottom: 8px; }
        .hd-topic-link {
          display: flex; align-items: center; gap: 8px;
          font-size: 0.84rem; color: #1A162E; text-decoration: none;
          font-weight: 500; transition: color 0.2s;
        }
        .hd-topic-link:hover { color: #E9AD28; }
        .hd-arrow { font-size: 0.65rem; transition: transform 0.2s; }
        .hd-topic-link:hover .hd-arrow { transform: translateX(3px); }

        /* Getting started */
        .hd-getting-started { padding: 80px 0; background: #fff; }
        .hd-gs-img { width: 100%; border-radius: 20px; box-shadow: 0 16px 50px rgba(0,0,0,0.12); }
        .hd-steps { display: flex; flex-direction: column; gap: 20px; margin-top: 28px; }
        .hd-step { display: flex; align-items: flex-start; gap: 18px; }
        .hd-step-num {
          flex-shrink: 0; width: 44px; height: 44px; border-radius: 12px;
          background: #1A162E; color: #E9AD28;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.8rem; font-weight: 800;
        }
        .hd-step-title { font-size: 0.95rem; font-weight: 700; color: #1A162E; margin: 0 0 4px; }
        .hd-step-desc { font-size: 0.84rem; color: #666; line-height: 1.6; margin: 0; }
        .hd-btn-primary {
          display: inline-flex; align-items: center; padding: 12px 24px;
          background: #1A162E; color: #fff !important; border-radius: 10px;
          font-weight: 600; font-size: 0.9rem; text-decoration: none !important;
          transition: background 0.25s;
        }
        .hd-btn-primary:hover { background: #E9AD28; color: #1A162E !important; }
        .hd-btn-outline {
          display: inline-flex; align-items: center; padding: 12px 24px;
          border: 2px solid #1A162E; color: #1A162E !important;
          border-radius: 10px; font-weight: 600; font-size: 0.9rem;
          text-decoration: none !important; transition: all 0.25s;
        }
        .hd-btn-outline:hover { background: #1A162E; color: #fff !important; }

        /* Contact CTA */
        .hd-contact-cta { padding: 80px 0; background: #f8f8f8; }
        .hd-contact-inner {
          display: flex; align-items: stretch; gap: 0;
          background: #1A162E; border-radius: 24px; overflow: hidden;
          box-shadow: 0 16px 50px rgba(26,22,46,0.25);
        }
        .hd-contact-img-col { flex-shrink: 0; width: 40%; }
        .hd-contact-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .hd-contact-text { padding: 48px 44px; }
        .hd-contact-title { font-size: 1.8rem; font-weight: 800; color: #fff; margin: 0 0 14px; }
        .hd-contact-desc { font-size: 0.93rem; color: rgba(255,255,255,0.75); line-height: 1.7; }
        .hd-response-note { font-size: 0.82rem; color: rgba(255,255,255,0.6); }
        .hd-response-note strong { color: #E9AD28; }

        @media (max-width: 768px) {
          .hd-hero-title { font-size: 1.8rem; }
          .hd-contact-inner { flex-direction: column; }
          .hd-contact-img-col { width: 100%; height: 200px; }
          .hd-contact-text { padding: 28px 24px; }
        }
      `}} />
    </>
  );
}
