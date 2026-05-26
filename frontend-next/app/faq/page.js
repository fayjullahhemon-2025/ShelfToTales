'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React from 'react';
import {Accordion} from 'react-bootstrap';

//Components 
import PageTitle from '../components/layout/PageTitle';
//element
import CounterSection from '../components/common/CounterSection';
import { FadeIn } from '../components/common/AnimationUtils';
//image
const pic1 = '/assets/images/about/pic1.jpg';
const pic2 = '/assets/images/about/pic2.jpg';
const accordionBlog = [
    {title:'Cras turpis felis, elementum sed mi at ?'},
    {title:'Vestibulum nibh risus, in neque eleifen ?'},
    {title:'Donec maximus, sapien id auctor ?'}
];

function Faq(){
    return(
        <>
            <div className="page-content">
                <PageTitle  parentPage="Pages" childPage="FAQ's" />
                <FadeIn>
                <section className="main-faq-content content-inner">
                    <div className="container">
                        <div className="row">
                            <div className="col-lg-6 align-self-center mb-4">
                                <div className="faq-content-box">
                                    <div className="section-head">
                                        <h2 className="title">What Is Shelf To Tales?</h2>
                                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation</p>
                                    </div>
                                    <div className="faq-accordion">
                                        <Accordion  flush>
                                            {accordionBlog.map((item, i)=>(
                                                <Accordion.Item eventKey={`${i}`} className="card">
                                                    <div className="card-header" >
                                                        <Accordion.Header as="h3" className="title">
                                                            <span>{item.title}</span> 
                                                            <span className="icon">
                                                                <i className="fa fa-angle-left" aria-hidden="true"></i>
                                                            </span>
                                                        </Accordion.Header>
                                                    </div>    
                                                    <Accordion.Body eventKey={`${i}`}>
                                                        <p>
                                                            Vestibulum nibh risus, lobortis in neque eleifend, varius vulputate sem. Donec maximus, sapien id auctor ornare, odio mi luctus massa, id rhoncus velit purus eu turpis onec aliquet mauris est.
                                                        </p>
                                                    </Accordion.Body>
                                                </Accordion.Item>
                                            ))}
                                        </Accordion>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-6 order-lg-2 order-1 mb-4">
                                <div className="faq-img-box wow left-animation rounded-md" data-wow-delay="0.2s">
                                    <img loading="lazy" decoding="async" src={pic2} alt="FAQ" /> 
                                </div>
                            </div>

                        </div>
                    </div>        
                </section>
                <section className="main-faq-content bg-light content-inner">
                    <div className="container">
                        <div className="row">
                            <div className="col-lg-6 mb-4">
                                <div className="faq-img-box rounded-md">
                                    <img loading="lazy" decoding="async" src={pic1} alt="FAQ" />
                                </div>
                            </div>
                            <div className="col-lg-6 align-self-center mb-4">
                                <div className="faq-content-box">
                                    <div className="section-head">
                                        <h2 className="title">Managing Books</h2>
                                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation</p>
                                    </div>
                                    <div className="faq-accordion">
                                        <Accordion  flush>
                                            {accordionBlog.map((item, i)=>(
                                                <Accordion.Item eventKey={`${i}`} className="card">
                                                    <div className="card-header" >
                                                        <Accordion.Header as="h3" className="title">
                                                            <span>{item.title}</span> 
                                                            <span className="icon">
                                                                <i className="fa fa-angle-left" aria-hidden="true"></i>
                                                            </span>
                                                        </Accordion.Header>
                                                    </div>    
                                                    <Accordion.Body eventKey={`${i}`}>
                                                        <p>
                                                            Vestibulum nibh risus, lobortis in neque eleifend, varius vulputate sem. Donec maximus, sapien id auctor ornare, odio mi luctus massa, id rhoncus velit purus eu turpis onec aliquet mauris est.
                                                        </p>
                                                    </Accordion.Body>
                                                </Accordion.Item>
                                            ))}
                                        </Accordion>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="content-inner bg-white">
                    <div className="container">
                        <div className="row sp15">
                            <CounterSection />
                        </div>
                    </div>
                </section>
                </FadeIn>
            </div>
        </>
    )    
    
}
export default Faq;

