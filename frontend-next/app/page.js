'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { bookService } from './lib/api';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import './Home.css';

import FeaturedSlider from './components/features/Home/FeaturedSlider';
import TestimonialSlider from './components/features/Home/TestimonialSlider';
import LatestNewsSlider from './components/features/Home/LatestNewsSlider';
import CounterSection from './components/common/CounterSection';

// --- Animation Variants ---
const fadeUp = {
  hidden: { opacity: 0, y: 60 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i = 0) => ({
    opacity: 1, scale: 1,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }
  }),
};

const slideInLeft = {
  hidden: { opacity: 0, x: -80 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const slideInRight = {
  hidden: { opacity: 0, x: 80 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

// --- Animated Section Wrapper ---
function AnimatedSection({ children, className, variants = fadeUp, ...props }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      {...props}
    >
      {children}
    </motion.section>
  );
}

// --- Data ---
const readingRooms = [
  { id: 1, title: 'Classic Literature Circle', topic: 'Discussing "Pride and Prejudice" — Chapters 20-30', participants: 24, iconClass: 'purple', icon: 'fa-solid fa-book-open', colors: ['#EAA451', '#1a1668', '#029e76', '#ff6b6b'] },
  { id: 2, title: 'Sci-Fi Explorers', topic: 'Monthly pick: "Dune" by Frank Herbert — Deep dive into world-building', participants: 18, iconClass: 'golden', icon: 'fa-solid fa-rocket', colors: ['#3a32b8', '#e58c23', '#00aeff', '#ff1e6f'] },
  { id: 3, title: 'Mystery & Thriller Hub', topic: 'Who guessed the twist in "Gone Girl"? Let\'s discuss!', participants: 31, iconClass: 'green', icon: 'fa-solid fa-magnifying-glass', colors: ['#029e76', '#EAA451', '#1a1668', '#ff4444'] },
];

const bookColors = ['#EAA451', '#1a1668', '#029e76', '#ff6b6b', '#00aeff', '#e58c23', '#3a32b8', '#ff1e6f', '#6c5ce7', '#00b894', '#d63384', '#198754', '#0dcaf0', '#ffc107'];

function Home() {
  const [books, setBooks] = useState([]);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    bookService.getAll({ page: 0, size: 8 })
      .then(res => setBooks(res.data?.content || []))
      .catch(() => {});
  }, []);

  return (
    <div className="page-content bg-white">

      {/* ===== HERO ===== */}
      <section className="stt-hero" ref={heroRef}>
        {/* Floating particles */}
        <div className="hero-particles">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="particle"
              animate={{ y: [0, -30, 0], x: [0, 15, 0], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
            />
          ))}
        </div>

        <motion.div className="container" style={{ y: heroY, opacity: heroOpacity }}>
          <div className="row align-items-center">
            <div className="col-lg-6">
              <motion.div className="hero-content" initial="hidden" animate="visible" variants={staggerContainer}>
                <motion.div variants={fadeUp} custom={0} className="hero-badge-wrapper">
                  <span className="hero-badge">✨ New: AI-Powered Recommendations</span>
                </motion.div>
                <motion.h1 variants={fadeUp} custom={1}>
                  Where Every <span className="gradient-text">Shelf</span> Tells a <span className="gradient-text">Story</span>
                </motion.h1>
                <motion.p variants={fadeUp} custom={2}>
                  Discover, buy, read, and discuss books with a passionate community of readers. Your next great adventure starts here.
                </motion.p>
                <motion.div variants={fadeUp} custom={3} className="hero-cta">
                  <Link href="/books-grid-view-sidebar" className="btn-hero-primary">
                    <i className="fa-solid fa-store"></i> Browse Books
                  </Link>
                  <Link href="/reader-network" className="btn-hero-secondary">
                    <i className="fa-solid fa-users"></i> Join Community
                  </Link>
                </motion.div>
                <motion.div variants={fadeUp} custom={4} className="hero-stats">
                  <div className="hero-stat-item">
                    <motion.h3
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1, duration: 0.5, type: 'spring' }}
                    >10K+</motion.h3>
                    <p>Books Available</p>
                  </div>
                  <div className="hero-stat-item">
                    <motion.h3
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.2, duration: 0.5, type: 'spring' }}
                    >5K+</motion.h3>
                    <p>Active Readers</p>
                  </div>
                  <div className="hero-stat-item">
                    <motion.h3
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.4, duration: 0.5, type: 'spring' }}
                    >500+</motion.h3>
                    <p>Reading Rooms</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
            <div className="col-lg-6 d-none d-lg-block">
              <motion.div
                className="hero-visual"
                initial={{ opacity: 0, x: 100, rotateY: -10 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <Swiper
                  className="hero-book-slider"
                  modules={[Autoplay, EffectFade, Pagination]}
                  autoplay={{ delay: 8000, disableOnInteraction: false }}
                  effect="fade"
                  fadeEffect={{ crossFade: true }}
                  loop={books.length > 1}
                  pagination={{ clickable: true, el: '.hero-slider-pagination' }}
                  speed={800}
                >
                  {books.length > 0 ? books.slice(0, 6).map((book, i) => (
                    <SwiperSlide key={book.id || i}>
                      <Link href={`/shop-detail/${book.id}`} className="hero-slide-inner">
                        <div className="hero-slide-cover">
                          <img loading="lazy" src={book.coverUrl || `https://via.placeholder.com/300x420/${bookColors[i % bookColors.length].replace('#','')}/ffffff?text=${encodeURIComponent(book.title?.substring(0,10) || 'Book')}`} alt={book.title} />
                        </div>
                        <div className="hero-slide-info">
                          <span className="hero-slide-badge">{book.categoryName || 'Featured'}</span>
                          <h3>{book.title}</h3>
                          <p className="hero-slide-author">by {book.author}</p>
                          <p className="hero-slide-desc">{book.description?.substring(0, 100) || 'A captivating read...'}...</p>
                          <div className="hero-slide-price">${book.price || '19.99'}</div>
                        </div>
                      </Link>
                    </SwiperSlide>
                  )) : (
                    <SwiperSlide>
                      <div className="hero-slide-inner">
                        <div className="hero-slide-cover" style={{background: 'linear-gradient(135deg, #EAA451, #e58c23)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                          <motion.i
                            className="fa-solid fa-book"
                            style={{fontSize:'3rem', color:'rgba(255,255,255,0.3)'}}
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                          />
                        </div>
                        <div className="hero-slide-info">
                          <span className="hero-slide-badge">Loading</span>
                          <h3>Discovering Books...</h3>
                        </div>
                      </div>
                    </SwiperSlide>
                  )}
                </Swiper>
                <div className="hero-slider-pagination"></div>
                {/* Glow effect behind slider */}
                <div className="hero-glow"></div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <AnimatedSection className="stt-how-it-works" variants={fadeIn}>
        <div className="container">
          <motion.div className="stt-section-header" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <span className="section-badge">How It Works</span>
            <h2>Shop. Read. Discuss.</h2>
            <p>Shelf To Tales brings together the joy of buying books and the magic of discussing them with fellow readers.</p>
          </motion.div>
          <motion.div className="row g-4" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}>
            {[
              { icon: 'fa-bag-shopping', cls: 'shop', title: 'Shop', desc: 'Browse thousands of books across every genre. Find your next read with curated recommendations and smart filters.' },
              { icon: 'fa-book-open-reader', cls: 'read', title: 'Read', desc: 'Build your Virtual Bookshelf, track your reading progress, and organize your personal library in stunning 3D.' },
              { icon: 'fa-comments', cls: 'discuss', title: 'Discuss', desc: 'Join live Reading Rooms, share reviews, and connect with readers who share your taste in literature.' },
            ].map((step, i) => (
              <div className="col-lg-4 col-md-6" key={i}>
                <motion.div className="stt-step-card" variants={scaleIn} custom={i} whileHover={{ y: -12, boxShadow: '0 25px 60px rgba(0,0,0,0.12)' }}>
                  <motion.div
                    className={`step-icon ${step.cls}`}
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <i className={`fa-solid ${step.icon}`}></i>
                  </motion.div>
                  <h5>{step.title}</h5>
                  <p>{step.desc}</p>
                </motion.div>
              </div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ===== TRENDING BOOKS ===== */}
      <AnimatedSection className="stt-trending" variants={fadeIn}>
        <div className="container">
          <motion.div className="stt-section-header" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <span className="section-badge">E-Commerce</span>
            <h2>Trending This Week</h2>
            <p>The most popular books our community is reading and recommending right now.</p>
          </motion.div>
          <motion.div className="row g-4" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}>
            {(books.length > 0 ? books.slice(0, 4) : [{},{},{},{}]).map((book, i) => (
              <div className="col-lg-3 col-md-6" key={book.id || i}>
                <motion.div variants={fadeUp} custom={i}>
                  <Link href={book.id ? `/shop-detail/${book.id}` : '#'} style={{textDecoration:'none'}}>
                    <motion.div
                      className="stt-book-card"
                      whileHover={{ y: -10, boxShadow: '0 20px 50px rgba(0,0,0,0.12)' }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <div className="book-cover">
                        {book.coverUrl ? (
                          <img loading="lazy" src={book.coverUrl} alt={book.title} />
                        ) : (
                          <div style={{width:'100%', height:'100%', background: `linear-gradient(135deg, ${bookColors[i]}, ${bookColors[i+4]})`}} />
                        )}
                        <motion.button
                          className="wishlist-btn"
                          onClick={(e) => e.preventDefault()}
                          whileHover={{ scale: 1.3 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <i className="fa-regular fa-heart"></i>
                        </motion.button>
                      </div>
                      <div className="book-info">
                        <div className="book-category">{book.categoryName || 'Loading...'}</div>
                        <h6>{book.title || 'Fetching books...'}</h6>
                        <div className="book-author">by {book.author || '...'}</div>
                        <div className="book-price">${book.price || '--'}</div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              </div>
            ))}
          </motion.div>
          <motion.div
            className="text-center mt-5"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            <Link href="/books-grid-view-sidebar" className="stt-view-all">
              View All Books <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ===== COMMUNITY ===== */}
      <AnimatedSection className="stt-community" variants={fadeIn}>
        <div className="container">
          <motion.div className="stt-section-header" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <span className="section-badge">Community</span>
            <h2>Live Discussions Happening Now</h2>
            <p>Jump into an active Reading Room and share your thoughts with fellow book lovers.</p>
          </motion.div>
          <motion.div className="row g-4" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}>
            {readingRooms.map((room, i) => (
              <div className="col-lg-4 col-md-6" key={room.id}>
                <motion.div
                  className="stt-room-card"
                  variants={fadeUp}
                  custom={i}
                  whileHover={{ y: -8, boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
                >
                  <div className="room-header">
                    <motion.div
                      className={`room-icon ${room.iconClass}`}
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
                    >
                      <i className={room.icon}></i>
                    </motion.div>
                    <div>
                      <h6 className="mb-0">{room.title}</h6>
                      <div className="room-meta">
                        <motion.span
                          animate={{ opacity: [1, 0.4, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >● Live</motion.span> · {room.participants} members
                      </div>
                    </div>
                  </div>
                  <p>{room.topic}</p>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="room-participants">
                      <div className="participant-avatars">
                        {room.colors.map((color, j) => (
                          <motion.div
                            className="avatar"
                            key={j}
                            style={{background: color}}
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 + j * 0.1, type: 'spring' }}
                          >
                            {String.fromCharCode(65 + j)}
                          </motion.div>
                        ))}
                      </div>
                      <span className="participant-count">+{room.participants - 4} more</span>
                    </div>
                    <Link href="/reading-room" className="btn btn-sm btn-outline-primary rounded-pill px-3">
                      Join <i className="fa-solid fa-arrow-right ms-1"></i>
                    </Link>
                  </div>
                </motion.div>
              </div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ===== FEATURED BOOKS ===== */}
      <AnimatedSection className="content-inner-1 bg-grey reccomend" variants={fadeIn}>
        <div className="container">
          <motion.div className="stt-section-header" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <span className="section-badge">Staff Picks</span>
            <h2>Featured Books</h2>
            <p>Hand-picked by our team for their outstanding stories and community buzz.</p>
          </motion.div>
          <FeaturedSlider />
        </div>
      </AnimatedSection>

      {/* ===== VIRTUAL BOOKSHELF SHOWCASE ===== */}
      <AnimatedSection className="stt-bookshelf-showcase" variants={fadeIn}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <motion.div className="showcase-content" variants={slideInLeft} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <h2>Your Personal <span>Virtual Bookshelf</span></h2>
                <p>Organize, display, and share your book collection in a stunning 3D environment. Multiple themes, drag-and-drop sorting, and social sharing built right in.</p>
                <ul className="showcase-features">
                  {['Three premium themes: Glass, Wood, Carbon', 'Drag-and-drop book arrangement', 'Share your shelf with the community', 'Custom logo and branding support'].map((feat, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.15 }}
                    >
                      <i className="fa-solid fa-check"></i> {feat}
                    </motion.li>
                  ))}
                </ul>
                <Link href="/virtual-bookshelf" className="btn-hero-primary" style={{display:'inline-flex', alignItems:'center', gap:'8px', textDecoration:'none'}}>
                  <i className="fa-solid fa-book"></i> Build Your Shelf
                </Link>
              </motion.div>
            </div>
            <div className="col-lg-6 mt-4 mt-lg-0">
              <motion.div className="showcase-preview" variants={slideInRight} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <div className="shelf-row">
                  {bookColors.slice(0, 7).map((color, i) => (
                    <motion.div
                      className="mini-book"
                      key={i}
                      style={{background: color, height: `${55 + Math.random() * 20}px`}}
                      whileHover={{ y: -10, rotate: -3 }}
                      initial={{ y: 30, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08, type: 'spring' }}
                    />
                  ))}
                </div>
                <div className="shelf-plank"></div>
                <div className="shelf-row">
                  {bookColors.slice(7, 14).map((color, i) => (
                    <motion.div
                      className="mini-book"
                      key={i}
                      style={{background: color, height: `${55 + Math.random() * 20}px`}}
                      whileHover={{ y: -10, rotate: 3 }}
                      initial={{ y: 30, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.08, type: 'spring' }}
                    />
                  ))}
                </div>
                <div className="shelf-plank"></div>
                <p style={{color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: '15px', marginBottom: '0'}}>✨ Interactive 3D Preview — Click &quot;Build Your Shelf&quot; to explore</p>
              </motion.div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ===== TESTIMONIALS ===== */}
      <AnimatedSection className="content-inner-2 testimonial-wrapper" variants={fadeUp}>
        <TestimonialSlider />
      </AnimatedSection>

      {/* ===== BLOG ===== */}
      <AnimatedSection className="content-inner-2" variants={fadeIn}>
        <div className="container">
          <motion.div className="stt-section-header" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <span className="section-badge">From The Blog</span>
            <h2>Latest News & Articles</h2>
            <p>Book reviews, author interviews, and reading tips from our community.</p>
          </motion.div>
          <LatestNewsSlider />
          <motion.div
            className="text-center mt-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <Link href="/blog-grid" className="stt-view-all">
              Read More Articles <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ===== STATS ===== */}
      <AnimatedSection className="content-inner" variants={fadeUp}>
        <div className="container">
          <div className="row sp15">
            <CounterSection />
          </div>
        </div>
      </AnimatedSection>

      {/* ===== NEWSLETTER ===== */}
      <AnimatedSection className="stt-newsletter" variants={fadeIn}>
        <div className="container">
          <motion.div
            className="newsletter-box"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, type: 'spring' }}
          >
            <h2>Stay in the Loop</h2>
            <p>Get weekly book recommendations, community updates, and exclusive deals delivered to your inbox.</p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your email address" />
              <motion.button type="submit" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                Subscribe
              </motion.button>
            </form>
          </motion.div>
        </div>
      </AnimatedSection>

    </div>
  );
}

export default Home;
