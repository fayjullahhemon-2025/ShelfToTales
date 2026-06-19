'use client';
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import CountUp from 'react-countup';
import { FadeIn } from '../components/common/AnimationUtils';
import NewsLetter from '../components/features/NewsLetter';
import PageTitle from '../components/layout/PageTitle';

const stats = [
  { end: 50000, suffix: '+', label: 'Books Listed' },
  { end: 120000, suffix: '+', label: 'Happy Readers' },
  { end: 8500, suffix: '+', label: 'Book Exchanges' },
  { end: 98, suffix: '%', label: 'Satisfaction Rate' },
];

const team = [
  {
    name: 'Amara Singh',
    role: 'Founder & CEO',
    img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=face',
    bio: 'Book lover and tech visionary who built ShelfToTales to connect readers globally.',
  },
  {
    name: 'James Carter',
    role: 'Head of Community',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
    bio: 'Passionate about building inclusive reading communities and fostering connections.',
  },
  {
    name: 'Lena Park',
    role: 'Chief Curator',
    img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&h=300&fit=crop&crop=face',
    bio: 'Literary expert with 10+ years curating exceptional collections for readers.',
  },
];

const values = [
  { icon: 'fa-heart', title: 'Community First', desc: 'Every feature we build starts with our readers in mind. We listen, learn, and grow together.' },
  { icon: 'fa-book-open', title: 'Love of Reading', desc: 'We believe books change lives. Our platform celebrates every genre, every story, every reader.' },
  { icon: 'fa-handshake', title: 'Trust & Transparency', desc: 'Honest pricing, secure exchanges, and genuine reviews — we earn your trust every day.' },
  { icon: 'fa-globe', title: 'Global Access', desc: 'Breaking geographic barriers so every reader, everywhere, can access the books they love.' },
];

