/**
 * @file src/components/GetStartedModal.jsx
 * Lead-capture modal — clean white modal on dark overlay.
 * Redo template: minimal form design with orange accents.
 */

import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const INITIAL_FORM = { name: '', email: '', institution: '' };
const INITIAL_ERRORS = { name: '', email: '', institution: '' };

export default function GetStartedModal({ onClose }) {
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState(INITIAL_ERRORS);
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');
    const [success, setSuccess] = useState(false);
    const firstInputRef = useRef(null);

    /* Focus trap & escape-to-close */
    useEffect(() => {
        firstInputRef.current?.focus();
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    const validate = () => {
        const errs = { name: '', email: '', institution: '' };
        let valid = true;
        if (!form.name.trim() || form.name.trim().length < 2) {
            errs.name = 'Please enter your full name.'; valid = false;
        }
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(form.email)) {
            errs.email = 'Please enter a valid email address.'; valid = false;
        }
        if (!form.institution.trim() || form.institution.trim().length < 2) {
            errs.institution = 'Please enter your institution name.'; valid = false;
        }
        setErrors(errs);
        return valid;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
        if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
        setServerError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        try {
            await api.post('/leads', {
                name: form.name.trim(),
                email: form.email.trim().toLowerCase(),
                institution: form.institution.trim(),
            });
            setSuccess(true);
        } catch (err) {
            if (err.response?.status === 409) {
                setErrors(p => ({ ...p, email: 'This email is already registered.' }));
            } else {
                setServerError(err.response?.data?.message || 'Something went wrong. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="modal-box">
                {/* Close button */}
                <button
                    onClick={onClose}
                    aria-label="Close"
                    style={{
                        position: 'absolute', top: 20, right: 20,
                        width: 32, height: 32, borderRadius: '50%',
                        border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', background: 'none',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--light-gray)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--mid)" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                {success ? (
                    /* Success State */
                    <div style={{ textAlign: 'center', padding: 'var(--sp-6) 0' }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: 'var(--orange-light)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto var(--sp-5)',
                        }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="2.5">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22,4 12,14.01 9,11.01" />
                            </svg>
                        </div>
                        <h2 id="modal-title" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'var(--fs-2xl)', color: 'var(--charcoal)', marginBottom: 'var(--sp-3)' }}>
                            You're on the list!
                        </h2>
                        <p style={{ color: 'var(--mid)', fontSize: 'var(--fs-base)', lineHeight: 1.7, marginBottom: 'var(--sp-6)' }}>
                            We'll reach out to <strong style={{ color: 'var(--dark)' }}>{form.email}</strong> as soon as your early access is ready.
                        </p>
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>
                            Done
                        </button>
                    </div>
                ) : (
                    /* Form State */
                    <>
                        {/* Orange accent top bar */}
                        <div style={{
                            height: 4, background: 'var(--orange)',
                            borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
                            position: 'absolute', top: 0, left: 0, right: 0,
                        }} />

                        <div style={{ marginBottom: 'var(--sp-6)', paddingTop: 'var(--sp-2)' }}>
                            <h2 id="modal-title" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'var(--fs-2xl)', color: 'var(--charcoal)', marginBottom: 'var(--sp-2)' }}>
                                Get Early Access
                            </h2>
                            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--mid)' }}>
                                Join the waitlist — free for early adopters.
                            </p>
                        </div>

                        {serverError && (
                            <div style={{
                                padding: 'var(--sp-3) var(--sp-4)',
                                background: '#FFF5F5', border: '1px solid #FED7D7',
                                borderRadius: 'var(--r-md)', marginBottom: 'var(--sp-4)',
                                fontSize: 'var(--fs-sm)', color: 'var(--error)',
                            }}>
                                {serverError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} noValidate>
                            {[
                                { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Dr. Rajesh Sharma', ref: firstInputRef },
                                { id: 'email', label: 'Work Email', type: 'email', placeholder: 'you@college.edu' },
                                { id: 'institution', label: 'Institution Name', type: 'text', placeholder: 'JNTU College of Engineering' },
                            ].map(({ id, label, type, placeholder, ref }) => (
                                <div className="form-group" key={id}>
                                    <label className="form-label" htmlFor={id}>{label}</label>
                                    <input
                                        ref={ref}
                                        id={id}
                                        name={id}
                                        type={type}
                                        placeholder={placeholder}
                                        value={form[id]}
                                        onChange={handleChange}
                                        className={`form-input${errors[id] ? ' error' : ''}`}
                                        autoComplete={id === 'email' ? 'email' : 'off'}
                                    />
                                    {errors[id] && (
                                        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--error)', fontWeight: 500 }}>
                                            {errors[id]}
                                        </span>
                                    )}
                                </div>
                            ))}

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                style={{ width: '100%', marginTop: 'var(--sp-2)', justifyContent: 'center' }}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <svg style={{ animation: 'spin 0.8s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                        </svg>
                                        Submitting…
                                    </>
                                ) : (
                                    'Join the Waitlist →'
                                )}
                            </button>

                            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', textAlign: 'center', marginTop: 'var(--sp-3)' }}>
                                No credit card required. We respect your privacy.
                            </p>
                        </form>

                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </>
                )}
            </div>
        </div>
    );
}
