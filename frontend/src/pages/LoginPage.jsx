/**
 * @file src/pages/LoginPage.jsx
 * Google Sign-In page — Redo template style (dark charcoal + orange).
 * Renders when the user is not authenticated.
 */

import { useGoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onBack }) {
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    /* Exchange the Google token for user profile info */
    const handleSuccess = async (tokenResponse) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(
                `https://www.googleapis.com/oauth2/v3/userinfo`,
                { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
            );
            if (!res.ok) throw new Error('Failed to fetch user info from Google.');
            const profile = await res.json();
            login({
                name: profile.name,
                email: profile.email,
                picture: profile.picture,
                sub: profile.sub,
            });
        } catch (err) {
            setError(err.message || 'Sign-in failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: handleSuccess,
        onError: () => setError('Google sign-in was cancelled or failed. Please try again.'),
    });

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--charcoal)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--sp-6)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background blobs */}
            <div style={{
                position: 'absolute', top: '-10%', right: '-5%',
                width: 480, height: 480, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,106,0,0.12) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '-10%', left: '-5%',
                width: 360, height: 360, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,106,0,0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            {/* Card */}
            <div style={{
                background: '#1A1A1A',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: 'clamp(32px, 5vw, 48px)',
                width: '100%',
                maxWidth: 420,
                textAlign: 'center',
                boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
                position: 'relative',
                zIndex: 1,
            }}>
                {/* Orange top accent */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 4,
                    background: 'var(--orange)',
                    borderRadius: '20px 20px 0 0',
                }} />

                {/* Logo */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--sp-6)' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 8,
                            background: 'var(--orange)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="3" width="7" height="7" rx="1" fill="white" />
                                <rect x="14" y="3" width="7" height="7" rx="1" fill="white" opacity="0.6" />
                                <rect x="3" y="14" width="7" height="7" rx="1" fill="white" opacity="0.6" />
                                <rect x="14" y="14" width="7" height="7" rx="1" fill="white" />
                            </svg>
                        </div>
                        <span style={{
                            fontFamily: 'var(--font-heading)', fontWeight: 800,
                            fontSize: '1.15rem', color: 'white', letterSpacing: '-0.03em',
                        }}>
                            Exam<span style={{ color: 'var(--orange)' }}>Sched</span>
                        </span>
                    </div>
                </div>

                {/* Heading */}
                <h1 style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 800,
                    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                    color: 'white',
                    marginBottom: 'var(--sp-2)',
                    letterSpacing: '-0.02em',
                }}>
                    Welcome Back
                </h1>
                <p style={{
                    fontSize: 'var(--fs-sm)',
                    color: 'rgba(255,255,255,0.45)',
                    marginBottom: 'var(--sp-8)',
                    lineHeight: 1.6,
                }}>
                    Sign in with your institutional Google account to access the scheduling dashboard.
                </p>

                {/* Error */}
                {error && (
                    <div style={{
                        padding: '10px 14px',
                        background: 'rgba(229,62,62,0.12)',
                        border: '1px solid rgba(229,62,62,0.3)',
                        borderRadius: 8,
                        marginBottom: 'var(--sp-4)',
                        fontSize: 'var(--fs-sm)',
                        color: '#FC8181',
                        textAlign: 'left',
                    }}>
                        {error}
                    </div>
                )}

                {/* Google Sign-In Button */}
                <button
                    onClick={() => { setError(''); googleLogin(); }}
                    disabled={loading}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 12,
                        padding: '14px 20px',
                        background: 'white',
                        border: 'none',
                        borderRadius: 8,
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 700,
                        fontSize: 'var(--fs-base)',
                        color: '#1A1A1A',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
                    }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                >
                    {loading ? (
                        <>
                            <svg style={{ animation: 'spin 0.8s linear infinite' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5">
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                            </svg>
                            Signing in…
                        </>
                    ) : (
                        <>
                            {/* Google "G" logo */}
                            <svg width="20" height="20" viewBox="0 0 48 48">
                                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                            </svg>
                            Sign in with Google
                        </>
                    )}
                </button>

                {/* Divider */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
                    margin: 'var(--sp-6) 0 var(--sp-4)',
                }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        or
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                </div>

                {/* Back to landing link */}
                <button
                    onClick={() => onBack ? onBack() : window.history.back()}
                    style={{
                        background: 'none', border: 'none',
                        color: 'rgba(255,255,255,0.35)',
                        fontSize: 'var(--fs-sm)', cursor: 'pointer',
                        transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => e.target.style.color = 'var(--orange)'}
                    onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.35)'}
                >
                    ← Back to home
                </button>

                <p style={{ marginTop: 'var(--sp-5)', fontSize: 'var(--fs-xs)', color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>
                    By signing in, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
