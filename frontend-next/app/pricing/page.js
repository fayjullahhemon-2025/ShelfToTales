'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';

import PageTitle from '../components/layout/PageTitle';
import NewsLetter from '../components/features/NewsLetter';
import { FadeIn } from '../components/common/AnimationUtils';

const pricingCard = [
    {title:'Basic Plan',price:'99'},
    {title:'Standart Plan',price:'149'},
    {title:'Premium Plan',price:'199'},
];

function Pricing(){
    return(
        <>
            <div className="page-content">
                <PageTitle childPage="Pricing Table" parentPage="Pages"  /> 
                <FadeIn>
                <section className="content-inner-1 bg-light">
                    <div className="container">
                        <div className="row pricingtable-wraper">
                            {pricingCard.map((data, index)=>(
                                <div className="col-lg-4 col-md-6" key={index}>
                                    <div className="pricingtable-wrapper style-1 m-b30">
                                        <div className="pricingtable-inner">
                                            <div className="pricingtable-title">
                                                <h3 className="title">{data.title}</h3>
                                            </div>
                                            <div className="pricingtable-price"> 
                                                <h2 className="pricingtable-bx">${data.price}<small className="pricingtable-type">/Month</small></h2>
                                            </div>
                                            <p className="text">Aliquam dui lacus, lobortis quis sapien non.</p>
                                            <ul className="pricingtable-features">
                                                <li>Graphic Design </li>
                                                <li>Web Design</li>
                                                <li>UI/UX</li>
                                                <li>HTML/CSS</li>
                                                <li>SEO Marketing</li>
                                                <li>Business Analysis</li>
                                            </ul>
                                            <div className="pricingtable-footer"> 
                                                <Link href={"/pricing"} className="btn btn-primary btnhover3">Start Now <i className="fa fa-angle-right m-l10"></i></Link> 
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>          
                </FadeIn>
                <NewsLetter />


            </div>
        </>
    )
}
export default Pricing;