export default function AboutUsPage() {
  return (
    <div className="page-content bg-white">
      <PageTitle parentPage="Home" childPage="About Us" />
      <FadeIn>

        {/* ── Hero Section ── */}
        <section className="au-hero">
          <div className="container">
            <div className="row align-items-center g-5">
              <div className="col-lg-6">
                <span className="au-badge">Our Story</span>
                <h1 className="au-hero-title">Where Every Book<br />Finds Its Reader</h1>
                <p className="au-hero-para">
                  ShelfToTales was born from a simple belief — books are better when shared. We built
                  a community-driven bookstore where readers discover, exchange, and celebrate stories
                  together. From rare finds to bestsellers, every book has a home here.
                </p>
                <div className="d-flex gap-3 flex-wrap mt-4">
                  <Link href="/book-list" className="au-btn-primary">Browse Books</Link>
                  <Link href="/contact-us" className="au-btn-outline">Contact Us</Link>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="au-hero-imgs">
                  <img
                    src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&h=700&fit=crop"
                    alt="Library full of books"
                    className="au-img-main"
                  />
                  <div className="au-img-badge">
                    <span className="au-badge-num"><CountUp end={50} />+</span>
                    <span className="au-badge-text">Years of Book Culture</span>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=250&h=250&fit=crop"
                    alt="Reading community"
                    className="au-img-secondary"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="au-stats-section">
          <div className="container">
            <div className="row g-4">
              {stats.map((s, i) => (
                <div className="col-6 col-md-3" key={i}>
                  <div className="au-stat-card">
                    <h2 className="au-stat-num">
                      <CountUp end={s.end} separator="," />{s.suffix}
                    </h2>
                    <p className="au-stat-label">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Mission ── */}
        <section className="au-mission">
          <div className="container">
            <div className="row align-items-center g-5">
              <div className="col-lg-6">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=580&h=420&fit=crop"
                  alt="Our mission"
                  className="au-mission-img"
                />
              </div>
              <div className="col-lg-6">
                <span className="au-badge">Our Mission</span>
                <h2 className="au-section-title">Empowering Readers<br />Everywhere</h2>
                <p className="au-para">
                  We exist to make books accessible, shareable, and enjoyable for everyone. Through
                  our platform, readers can discover new titles, trade books they've finished, join
                  reading challenges, and connect with a global community of book lovers.
                </p>
                <ul className="au-check-list">
                  <li><i className="fa-solid fa-circle-check"></i> Curated book collections across all genres</li>
                  <li><i className="fa-solid fa-circle-check"></i> Peer-to-peer book exchange marketplace</li>
                  <li><i className="fa-solid fa-circle-check"></i> Reading challenges &amp; progress tracking</li>
                  <li><i className="fa-solid fa-circle-check"></i> Community reading rooms &amp; discussions</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Values ── */}
        <section className="au-values">
          <div className="container">
            <div className="text-center mb-5">
              <span className="au-badge">What We Stand For</span>
              <h2 className="au-section-title">Our Core Values</h2>
            </div>
            <div className="row g-4">
              {values.map((v, i) => (
                <div className="col-md-6 col-lg-3" key={i}>
                  <div className="au-value-card">
                    <div className="au-value-icon">
                      <i className={`fa-solid ${v.icon}`}></i>
                    </div>
                    <h5 className="au-value-title">{v.title}</h5>
                    <p className="au-value-desc">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Team ── */}
        <section className="au-team">
          <div className="container">
            <div className="text-center mb-5">
              <span className="au-badge">The People Behind</span>
              <h2 className="au-section-title">Meet Our Team</h2>
              <p className="au-para" style={{maxWidth:'520px',margin:'0 auto'}}>
                A passionate group of book lovers, technologists, and community builders dedicated
                to transforming how the world reads.
              </p>
            </div>
            <div className="row g-4 justify-content-center">
              {team.map((m, i) => (
                <div className="col-md-4 col-sm-6" key={i}>
                  <div className="au-team-card">
                    <div className="au-team-img-wrap">
                      <img src={m.img} alt={m.name} className="au-team-img" />
                    </div>
                    <div className="au-team-info">
                      <h5 className="au-team-name">{m.name}</h5>
                      <span className="au-team-role">{m.role}</span>
                      <p className="au-team-bio">{m.bio}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="au-cta">
          <div className="container">
            <div className="au-cta-inner">
              <div>
                <h3 className="au-cta-title">Ready to Start Your Reading Journey?</h3>
                <p className="au-cta-sub">Join thousands of readers discovering their next favourite book today.</p>
              </div>
              <div className="d-flex gap-3 flex-wrap">
                <Link href="/shop-registration" className="au-btn-primary">Join Free</Link>
                <Link href="/book-list" className="au-btn-light">Explore Books</Link>
              </div>
            </div>
          </div>
        </section>

      </FadeIn>
      <NewsLetter />

      <style dangerouslySetInnerHTML={{ __html: `
        /* ─── About Us Page Styles ─── */
        .au-hero { padding: 80px 0 60px; background: #fff; }
        .au-badge {
          display: inline-block; padding: 5px 14px; border-radius: 20px;
          background: rgba(233,173,40,0.12); color: #E9AD28;
          font-size: 0.78rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; margin-bottom: 16px;
        }
        .au-hero-title {
          font-size: 2.6rem; font-weight: 800; color: #1A162E;
          line-height: 1.2; margin-bottom: 20px;
        }
        .au-hero-para { font-size: 1rem; color: #555; line-height: 1.7; }
        .au-btn-primary {
          display: inline-flex; align-items: center; padding: 12px 28px;
          background: #1A162E; color: #fff !important; border-radius: 10px;
          font-weight: 600; text-decoration: none !important;
          transition: background 0.25s;
        }
        .au-btn-primary:hover { background: #E9AD28; color: #1A162E !important; }
        .au-btn-outline {
          display: inline-flex; align-items: center; padding: 12px 28px;
          border: 2px solid #1A162E; color: #1A162E !important;
          border-radius: 10px; font-weight: 600; text-decoration: none !important;
          transition: all 0.25s;
        }
        .au-btn-outline:hover { background: #1A162E; color: #fff !important; }
        .au-btn-light {
          display: inline-flex; align-items: center; padding: 12px 28px;
          background: rgba(255,255,255,0.15); color: #fff !important;
          border: 2px solid rgba(255,255,255,0.4); border-radius: 10px;
          font-weight: 600; text-decoration: none !important;
          transition: all 0.25s;
        }
        .au-btn-light:hover { background: rgba(255,255,255,0.3); }

        /* Hero images */
        .au-hero-imgs { position: relative; padding: 20px; }
        .au-img-main {
          width: 100%; max-height: 480px; object-fit: cover;
          border-radius: 20px; box-shadow: 0 20px 60px rgba(26,22,46,0.18);
        }
        .au-img-secondary {
          position: absolute; bottom: -20px; left: -20px;
          width: 180px; height: 180px; object-fit: cover;
          border-radius: 16px; border: 6px solid #fff;
          box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        }
        .au-img-badge {
          position: absolute; top: 30px; right: 0;
          background: #1A162E; color: #fff;
          padding: 16px 20px; border-radius: 14px;
          text-align: center; box-shadow: 0 8px 24px rgba(26,22,46,0.3);
        }
        .au-badge-num { display: block; font-size: 1.8rem; font-weight: 800; color: #E9AD28; }
        .au-badge-text { font-size: 0.72rem; color: rgba(255,255,255,0.8); }

        /* Stats */
        .au-stats-section { padding: 60px 0; background: #1A162E; }
        .au-stat-card { text-align: center; padding: 20px; }
        .au-stat-num { font-size: 2.4rem; font-weight: 800; color: #E9AD28; margin: 0; }
        .au-stat-label { font-size: 0.88rem; color: rgba(255,255,255,0.7); margin: 6px 0 0; }

        /* Mission */
        .au-mission { padding: 80px 0; background: #f8f8f8; }
        .au-mission-img {
          width: 100%; border-radius: 20px;
          box-shadow: 0 16px 50px rgba(0,0,0,0.12);
        }
        .au-section-title {
          font-size: 2rem; font-weight: 800; color: #1A162E;
          line-height: 1.25; margin: 10px 0 20px;
        }
        .au-para { font-size: 0.96rem; color: #555; line-height: 1.75; }
        .au-check-list { list-style: none; padding: 0; margin: 20px 0 0; }
        .au-check-list li {
          display: flex; align-items: center; gap: 12px;
          font-size: 0.94rem; color: #333; margin-bottom: 12px;
        }
        .au-check-list li i { color: #E9AD28; font-size: 1rem; }

        /* Values */
        .au-values { padding: 80px 0; background: #fff; }
        .au-value-card {
          background: #f8f8f8; border-radius: 16px; padding: 32px 24px;
          text-align: center; transition: transform 0.25s, box-shadow 0.25s;
          height: 100%;
        }
        .au-value-card:hover { transform: translateY(-6px); box-shadow: 0 12px 36px rgba(0,0,0,0.1); }
        .au-value-icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: rgba(233,173,40,0.12); color: #E9AD28;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem; margin: 0 auto 20px;
        }
        .au-value-title { font-size: 1rem; font-weight: 700; color: #1A162E; margin-bottom: 10px; }
        .au-value-desc { font-size: 0.85rem; color: #666; line-height: 1.65; margin: 0; }

        /* Team */
        .au-team { padding: 80px 0; background: #f8f8f8; }
        .au-team-card {
          background: #fff; border-radius: 20px; overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          transition: transform 0.25s, box-shadow 0.25s;
        }
        .au-team-card:hover { transform: translateY(-6px); box-shadow: 0 12px 36px rgba(0,0,0,0.15); }
        .au-team-img-wrap { height: 220px; overflow: hidden; }
        .au-team-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .au-team-info { padding: 22px; }
        .au-team-name { font-size: 1rem; font-weight: 700; color: #1A162E; margin: 0 0 4px; }
        .au-team-role {
          display: inline-block; font-size: 0.75rem; font-weight: 700;
          color: #E9AD28; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px;
        }
        .au-team-bio { font-size: 0.83rem; color: #666; line-height: 1.6; margin: 0; }

        /* CTA */
        .au-cta { padding: 70px 0; background: #1A162E; }
        .au-cta-inner {
          display: flex; align-items: center; justify-content: space-between;
          gap: 32px; flex-wrap: wrap;
        }
        .au-cta-title { font-size: 1.6rem; font-weight: 800; color: #fff; margin: 0 0 8px; }
        .au-cta-sub { font-size: 0.92rem; color: rgba(255,255,255,0.7); margin: 0; }

        @media (max-width: 768px) {
          .au-hero-title { font-size: 1.8rem; }
          .au-img-secondary { display: none; }
          .au-cta-inner { flex-direction: column; text-align: center; }
        }
      `}} />
    </div>
  );
}
