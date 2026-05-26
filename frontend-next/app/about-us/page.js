'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import CountUp from 'react-countup';
import { FadeIn } from '../components/common/AnimationUtils';

const missionBlog = [
  { iconClass: 'flaticon-open-book-1', title: 'Best Bookstore' },
  { iconClass: 'flaticon-exclusive', title: 'Trusted Seller' },
  { iconClass: 'flaticon-store', title: 'Expand Store' },
];

/**
 * Simplified AboutUs port.
 *
 * Drops the slider/newsletter/counter sections from the CRA version since
 * those components are not yet ported. Page-title, hero, mission grid, and
 * the CountUp stat block render unchanged. Add the missing sections back
 * as their components are migrated.
 */
export default function AboutUsPage() {
  return (
    <div className="page-content bg-white">
      {/* Simple inline page header (PageTitle component not yet ported). */}
                <FadeIn>
      <div className="dz-bnr-inr style-1 text-center" style={{ padding: '60px 0', background: '#f8f8f8' }}>
        <div className="container">
          <h1 className="title">About us</h1>
          <nav aria-label="breadcrumb">
            <ul className="breadcrumb-row" style={{ listStyle: 'none', padding: 0 }}>
              <li><Link href="/">Home</Link> / About us</li>
            </ul>
          </nav>
        </div>
      </div>

      <section className="content-inner overlay-white-middle">
        <div className="container">
          <div className="row about-style1 align-items-center">
            <div className="col-lg-6 m-b30">
              <div className="row sp10 about-thumb">
                <div className="col-sm-6 aos-item">
                  <div className="split-box">
                    <div>
                      <img
                        loading="lazy"
                        decoding="async"
                        className="m-b30"
                        src="/assets/images/about/about1.jpg"
                        alt=""
                      />
                    </div>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="split-box">
                    <div>
                      <img
                        loading="lazy"
                        decoding="async"
                        className="m-b20 aos-item"
                        src="/assets/images/about/about2.jpg"
                        alt=""
                      />
                    </div>
                  </div>
                  <div className="exp-bx aos-item">
                    <div className="exp-head">
                      <div className="counter-num">
                        <h2>
                          <span className="counter">
                            <CountUp end={50} />
                          </span>
                          <small>+</small>
                        </h2>
                      </div>
                      <h6 className="title">Years of Experience</h6>
                    </div>
                    <div className="exp-info">
                      <ul className="list-check primary">
                        <li>Comics & Graphics</li>
                        <li>Biography</li>
                        <li>Literary Collections</li>
                        <li>Children Fiction</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6 m-b30 aos-item">
              <div className="about-content px-lg-4">
                <div className="section-head style-1">
                  <h2 className="title">Shelf To Tales Is Best Choice For Learners</h2>
                  <p>
                    There are many variations of passages of Lorem Ipsum
                    available, but the majority have suffered alteration which
                    don’t look even slightly believable.
                  </p>
                </div>
                <Link href="/contact-us" className="btn btn-primary btnhover shadow-primary">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="content-inner-1 bg-light">
        <div className="container">
          <div className="section-head text-center">
            <h2 className="title">Our Mission</h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
          <div className="row">
            {missionBlog.map((data) => (
              <div className="col-lg-4 col-md-6" key={data.title}>
                <div className="icon-bx-wraper style-3 m-b30">
                  <div className="icon-lg m-b20">
                    <i className={`icon-cell ${data.iconClass}`} />
                  </div>
                  <div className="icon-content">
                    <h4 className="title">{data.title}</h4>
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                      sed do eiusmod tempor incididunt ut labore et dolore magna
                      aliqua.
                    </p>
                    <Link href="/about-us">
                      Learn More <i className="fa-solid fa-angles-right" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
                </FadeIn>
    </div>
  );
}
