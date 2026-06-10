'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';

import PageTitle from '../components/layout/PageTitle';
import { FadeIn } from '../components/common/AnimationUtils';

function PrivacyPolicy(){
    return(
        <>
            <div className="page-content">
                <PageTitle childPage="Privacy Policy" parentPage="Pages" />
                <FadeIn>
                <section className="content-inner-1 shop-account">
                    <div className="container">
                        <div className="row">
                            {/* <!-- Left part start --> */}
                            <div className="col-lg-8 col-md-7 col-sm-12 inner-text">
                                <h4 className="title">ShelfToTales Privacy Policy</h4>
                                <p className="m-b30">Last updated: January 2025. We are committed to protecting your privacy and ensuring transparency about how we handle your data.</p>
                                <div className="dlab-divider bg-gray-dark"></div>
                                <h4 className="title">What We Collect</h4>
                                <p className="m-b30">We collect only the data needed to provide our services: your name, email address, and reading activity. We do not collect unnecessary personal information.</p>
                                
                                <h4 className="title">How We Use Your Data</h4>
                                <ul className="list-check primary m-a0">
                                    <li>To provide and improve ShelfToTales services</li>
                                    <li>To personalize your reading recommendations</li>
                                    <li>To communicate account updates and community activity</li>
                                    <li>To process purchases and book exchanges</li>
                                    <li>For analytics to improve the platform experience</li>
                                </ul>

                                <h4 className="title" style={{ marginTop: 20 }}>Your Rights</h4>
                                <ul className="list-check primary m-a0">
                                    <li>We never sell your personal data to third parties</li>
                                    <li>Reading activity is private unless you choose to share it</li>
                                    <li>You can delete your account and data at any time</li>
                                    <li>You can request a copy of all data we hold about you</li>
                                </ul>

                                <h4 className="title" style={{ marginTop: 20 }}>Cookies &amp; Contact</h4>
                                <p>We use cookies for authentication and analytics. For data requests or questions, contact us at <strong>privacy@shelftotales.com</strong>.</p>
                            </div>
                            <div className="col-lg-4 col-md-5 col-sm-12 m-b30 mt-md-0 mt-4">
                                <aside className="side-bar sticky-top right">
                                    <div className="service_menu_nav widget style-1">
                                        <ul className="menu">
                                            <li className="menu-item"><Link href={"/about-us"}>About Us</Link></li>
                                            <li className="menu-item active"><Link href={"/privacy-policy"}>Privacy Policy</Link></li>
                                            <li className="menu-item "><Link href={"/help-desk"}>Help Desk</Link></li>
                                            <li className="menu-item"><Link href={"/contact-us"}>Contact Us</Link></li>
                                        </ul>
                                    </div>
                                </aside>
                            </div>
                        </div>
                    </div>
                </section>
                </FadeIn>
            
            </div>
        </>
    )
}
export default PrivacyPolicy;

