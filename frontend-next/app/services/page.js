'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';

//Components 
import PageTitle from '../components/layout/PageTitle';
import ClientsSlider from '../components/features/Home/ClientsSlider';
//element
import CounterSection from '../components/common/CounterSection';
import NewsLetter from '../components/features/NewsLetter';
import { FadeIn } from '../components/common/AnimationUtils';

//images
const service1 = '/assets/images/services/service1.jpg';
const service2 = '/assets/images/services/service2.jpg';
const service3 = '/assets/images/services/service3.jpg';
const service4 = '/assets/images/services/service4.jpg';
const service5 = '/assets/images/services/service5.jpg';
const service6 = '/assets/images/services/service6.jpg';
const serviceCard = [
    {title:'24*7 Support', image: service5},
    {title:'Sitting Arrangement', image: service2},
    {title:'Proper Management', image: service3},
    {title:'Online Registration', image: service4},
    {title:'Download PDF', image: service1},
    {title:'Flexible Timing', image: service6},
];

function Services(){
    return(
        <>
            <div className="page-content">
                <PageTitle  parentPage="Pages" childPage="Services" />
                <FadeIn>
                <section className="content-inner bg-white">
                    <div className="container">	
                        <div className="row">
                            {serviceCard.map((data, index)=>(
                                <div className="col-lg-4 col-md-6" key={index}>
                                    <div className="content-box style-1 m-b30">
                                        <div className="dz-info">
                                            <h4 className="title">{data.title}</h4>
                                            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna </p>
                                        </div>
                                        <div className="dz-banner-media1.jpg m-b30">
                                            <img loading="lazy" decoding="async" src={data.image} alt="" />
                                        </div>
                                        <div className="dz-bottom">
                                            <Link href={"/services"} className="btn-link btnhover3">READ MORE<i className="fas fa-arrow-right m-l10"></i></Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>  
                    </div>
                </section> 
                <section className="content-inner bg-light">
                    <div className="container">
                        <div className="row sp15">   
                            <CounterSection />        
                        </div>
                    </div>
                </section>    
                </FadeIn>
                <div className="bg-white py-5">
				    <div className="container">        
                        <ClientsSlider />      
                    </div>
                </div>  
                <NewsLetter />  
            </div>
        </>
    )
}
export default Services;

