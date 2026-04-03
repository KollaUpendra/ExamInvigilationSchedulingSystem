/**
 * @file src/components/HeroSection.jsx
 * Full-width hero — dark charcoal background (#111) with orange accent.
 * Inspired by the Redo template: bold headline, clean layout, orange CTA.
 */

import { useEffect, useRef } from 'react';

export default function HeroSection({ onGetStarted }) {
  const heroRef = useRef(null);

  useEffect(() => {
    /* Subtle parallax on mouse move */
    const hero = heroRef.current;
    if (!hero) return;
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 15;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      const blobs = hero.querySelectorAll('.hero-blob');
      blobs.forEach((b, i) => {
        const factor = (i + 1) * 0.4;
        b.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
      });
    };
    hero.addEventListener('mousemove', onMove);
    return () => hero.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <section
      id="hero"
      ref={heroRef}
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'var(--charcoal)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        paddingTop: 68,
      }}
    >
      {/* Background blobs */}
      <div className="hero-blob" style={{
        position: 'absolute', top: '10%', right: '8%',
        width: 420, height: 420, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,106,0,0.15) 0%, transparent 70%)',
        transition: 'transform 0.12s ease',
        pointerEvents: 'none',
      }} />
      <div className="hero-blob" style={{
        position: 'absolute', bottom: '15%', left: '5%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,106,0,0.09) 0%, transparent 70%)',
        transition: 'transform 0.18s ease',
        pointerEvents: 'none',
      }} />
      {/* Orange line accent */}
      <div style={{
        position: 'absolute', left: 0, top: '50%',
        width: 4, height: '35%', transform: 'translateY(-50%)',
        background: 'var(--orange)', borderRadius: '0 4px 4px 0',
        opacity: 0.7,
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1, padding: 'var(--sp-20) var(--sp-6)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--sp-16)',
          alignItems: 'center',
        }}>
          {/* Left: Text */}
          <div>
            {/* Badge */}
            <div className="badge-orange" style={{ marginBottom: 'var(--sp-6)' }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--orange)', display: 'inline-block'
              }} />
              AI-Powered Scheduling
            </div>

            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2.4rem, 5vw, 4.2rem)',
              fontWeight: 800,
              color: 'var(--white)',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: 'var(--sp-6)',
            }}>
              Automate Exam{' '}
              <span style={{ color: 'var(--orange)' }}>Invigilation</span>
              {' '}Scheduling Instantly
            </h1>

            <p style={{
              fontSize: 'var(--fs-lg)',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.75,
              marginBottom: 'var(--sp-8)',
              maxWidth: 480,
            }}>
              Eliminate manual assignment, scheduling conflicts, and unfair workload distribution — generate a complete, conflict-free Excel schedule in seconds.
            </p>

            {/* CTA Row */}
            <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap', marginBottom: 'var(--sp-10)' }}>
              <button className="btn btn-primary btn-lg" onClick={onGetStarted}>
                Get Early Access
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button
                className="btn btn-ghost btn-lg"
                onClick={() => document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                See How It Works
              </button>
            </div>

            {/* Trust Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sp-6)',
              flexWrap: 'wrap',
            }}>
              {[
                { num: '500+', label: 'Colleges' },
                { num: '50k+', label: 'Schedules' },
                { num: '98%', label: 'Accuracy' },
              ].map(({ num, label }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 800, color: 'var(--white)', fontFamily: 'var(--font-heading)' }}>{num}</div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Schedule Mockup */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ScheduleMockup />
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
        background: 'linear-gradient(to bottom, transparent, var(--charcoal))',
        pointerEvents: 'none',
      }} />

      <style>{`
        @media (max-width: 860px) {
          #hero > .container > div { grid-template-columns: 1fr !important; }
          #hero .schedule-mockup { display: none; }
        }
      `}</style>
    </section>
  );
}

function ScheduleMockup() {
  const teachers = [
    { name: 'Dr. Sharma', dept: 'CSE', slots: ['✓', '✓', '—', '✓', '—'] },
    { name: 'Prof. Reddy', dept: 'ECE', slots: ['—', '✓', '✓', '—', '✓'] },
    { name: 'Dr. Patel', dept: 'MECH', slots: ['✓', '—', '✓', '✓', '—'] },
    { name: 'Ms. Rao', dept: 'CIVIL', slots: ['—', '✓', '—', '✓', '✓'] },
  ];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  return (
    <div
      className="schedule-mockup"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: '24px',
        width: '100%',
        maxWidth: 440,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
        animation: 'floatCard 4s ease-in-out infinite',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Exam Schedule</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'white', fontSize: 14 }}>November 2024 — Mid Semester</div>
        </div>
        <div style={{
          background: 'var(--orange)', color: 'white', borderRadius: 6,
          padding: '4px 10px', fontSize: 11, fontWeight: 700,
        }}>XLSX ✓</div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ padding: '8px 10px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: 11, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Teacher</th>
              {days.map(d => (
                <th key={d} style={{ padding: '8px 6px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: 11, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teachers.map((t, i) => (
              <tr key={t.name}>
                <td style={{ padding: '9px 10px', borderBottom: i < teachers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: 12 }}>{t.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{t.dept}</div>
                </td>
                {t.slots.map((s, j) => (
                  <td key={j} style={{ padding: '9px 6px', textAlign: 'center', borderBottom: i < teachers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 24, height: 24, borderRadius: 4, fontSize: 12,
                      background: s === '✓' ? 'rgba(255,106,0,0.2)' : 'transparent',
                      color: s === '✓' ? 'var(--orange)' : 'rgba(255,255,255,0.2)',
                      fontWeight: 700,
                    }}>{s}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>4 invigilators · 0 conflicts</span>
        <span style={{ color: 'var(--orange)', fontWeight: 700, fontSize: 11 }}>✓ Generated in 0.8s</span>
      </div>
    </div>
  );
}
