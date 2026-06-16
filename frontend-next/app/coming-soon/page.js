'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React,{useState, useEffect, useRef} from 'react';
import emailjs from '@emailjs/browser'
import Link from 'next/link';

import DonutChart2 from '../components/common/DonutChart2';
import { FadeIn } from '../components/common/AnimationUtils';
const bg2 = '/assets/images/background/bg2.jpg';
const logowhite = '/assets/images/logo-white.png';
function ComingSoon(){
    const [timerDays, setTimerDays] = useState('00');	
	const [timerHours, setTimerHours] = useState('00');	
	const [timerMinutes, setTimerMinutes] = useState('00');	
	const [timerSeconds, setTimerSeconds] = useState('00');	
	const interval = useRef();

	const startTimer = () =>{
		/* Website Launch Date */
		var WebsiteLaunchDate = new Date();
		var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		WebsiteLaunchDate.setMonth(WebsiteLaunchDate.getMonth() + 1);
		WebsiteLaunchDate =  WebsiteLaunchDate.getDate() + " " + monthNames[WebsiteLaunchDate.getMonth()] + " " + WebsiteLaunchDate.getFullYear();
		/* Website Launch Date END */

		const countdownDate = new Date("Dec 31, 2026 23:59:59").getTime();
		//const countdownDate = new Date(WebsiteLaunchDate+' 23:5').getTime();
		interval.current = setInterval(()=>{
			const now = new Date().getTime();
			const distance = countdownDate - now;
			const days = Math.floor(distance / (1000*60*60*24));
			const hours = Math.floor((distance % (1000*60*60*24)/(1000*60*60)));
			const minutes = Math.floor((distance % (1000*60*60)/(1000*60)));
			const seconds = Math.floor((distance % (1000*60))/1000);
			
			if(distance < 0){
				//stop our timer
				clearInterval(interval.current);
			} else {
				//update timer
				setTimerDays(days);
				setTimerHours(hours);
				setTimerMinutes(minutes);
				setTimerSeconds(seconds);
			}	
		},1000);
	};
	
	//componentDidMount
	useEffect(()=>{
		startTimer();
		const savedInterval = interval.current;
		return()=>{
			clearInterval(savedInterval);
		};
	}, []);
	
	//Email
	const form = useRef();
	const sendEmail = (e) => {
		e.preventDefault();
		const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '';
		const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '';
		const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '';
		if (!serviceId || !templateId || !publicKey) {
			console.error('EmailJS is not configured. Please set NEXT_PUBLIC_EMAILJS_SERVICE_ID, NEXT_PUBLIC_EMAILJS_TEMPLATE_ID, and NEXT_PUBLIC_EMAILJS_PUBLIC_KEY env variables.');
			return;
		}
		emailjs.sendForm(serviceId, templateId, e.target, publicKey)
		  .then((result) => {
			  console.log(result.text);
		  }, (error) => {
			  console.log(error.text);
		  });
		  e.target.reset()
	};	
    return(
        <>
            <div className="dez-coming-soon style-3">
                <div className="bg-img" style={{backgroundImage:'url(' + bg2 + ')'}}></div>
                <div className="clearfix dez-coming-bx">
                    <div className="dez-content">
                        <div className="center-md">
                            <div className="logo top-left m-b30">
                                <Link href={'/'}><img loading="lazy" decoding="async" src={logowhite} alt="" /></Link>
                            </div>
                            <h2 className="dez-title mb-2">COMING SOON</h2>
                            <p className="text-white">Our website is coming soon, follow us for update now!</p>
                            
                            <form className="dzSubscribe"ref={form} onSubmit={sendEmail}>
                                <div className="ft-subscribe">
                                    <div className="dzSubscribeMsg text-white"></div>
                                    <div className="ft-row m-b15">
                                        <input name="dzEmail" required="required" type="email" placeholder="Enter Email Address" className="form-control" />
                                        <button name="submit" value="Submit" type="submit" className="btn"><i className="fas fa-arrow-right"></i></button>
                                    </div>
                                    <p className="text-white">And don’t worry, we hate spam too! You can unsubcribe at anytime.</p>
                                </div>
                            </form>
                            
                            <div className="countdown-timer countdown-container">
                                <div className="clock">
                                    <div className="clock-item clock-days countdown-time-value">
										<div className="clock-canvas">
											<DonutChart2 value={timerDays} backgroundColor="rgba(255,255,255,1)"
												backgroundColor2= "rgba(255, 255, 255,0.4)"
											/>
										</div>	
                                        <div className="text">
                                            <p className="val">{timerDays}</p>
                                            <p className="type-days type-time" data-border-color="#fff">Days</p>
                                        </div>
                                    </div>
                                    <div className="clock-item clock-hours countdown-time-value">
                                        <div  className="clock-canvas">
											<DonutChart2 value={timerHours} backgroundColor="rgba(255,255,255,1)"
												backgroundColor2= "rgba(255, 255, 255,0.4)"
											/>
										</div>
                                        <div className="text">
                                            <p className="val">{timerHours}</p>
                                            <p className="type-hours type-time" data-border-color="#fff">Hours</p>
                                        </div>
                                    </div>
                                    <div className="clock-item clock-minutes countdown-time-value">
                                        <div id="canvas-minutes" className="clock-canvas">
											<DonutChart2 value={timerMinutes} backgroundColor="rgba(255,255,255,1)"
												backgroundColor2= "rgba(255, 255, 255,0.4)"
											/>
										</div>
                                        <div className="text">
                                            <p className="val">{timerMinutes}</p>
                                            <p className="type-minutes type-time" data-border-color="#fff">Minutes</p>
                                        </div>
                                    </div>
                                    <div className="clock-item clock-seconds countdown-time-value">
                                        <div id="canvas-seconds" className="clock-canvas">
											<DonutChart2 value={timerSeconds} backgroundColor="rgba(255,255,255,1)"
												backgroundColor2= "rgba(255, 255, 255,0.4)"
											/>
										</div>
                                        <div className="text">
                                            <p className="val">{timerSeconds}</p>
                                            <p className="type-seconds type-time" data-border-color="#fff">Seconds</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="top-right">
                        <ul className="dez-social-icon">
                            <li><Link href={'#'} className="fab fa-facebook-f me-2"></Link></li>
                            <li><Link href={'#'} className="fab fa-twitter me-2"></Link></li>
                            <li><Link href={'#'} className="fab fa-linkedin-in me-2"  ></Link></li>
                            <li><Link href={'#'} className="fab fa-instagram"></Link></li>
                        </ul>
                    </div>
                </div>
            </div>
        </>
    )
}
export default ComingSoon;

