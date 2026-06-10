'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';

import PageTitle from '../components/layout/PageTitle';
import { FadeIn } from '../components/common/AnimationUtils';

function HelpDesk(){
    return(
        <>
            <div className="page-content">
                <PageTitle childPage="Help Desk" parentPage="Pages" />
                <FadeIn>
                <div className="section-full content-inner-1 bg-white">
                    <div className="container">
                        <div className="row">
                            {/* <!-- Left part start --> */}
                            <div className="col-lg-8 col-md-7 col-sm-12 inner-text">
                                <h2 className="title">Help Desk</h2>
                                <p className="m-b30">
                                    Need help? Here are some quick resources to get you started with ShelfToTales.</p>
                                <h4 className="title">Quick Resources</h4>
                                <ul className="list-check primary m-b30">
                                    <li><strong>Account Issues:</strong> Visit your Profile page to update settings</li>
                                    <li><strong>Billing:</strong> Check your Purchase History for order details</li>
                                    <li><strong>Book Exchange:</strong> Read our Exchange Guide for step-by-step instructions</li>
                                    <li><strong>Technical Support:</strong> Email support@shelftotales.com</li>
                                    <li><strong>Feature Requests:</strong> Share your ideas on our Community page</li>
                                </ul>
                                <h4 className="title">Getting Started</h4>
                                <p className="m-b30">
                                    New to ShelfToTales? Create an account to browse our catalog, join reading challenges, exchange books with other readers, and track your reading progress. Most features are free to use.
                                </p>
                                <h4 className="title">Contact Us</h4>
                                <p>
                                    If you can't find what you're looking for, reach out to our support team at support@shelftotales.com. We typically respond within 24 hours.
                                </p>
                            </div>
                            <div className="col-lg-4 col-md-5 col-sm-12 m-b30 mt-md-0 mt-4">
                                <aside className="side-bar sticky-top right">
                                    <div className="service_menu_nav widget style-1">
                                        <ul className="menu">
                                            <li className="menu-item"><Link href={"/about-us"}>About Us</Link></li>
                                            <li className="menu-item"><Link href={"/privacy-policy"}>Privacy Policy</Link></li>
                                            <li className="menu-item active"><Link href={"/help-desk"}>Help Desk</Link></li>
                                            <li className="menu-item"><Link href={"/contact-us"}>Contact Us</Link></li>
                                        </ul>
                                    </div>
                                </aside>
                            </div>
                        </div>
                    </div>
                </div>
                </FadeIn>
            
            </div>
        </>
    )
}
export default HelpDesk;

