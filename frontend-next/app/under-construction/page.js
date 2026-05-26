'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { FadeIn } from '../components/common/AnimationUtils';
const ucimage = '/assets/images/background/uc.jpg';
const logo = '/assets/images/logo.png';
const UnderConstruction = ()=>{
    return(
        <>
            <div className="under-construct">
                <div className="inner-box">
                    <div className="logo-header logo-dark">
                        <Link href={"/"}><img loading="lazy" decoding="async" src={logo} alt="" /></Link>
                    </div>	
                    <div className="dz-content">
                        <h2 className="dz-title">Site Is Down <br/>For <span className="text-primary">Maintenance</span></h2>
                        <p>This is the Technical Problems Page.<br /> Or any other page.</p>
                    </div>
                </div>
                <img loading="lazy" decoding="async" src={ucimage} className="uc-bg" alt="" />
            </div>
        </>
    )
}
export default UnderConstruction;

