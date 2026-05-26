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
                                    Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the when an unknown printer took a galley of type and scrambled it to make a type specimen book.</p>
                                <h4 className="title">Emergency Service</h4>
                                <p>
                                    Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the  when an unknown printer took a galley of type and scrambled it to make a type specimen book. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the when an unknown printer took a galley of type and scrambled it to make a type specimen book. 
                                </p>
                                <p className="m-b30">
                                    Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy 
                                    text ever since the  when an unknown printer took a galley of type and scrambled it to make a type specimen book. 
                                </p>
                                <h4 className="title">Tips </h4>
                                <ul className="list-check primary m-b30">
                                    <li>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry.</li>
                                    <li>Dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy</li>
                                    <li>Printer took a galley of type and scrambled it to make a type specimen book. </li>
                                    <li>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard.</li>
                                    <li>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the dummy book. </li>
                                    <li>Eorem ipsum dolor sit amete printing and typesetting industry. </li>
                                </ul>
                                <h4  className="title">Health Care</h4>
                                <p>
                                    Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the  when an unknown printer took a galley of type and scrambled it to make a type specimen book. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the  when an unknown printer took a galley of type and scrambled it to make a type specimen book. 
                                </p>
                                <p className="m-b30">
                                    Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has     been the industry's standard dummy text ever since the  when an unknown printer took a galley of type and scrambled it to make a type specimen book. 
                                </p>
                                <h4 className="title">Our Help </h4>
                                <ul className="list-check primary">
                                    <li>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry.</li>
                                    <li>Dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy</li>
                                    <li>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard.</li>
                                    <li>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the dummy book. </li>
                                    <li>Eorem ipsum dolor sit amete printing and typesetting industry. </li>
                                </ul>
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

