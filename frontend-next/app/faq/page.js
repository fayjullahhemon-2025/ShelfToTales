'use client';
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import { Accordion } from 'react-bootstrap';
import PageTitle from '../components/layout/PageTitle';
import NewsLetter from '../components/features/NewsLetter';
import { FadeIn } from '../components/common/AnimationUtils';

const categories = ['All', 'Account', 'Books & Exchange', 'Reading Features', 'Billing'];

const faqs = [
  { cat: 'Account', q: 'How do I create an account?', a: 'Click "Register" on the top right and fill in your details. You can also sign up instantly using Google OAuth — no password needed.' },
  { cat: 'Account', q: 'Can I change my username or profile picture?', a: 'Yes! Go to "My Profile" from the navbar, then click "Edit Profile" to update your name, avatar, bio, and preferences.' },
  { cat: 'Account', q: 'How do I reset my password?', a: 'Click "Forgot Password" on the login page. We\'ll send a reset link to your registered email within a few minutes.' },
  { cat: 'Books & Exchange', q: 'How does the book exchange work?', a: 'List books you want to give away on your Virtual Bookshelf, browse available books from other readers, send exchange requests, and coordinate with the other reader directly.' },
  { cat: 'Books & Exchange', q: 'Can I read books online?', a: 'Yes! Click "Read PDF" on any book detail page to open our embedded reader. You can read directly in your browser without downloading.' },
  { cat: 'Books & Exchange', q: 'How do I add a book to the platform?', a: 'Navigate to your Virtual Bookshelf and click "Add Book". Fill in the title, author, category, and upload a cover image to list your book.' },
  { cat: 'Reading Features', q: 'How do reading challenges work?', a: 'Navigate to "Challenges" in the menu, join a challenge (e.g., Read 12 Books in 2024), and track your reading progress on your Reading Dashboard.' },
  { cat: 'Reading Features', q: 'What is a Reading Room?', a: 'Reading Rooms are live, virtual spaces where groups of readers read and discuss a book together in real time. Friends can create private rooms or join public ones.' },
  { cat: 'Reading Features', q: 'Can I see my reading statistics?', a: 'Absolutely! Visit "Reading Stats" from your dashboard to see books read per month, genres explored, reading streaks, and more.' },
  { cat: 'Billing', q: 'Is ShelfToTales free?', a: 'Browsing, community features, reading rooms, and book exchange are completely free. Individual book purchases follow the pricing set by the seller.' },
  { cat: 'Billing', q: 'What payment methods do you accept?', a: 'We accept all major credit/debit cards, PayPal, and digital wallets through our secure checkout. All transactions are encrypted.' },
  { cat: 'Billing', q: 'How do I view my purchase history?', a: 'Go to "Purchase History" under your account menu to see all orders, download invoices, or request returns within our policy window.' },
];

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All' ? faqs : faqs.filter(f => f.cat === activeCategory);

  return (
    <>
      <div className="page-content bg-white">
        <PageTitle parentPage="Pages" childPage="FAQ's" />
        <FadeIn>

          {/* ── Hero ── */}
          <section className="faq-hero">
            <div className="container">
              <div className="row align-items-center g-5">
                <div className="col-lg-6">
                  <span className="faq-badge">Help Center</span>
                  <h1 className="faq-hero-title">Frequently Asked<br />Questions</h1>
                  <p className="faq-hero-para">
                    Find quick answers to common questions about ShelfToTales — accounts, books,
                    exchanges, reading features, and billing. Can't find what you need?{' '}
                    <Link href="/contact-us" className="faq-link">Contact us</Link>.
                  </p>
                </div>
                <div className="col-lg-6">
                  <img
                    src="https://images.unsplash.com/photo-1513001900722-370f803f498d?w=580&h=380&fit=crop"
                    alt="FAQ — open book on desk"
                    className="faq-hero-img"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── FAQ Body ── */}
          <section className="faq-body">
            <div className="container">

              {/* Category filter pills */}
              <div className="faq-cats">
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`faq-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Accordion */}
              <div className="row justify-content-center">
                <div className="col-lg-9">
                  <Accordion flush>
                    {filtered.map((item, i) => (
                      <Accordion.Item key={i} eventKey={`${i}`} className="faq-acc-item">
                        <Accordion.Header className="faq-acc-header">
                          <span className="faq-acc-q">{item.q}</span>
                        </Accordion.Header>
                        <Accordion.Body className="faq-acc-body">
                          <p className="faq-acc-a">{item.a}</p>
                        </Accordion.Body>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                  {filtered.length === 0 && (
                    <div className="faq-empty">No questions in this category yet.</div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ── Still Need Help ── */}
          <section className="faq-cta">
            <div className="container">
              <div className="faq-cta-card">
                <img
                  src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=80&h=80&fit=crop&crop=face"
                  alt="Support"
                  className="faq-cta-avatar"
                />
                <div>
                  <h4 className="faq-cta-title">Still have questions?</h4>
                  <p className="faq-cta-text">Our support team is available Monday to Friday, 9 AM – 6 PM.</p>
                </div>
                <div className="d-flex gap-3 flex-wrap">
                  <Link href="/contact-us" className="faq-btn-primary">Contact Support</Link>
                  <Link href="/help-desk" className="faq-btn-outline">Help Desk</Link>
                </div>
              </div>
            </div>
          </section>

        </FadeIn>
        <NewsLetter />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        /* ─── FAQ Page Styles ─── */
        .faq-badge {
          display: inline-block; padding: 5px 14px; border-radius: 20px;
          background: rgba(233,173,40,0.12); color: #E9AD28;
          font-size: 0.78rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; margin-bottom: 16px;
        }
        .faq-hero { padding: 70px 0 50px; background: #f8f8f8; }
        .faq-hero-title { font-size: 2.4rem; font-weight: 800; color: #1A162E; line-height: 1.2; margin-bottom: 18px; }
        .faq-hero-para { font-size: 0.97rem; color: #555; line-height: 1.75; }
        .faq-link { color: #E9AD28; font-weight: 600; text-decoration: none; }
        .faq-link:hover { text-decoration: underline; }
        .faq-hero-img { width: 100%; border-radius: 20px; box-shadow: 0 16px 50px rgba(0,0,0,0.14); }

        /* FAQ body */
        .faq-body { padding: 70px 0; background: #fff; }

        /* Category pills */
        .faq-cats { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-bottom: 48px; }
        .faq-cat-btn {
          padding: 8px 20px; border-radius: 24px; font-size: 0.85rem;
          font-weight: 600; border: 2px solid #e0e0e0;
          background: transparent; color: #555; cursor: pointer;
          transition: all 0.2s;
        }
        .faq-cat-btn:hover { border-color: #1A162E; color: #1A162E; }
        .faq-cat-btn.active { background: #1A162E; color: #E9AD28; border-color: #1A162E; }

        /* Accordion */
        .faq-acc-item {
          border: none !important;
          border-bottom: 1px solid #f0f0f0 !important;
          margin-bottom: 0 !important;
        }
        .faq-acc-header .accordion-button {
          background: #fff !important;
          color: #1A162E !important;
          font-weight: 700 !important;
          font-size: 0.97rem;
          box-shadow: none !important;
          padding: 18px 0;
        }
        .faq-acc-header .accordion-button:not(.collapsed) { color: #E9AD28 !important; }
        .faq-acc-header .accordion-button::after { filter: none !important; }
        .faq-acc-q { flex: 1; }
        .faq-acc-body { padding: 0 0 18px; }
        .faq-acc-a { font-size: 0.9rem; color: #555; line-height: 1.75; margin: 0; }
        .faq-empty { text-align: center; color: #999; padding: 40px 0; font-size: 0.95rem; }

        /* CTA */
        .faq-cta { padding: 0 0 70px; background: #fff; }
        .faq-cta-card {
          display: flex; align-items: center; gap: 24px; flex-wrap: wrap;
          background: #f8f8f8; border-radius: 20px; padding: 36px 40px;
          border-left: 6px solid #E9AD28;
        }
        .faq-cta-avatar { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .faq-cta-title { font-size: 1.1rem; font-weight: 700; color: #1A162E; margin: 0 0 4px; }
        .faq-cta-text { font-size: 0.87rem; color: #666; margin: 0; }
        .faq-btn-primary {
          display: inline-flex; align-items: center; padding: 11px 24px;
          background: #1A162E; color: #fff !important; border-radius: 10px;
          font-weight: 600; font-size: 0.88rem; text-decoration: none !important;
          transition: background 0.25s;
        }
        .faq-btn-primary:hover { background: #E9AD28; color: #1A162E !important; }
        .faq-btn-outline {
          display: inline-flex; align-items: center; padding: 11px 24px;
          border: 2px solid #1A162E; color: #1A162E !important;
          border-radius: 10px; font-weight: 600; font-size: 0.88rem;
          text-decoration: none !important; transition: all 0.25s;
        }
        .faq-btn-outline:hover { background: #1A162E; color: #fff !important; }

        @media (max-width: 768px) {
          .faq-hero-title { font-size: 1.8rem; }
          .faq-cta-card { flex-direction: column; text-align: center; }
        }
      `}} />
    </>
  );
}
