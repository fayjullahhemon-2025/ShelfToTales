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
    {title:'How do I create an account?', answer:'Click Register and fill in your details. You can also sign up with Google.'},
    {title:'How does the book exchange work?', answer:'List books you want to give away, browse available books, send requests, and arrange exchanges with other readers.'},
    {title:'Can I read books online?', answer:'Yes! Click Read PDF on any book detail page to access our embedded reader.'},
];

const faqBookManaging = [
    {title:'How do reading challenges work?', answer:'Join a challenge, set your reading goal, and track your progress on your dashboard.'},
    {title:'Is ShelfToTales free?', answer:'Browsing and community features are free. Some books are available for purchase.'},
    {title:'How do I contact support?', answer:'Visit our Help Desk page or email support@shelftotales.com for assistance.'},
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
                                        <p>ShelfToTales is a community-driven bookstore platform connecting readers, writers, and book lovers worldwide. Here are answers to common questions.</p>
                                    </div>
                                    <div className="faq-accordion">
                                        <Accordion  flush>
                                            {accordionBlog.map((item, i)=>(
                                                <Accordion.Item key={i} eventKey={`${i}`} className="card">
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
                                                            {item.answer}
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
                                        <p>Everything you need to know about reading, exchanging, and tracking books on ShelfToTales.</p>
                                    </div>
                                    <div className="faq-accordion">
                                        <Accordion  flush>
                                            {faqBookManaging.map((item, i)=>(
                                                <Accordion.Item key={i} eventKey={`bm-${i}`} className="card">
                                                    <div className="card-header" >
                                                        <Accordion.Header as="h3" className="title">
                                                            <span>{item.title}</span> 
                                                            <span className="icon">
                                                                <i className="fa fa-angle-left" aria-hidden="true"></i>
                                                            </span>
                                                        </Accordion.Header>
                                                    </div>    
                                                    <Accordion.Body eventKey={`bm-${i}`}>
                                                        <p>
                                                            {item.answer}
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

