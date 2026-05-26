'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React, {useRef} from 'react';
import emailjs from '@emailjs/browser';
import swal from "sweetalert2";	

import PageTitle from '../components/layout/PageTitle';
import CounterSection from '../components/common/CounterSection';
import NewsLetter from '../components/features/NewsLetter';
import { FadeIn } from '../components/common/AnimationUtils';
const bg2 = '/assets/images/background/bg2.jpg';
const ContactUs = () =>{
    const form = useRef();
	const sendEmail = (e) => {
		e.preventDefault();
		//emailjs.sendForm('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', form.current, 'YOUR_USER_ID')
		emailjs.sendForm('service_gfykn6i', 'template_iy1pb0b', e.target, 'HccoOtZS6GHw-N-m6')
		  .then((result) => {
			  console.log(result.text);
		  }, (error) => {
			  console.log(error.text);
		  });
		  e.target.reset()
		  swal('Good job!', 'form successfuly submmited', "success");
	};
    return(
        <>
            <div className="page-content">
                <PageTitle parentPage="Home" childPage="Contact" />    
                <FadeIn>
                <div className="content-inner-2 pt-0">
                    <div className="map-iframe">
                        <iframe title="ShelfToTales Location Map" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d227748.3825624477!2d75.65046970649679!3d26.88544791796718!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396c4adf4c57e281%3A0xce1c63a0cf22e09!2sJaipur%2C+Rajasthan!5e0!3m2!1sen!2sin!4v1500819483219" style={{border:'0', width:'100%', minHeight:'100%', marginBottom: '-8px'}} allowFullScreen></iframe>
                    </div>
                </div>
                <section className="contact-wraper1" style={{backgroundImage: 'url('+ bg2 +')'}}>	
                    <div className="container" >
                        <div className="row">
                            <div className="col-lg-5">
                                <div className="contact-info">
                                    <div className="section-head text-white style-1">
                                        <h3 className="title text-white">Get In Touch</h3>
                                        <p>If you are interested in working with us, please get in touch.</p>
                                    </div>
                                    <ul className="no-margin">
                                        <li className="icon-bx-wraper text-white left m-b30">
                                            <div className="icon-md">
                                                <span className="icon-cell text-primary">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-map-pin"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                                </span>
                                            </div>
                                            <div className="icon-content">
                                                <h5 className=" dz-tilte text-white">Our Address</h5>
                                                <p>1247/Plot No. 39, 15th Phase, Huab Colony, Kukatpally, Hyderabad</p>
                                            </div>
                                        </li>
                                        <li className="icon-bx-wraper text-white left m-b30">
                                            <div className="icon-md">
                                                <span className="icon-cell text-primary">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-mail"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                                </span>
                                            </div>
                                            <div className="icon-content">
                                                <h5 className="dz-tilte text-white">Our Email</h5>
                                                <p>info@gmail<br />services@gmail.com</p>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div className="col-lg-7 m-b40">
                                <div className="contact-area1 m-r20 m-md-r0">
                                    <div className="section-head style-1">
                                        <h6 className="sub-title text-primary">CONTACT US</h6>
                                        <h3 className="title m-b20">Get In Touch With Us</h3>
                                    </div>
                                    <form className="dz-form dzForm" ref={form} onSubmit={sendEmail}>
                                        <input type="hidden" className="form-control" name="dzToDo" defaultValue="Contact" />
                                        <div className="dzFormMsg"></div>		
                                        <div className="input-group">
                                            <input required type="text" className="form-control" name="dzName" placeholder="Full Name" />
                                        </div>
                                        <div className="input-group">
                                            <input required type="text" className="form-control" name="dzEmail" placeholder="Email Adress" />
                                        </div>
                                        <div className="input-group">
                                            <input required type="text" className="form-control" name="dzPhoneNumber" placeholder="Phone No." />
                                        </div>
                                        <div className="input-group">
                                            <textarea required name="dzMessage" rows="5" className="form-control">Message</textarea>
                                        </div>
                                        <div>
                                            <button name="submit" type="submit" value="submit" className="btn w-100 btn-primary btnhover">SUBMIT</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="content-inner">
                    <div className="container">
                        <div className="row sp15">
                            <CounterSection />      
                        </div>   
                    </div>
                </section>  
                </FadeIn>
                <NewsLetter />
            </div>
        </>
    )
}
export default ContactUs;

