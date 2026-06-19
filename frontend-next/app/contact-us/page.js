'use client';
export const dynamic = 'force-dynamic';

import React, { useRef, useState } from 'react';
import emailjs from '@emailjs/browser';
import swal from 'sweetalert2';
import PageTitle from '../components/layout/PageTitle';
import NewsLetter from '../components/features/NewsLetter';
import { FadeIn } from '../components/common/AnimationUtils';

const EMAILJS_SERVICE_ID  = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID  || '';
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY  = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY  || '';

const contactInfo = [
  {
    icon: 'fa-location-dot',
    title: 'Our Address',
    lines: ['1247 Plot No. 39, 15th Phase', 'Kukatpally, Hyderabad 500072'],
  },
  {
    icon: 'fa-envelope',
    title: 'Email Us',
    lines: ['info@shelftotales.com', 'support@shelftotales.com'],
  },
  {
    icon: 'fa-phone',
    title: 'Call Us',
    lines: ['+1 (800) 123-4567', 'Mon – Fri, 9 am – 6 pm'],
  },
];

export default function ContactUs() {
  const form = useRef();
  const [sending, setSending] = useState(false);

  const sendEmail = (e) => {
    e.preventDefault();
    setSending(true);
    emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, e.target, EMAILJS_PUBLIC_KEY)
      .then(() => {
        swal.fire({ icon: 'success', title: 'Message Sent!', text: 'We will get back to you within 24 hours.', confirmButtonColor: '#1A162E' });
        e.target.reset();
      })
      .catch(() => {
        swal.fire({ icon: 'error', title: 'Oops!', text: 'Something went wrong. Please try again.', confirmButtonColor: '#1A162E' });
      })
      .finally(() => setSending(false));
  };

  return (
    <>
      <div className="page-content bg-white">
        <PageTitle parentPage="Home" childPage="Contact Us" />
        <FadeIn>

          {/* ── Hero Banner ── */}
          <section className="cu-hero">
            <div className="container">
              <div className="row align-items-center g-5">
                <div className="col-lg-6">
                  <span className="cu-badge">Get In Touch</span>
                  <h1 className="cu-hero-title">We'd Love to<br />Hear From You</h1>
                  <p className="cu-hero-para">
                    Have a question, suggestion, or just want to chat about books? Our team is here
                    to help. Reach out through the form or find us on social media.
                  </p>
                </div>
                <div className="col-lg-6">
                  <img
                    src="https://images.unsplash.com/photo-1423347834838-5162bb452700?w=580&h=380&fit=crop"
                    alt="Contact us"
                    className="cu-hero-img"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── Info Cards ── */}
          <section className="cu-info-section">
            <div className="container">
              <div className="row g-4 justify-content-center">
                {contactInfo.map((c, i) => (
                  <div className="col-md-4" key={i}>
                    <div className="cu-info-card">
                      <div className="cu-info-icon">
                        <i className={`fa-solid ${c.icon}`}></i>
                      </div>
                      <h5 className="cu-info-title">{c.title}</h5>
                      {c.lines.map((l, j) => <p key={j} className="cu-info-line">{l}</p>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Contact Form + Map ── */}
          <section className="cu-form-section">
            <div className="container">
              <div className="row g-5 align-items-start">
                {/* Form */}
                <div className="col-lg-7">
                  <div className="cu-form-card">
                    <span className="cu-badge">Send a Message</span>
                    <h2 className="cu-form-title">Get In Touch With Us</h2>
                    <p className="cu-form-sub">Fill in the form below and we'll respond within 24 hours.</p>
                    <form ref={form} onSubmit={sendEmail} className="cu-form mt-4">
                      <input type="hidden" name="dzToDo" defaultValue="Contact" />
                      <div className="row g-3">
                        <div className="col-sm-6">
                          <label className="cu-label">Full Name</label>
                          <input required type="text" name="dzName" className="cu-input" placeholder="Jane Austen" />
                        </div>
                        <div className="col-sm-6">
                          <label className="cu-label">Email Address</label>
                          <input required type="email" name="dzEmail" className="cu-input" placeholder="jane@example.com" />
                        </div>
                        <div className="col-sm-6">
                          <label className="cu-label">Phone Number</label>
                          <input type="tel" name="dzPhoneNumber" className="cu-input" placeholder="+1 (555) 000-0000" />
                        </div>
                        <div className="col-sm-6">
                          <label className="cu-label">Subject</label>
                          <input required type="text" name="dzSubject" className="cu-input" placeholder="How can we help?" />
                        </div>
                        <div className="col-12">
                          <label className="cu-label">Your Message</label>
                          <textarea required name="dzMessage" rows="5" className="cu-input cu-textarea" placeholder="Tell us more..."></textarea>
                        </div>
                        <div className="col-12">
                          <button type="submit" className="cu-submit-btn" disabled={sending}>
                            {sending ? <><i className="fa-solid fa-spinner fa-spin me-2"></i>Sending...</> : <><i className="fa-solid fa-paper-plane me-2"></i>Send Message</>}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
                {/* Sidebar info */}
                <div className="col-lg-5">
                  <div className="cu-side-img-wrap">
                    <img
                      src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&h=400&fit=crop"
                      alt="Books and coffee"
                      className="cu-side-img"
                    />
                    <div className="cu-side-overlay">
                      <h4 className="cu-side-title">Join Our Community</h4>
                      <p className="cu-side-text">Follow us on social media for book recommendations, giveaways, and more.</p>
                      <div className="cu-socials">
                        <a href="#" className="cu-social-btn" aria-label="Facebook"><i className="fa-brands fa-facebook-f"></i></a>
                        <a href="#" className="cu-social-btn" aria-label="Twitter"><i className="fa-brands fa-x-twitter"></i></a>
                        <a href="#" className="cu-social-btn" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a>
                        <a href="#" className="cu-social-btn" aria-label="LinkedIn"><i className="fa-brands fa-linkedin-in"></i></a>
                      </div>
                    </div>
                  </div>

                  <div className="cu-hours-card mt-4">
                    <h5 className="cu-hours-title"><i className="fa-regular fa-clock me-2"></i>Support Hours</h5>
                    <ul className="cu-hours-list">
                      <li><span>Monday – Friday</span><span>9:00 AM – 6:00 PM</span></li>
                      <li><span>Saturday</span><span>10:00 AM – 4:00 PM</span></li>
                      <li><span>Sunday</span><span>Closed</span></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Map ── */}
          <section className="cu-map-section">
            <iframe
              title="ShelfToTales Location Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d227748.3825624477!2d75.65046970649679!3d26.88544791796718!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396c4adf4c57e281%3A0xce1c63a0cf22e09!2sJaipur%2C+Rajasthan!5e0!3m2!1sen!2sin!4v1500819483219"
              className="cu-map-iframe"
              allowFullScreen
            ></iframe>
          </section>

        </FadeIn>
        <NewsLetter />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        /* ─── Contact Us Styles ─── */
        .cu-badge {
          display: inline-block; padding: 5px 14px; border-radius: 20px;
          background: rgba(233,173,40,0.12); color: #E9AD28;
          font-size: 0.78rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; margin-bottom: 16px;
        }
        .cu-hero { padding: 70px 0 50px; background: #f8f8f8; }
        .cu-hero-title { font-size: 2.4rem; font-weight: 800; color: #1A162E; line-height: 1.2; margin-bottom: 18px; }
        .cu-hero-para { font-size: 0.97rem; color: #555; line-height: 1.75; }
        .cu-hero-img { width: 100%; border-radius: 20px; box-shadow: 0 16px 50px rgba(0,0,0,0.14); }

        /* Info cards */
        .cu-info-section { padding: 60px 0; background: #fff; }
        .cu-info-card {
          background: #f8f8f8; border-radius: 16px; padding: 32px 24px;
          text-align: center; border-top: 4px solid #E9AD28;
          transition: transform 0.25s, box-shadow 0.25s; height: 100%;
        }
        .cu-info-card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .cu-info-icon {
          width: 60px; height: 60px; border-radius: 50%;
          background: #1A162E; color: #E9AD28;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.3rem; margin: 0 auto 18px;
        }
        .cu-info-title { font-size: 1rem; font-weight: 700; color: #1A162E; margin-bottom: 8px; }
        .cu-info-line { font-size: 0.87rem; color: #666; margin: 2px 0; }

        /* Form section */
        .cu-form-section { padding: 80px 0; background: #fff; }
        .cu-form-card {
          background: #f8f8f8; border-radius: 20px; padding: 40px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.07);
        }
        .cu-form-title { font-size: 1.8rem; font-weight: 800; color: #1A162E; margin: 10px 0 8px; }
        .cu-form-sub { font-size: 0.88rem; color: #666; }
        .cu-label { display: block; font-size: 0.82rem; font-weight: 600; color: #1A162E; margin-bottom: 6px; }
        .cu-input {
          width: 100%; padding: 11px 16px;
          border: 1.5px solid #e0e0e0; border-radius: 10px;
          font-size: 0.9rem; color: #333; background: #fff;
          transition: border-color 0.2s;
          outline: none;
        }
        .cu-input:focus { border-color: #1A162E; }
        .cu-textarea { resize: vertical; min-height: 120px; }
        .cu-submit-btn {
          width: 100%; padding: 14px;
          background: #1A162E; color: #fff;
          border: none; border-radius: 10px;
          font-size: 0.95rem; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.25s;
        }
        .cu-submit-btn:hover:not(:disabled) { background: #E9AD28; color: #1A162E; }
        .cu-submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        /* Side image */
        .cu-side-img-wrap { position: relative; border-radius: 20px; overflow: hidden; }
        .cu-side-img { width: 100%; height: 300px; object-fit: cover; display: block; }
        .cu-side-overlay {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: linear-gradient(to top, rgba(26,22,46,0.95) 0%, transparent 100%);
          padding: 28px 24px;
        }
        .cu-side-title { font-size: 1.1rem; font-weight: 700; color: #fff; margin: 0 0 6px; }
        .cu-side-text { font-size: 0.82rem; color: rgba(255,255,255,0.75); margin: 0 0 14px; }
        .cu-socials { display: flex; gap: 10px; }
        .cu-social-btn {
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(255,255,255,0.15); color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.85rem; text-decoration: none;
          transition: background 0.2s;
        }
        .cu-social-btn:hover { background: #E9AD28; color: #1A162E; }

        /* Hours */
        .cu-hours-card {
          background: #1A162E; border-radius: 16px; padding: 24px;
        }
        .cu-hours-title { font-size: 0.95rem; font-weight: 700; color: #E9AD28; margin: 0 0 16px; }
        .cu-hours-list { list-style: none; padding: 0; margin: 0; }
        .cu-hours-list li {
          display: flex; justify-content: space-between;
          font-size: 0.85rem; color: rgba(255,255,255,0.8);
          padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .cu-hours-list li:last-child { border: none; }

        /* Map */
        .cu-map-section { height: 420px; }
        .cu-map-iframe { width: 100%; height: 100%; border: none; display: block; }

        @media (max-width: 768px) {
          .cu-hero-title { font-size: 1.8rem; }
          .cu-form-card { padding: 24px; }
        }
      `}} />
    </>
  );
}
