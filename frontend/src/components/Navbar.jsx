/**
 * @file src/components/Navbar.jsx
 * Minimal clean nav — white bg with orange CTA, inspired by Redo brand template.
 */

import { useState, useEffect } from 'react';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Benefits', href: '#benefits' },
];

export default function Navbar({ onGetStarted, onLogin }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (href) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 'var(--z-nav)',
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,1)',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        transition: 'all 0.25s ease',
        boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 68,
        }}
      >
        {/* Logo */}
        <a
          href="#hero"
          onClick={(e) => { e.preventDefault(); scrollTo('#hero'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
        >
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 6,
            background: 'var(--orange)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="1" fill="white" />
              <rect x="14" y="3" width="7" height="7" rx="1" fill="white" opacity="0.6" />
              <rect x="3" y="14" width="7" height="7" rx="1" fill="white" opacity="0.6" />
              <rect x="14" y="14" width="7" height="7" rx="1" fill="white" />
            </svg>
          </div>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: '1.05rem',
            color: 'var(--charcoal)',
            letterSpacing: '-0.03em',
          }}>
            Exam<span style={{ color: 'var(--orange)' }}>Sched</span>
          </span>
        </a>

        {/* Desktop Nav Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-6)' }} className="hide-mobile">
          {NAV_LINKS.map(({ label, href }) => (
            <button
              key={label}
              onClick={() => scrollTo(href)}
              style={{
                background: 'none',
                border: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--fs-sm)',
                fontWeight: 500,
                color: 'var(--mid)',
                cursor: 'pointer',
                padding: '4px 0',
                transition: 'color 0.2s',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={e => e.target.style.color = 'var(--orange)'}
              onMouseLeave={e => e.target.style.color = 'var(--mid)'}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <button
            className="btn btn-outline btn-sm hide-mobile"
            onClick={onLogin}
          >
            Log In
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={onGetStarted}
          >
            Get Started
          </button>

          {/* Hamburger */}
          <button
            aria-label="Toggle menu"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'none',
              flexDirection: 'column',
              gap: 5,
              padding: 6,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            className="show-mobile-flex"
          >
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                display: 'block',
                width: 22,
                height: 2,
                background: 'var(--charcoal)',
                borderRadius: 2,
                transition: 'all 0.2s',
                transform: menuOpen && i === 0 ? 'rotate(45deg) translate(5px, 5px)'
                  : menuOpen && i === 2 ? 'rotate(-45deg) translate(5px, -5px)'
                    : menuOpen && i === 1 ? 'scaleX(0)'
                      : 'none',
              }} />
            ))}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          background: 'white',
          borderTop: '1px solid var(--border)',
          padding: 'var(--sp-4) var(--sp-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--sp-4)',
        }}>
          {NAV_LINKS.map(({ label, href }) => (
            <button key={label} onClick={() => scrollTo(href)} style={{
              background: 'none', border: 'none', textAlign: 'left',
              fontFamily: 'var(--font-body)', fontSize: 'var(--fs-base)',
              fontWeight: 500, color: 'var(--dark)', cursor: 'pointer',
            }}>
              {label}
            </button>
          ))}
          <button className="btn btn-outline" onClick={() => { setMenuOpen(false); onLogin?.(); }} style={{ marginBottom: 4 }}>
            Log In
          </button>
          <button className="btn btn-primary" onClick={() => { setMenuOpen(false); onGetStarted(); }}>
            Get Started
          </button>
        </div>
      )}

      {/* Mobile-only CSS */}
      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .show-mobile-flex { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile-flex { display: none !important; }
        }
      `}</style>
    </header>
  );
}
