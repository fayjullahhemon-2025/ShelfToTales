'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService, userService } from '../lib/api';
import Swal from 'sweetalert2';

// Styles & Images
import './AuthLayout.css';
const loginImage = '/assets/images/login-signup.jpg';
const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '908376284076-qp26p58bj59uatj3am37l9dk6sqm5bcb.apps.googleusercontent.com';

function RegistrationInner(){
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const initGoogle = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: handleGoogleResponse,
                });
                window.google.accounts.id.renderButton(
                    document.getElementById('google-signup-btn'),
                    { theme: 'outline', size: 'large', width: 250, text: 'signup_with' }
                );
                return true;
            }
            return false;
        };
        if (!initGoogle()) {
            const interval = setInterval(() => {
                if (initGoogle()) clearInterval(interval);
            }, 300);
            return () => clearInterval(interval);
        }
    }, []);

    const handleGoogleResponse = async (response) => {
        try {
            console.log('Google token received, sending to backend...');
            const res = await authService.googleAuth(response.credential);
            localStorage.setItem('token', res.data.token);
            const profileRes = await userService.getProfile();
            localStorage.setItem('user', JSON.stringify(profileRes.data));
            Swal.fire('Success', 'Account created with Google', 'success');
            window.location.href = '/dashboard';
        } catch (error) {
            console.error('Google auth error:', error);
            console.error('Response data:', error.response?.data);
            Swal.fire('Error', error.response?.data?.message || error.message || 'Google login failed', 'error');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        if (!termsAccepted) {
            Swal.fire('Notice', 'Please agree to the Terms & Conditions', 'warning');
            return;
        }

        try {
            await authService.register({ fullName, email, password });
            Swal.fire('Success', 'Account created successfully! Please login.', 'success');
            router.push('/shop-login');
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Registration failed', 'error');
        }
    };

    return(
        <div className="auth-split-container">
            <div className="auth-form-side">
                <h1 className="auth-heading">Ready to start your<br />success story?</h1>
                <p className="auth-subheading">Signup to our website and start leafing<br />through your favorite literature today!</p>
                
                <div id="google-signup-btn" className="auth-google-btn"></div>

                <div className="auth-divider"><span>or</span></div>
                
                <form onSubmit={handleRegister}>
                    <div className="auth-input-group">
                        <label className="auth-input-label">Full name</label>
                        <input 
                            className="auth-input" 
                            type="text" 
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="auth-input-group">
                        <label className="auth-input-label">Email</label>
                        <input 
                            className="auth-input" 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="auth-input-group">
                        <label className="auth-input-label">Password</label>
                        <input 
                            className="auth-input" 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="auth-checkbox-group">
                        <input 
                            type="checkbox" 
                            id="terms" 
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                        />
                        <label htmlFor="terms">I agree to the <Link href="/privacy-policy">Terms & Conditions</Link></label>
                    </div>
                    
                    <button type="submit" className="auth-submit-btn">Sign up</button>
                </form>

                <div className="auth-switch-link">
                    Already have an account? <Link href="/shop-login">Login here</Link>
                </div>
            </div>
            
            <div className="auth-image-side">
                <img loading="lazy" decoding="async" src={loginImage} alt="Girl reading a book with a cat" />
            </div>
        </div>
    )
}
import ClientOnly from '../components/ClientOnly';
import { FadeIn } from '../components/common/AnimationUtils';
export default function Registration() {
  return <ClientOnly><RegistrationInner /></ClientOnly>;
}

