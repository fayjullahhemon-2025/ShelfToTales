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
                                <h4 className="title">The DexignZone Privacy Policy was updated on 20 July 2022.</h4>
                                <p className="m-b30">Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages,<Link href={"contact-us"}> Contact Us </Link>and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>
                                <div className="dlab-divider bg-gray-dark"></div>
                                <h4 className="title">Who We Are and What This Policy Covers</h4>
                                <p className="m-b30">Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>
                                
                                <h4 className="title">What personal information we collect</h4>
                                <ul className="list-check primary m-a0">
                                    <li>The DexignLab Privacy Policy was updated on 25 June 2018. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's </li>
                                    <li>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.</li>
                                    <li>Remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</li>
                                    <li>Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.</li>
                                    <li>Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.</li>
                                    
                                </ul>
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

