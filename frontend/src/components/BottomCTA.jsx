/**
 * @file src/components/BottomCTA.jsx
 * Full-width orange CTA section — inspired by the Redo template's solid-color CTA band.
 */

export default function BottomCTA({ onGetStarted }) {
  return (
    <section
      style={{
        background: 'var(--orange)',
        padding: 'var(--sp-20) 0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.08,
        backgroundImage: `repeating-linear-gradient(
          0deg, transparent, transparent 40px, rgba(255,255,255,0.5) 40px, rgba(255,255,255,0.5) 41px
        ), repeating-linear-gradient(
          90deg, transparent, transparent 40px, rgba(255,255,255,0.5) 40px, rgba(255,255,255,0.5) 41px
        )`,
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,0,0,0.12)', borderRadius: 100,
          padding: '4px 14px', marginBottom: 'var(--sp-5)',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Limited Early Access
          </span>
        </div>

        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(2rem, 4.5vw, 3.25rem)',
          fontWeight: 800,
          color: 'white',
          lineHeight: 1.15,
          letterSpacing: '-0.025em',
          marginBottom: 'var(--sp-4)',
        }}>
          Ready to Reclaim Your Time?
        </h2>

        <p style={{
          fontSize: 'var(--fs-lg)',
          color: 'rgba(255,255,255,0.8)',
          maxWidth: 520,
          margin: '0 auto var(--sp-8)',
          lineHeight: 1.7,
        }}>
          Join 500+ exam offices already running conflict-free schedules. Setup takes under 5 minutes.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap', marginBottom: 'var(--sp-12)' }}>
          <button className="btn btn-dark btn-lg" onClick={onGetStarted}>
            Get Early Access — Free
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          <button
            className="btn btn-ghost btn-lg"
            onClick={() => document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Learn More
          </button>
        </div>

        {/* Stats strip */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 'var(--sp-10)',
          flexWrap: 'wrap',
          paddingTop: 'var(--sp-8)',
          borderTop: '1px solid rgba(255,255,255,0.2)',
        }}>
          {[
            { icon: '🎓', stat: '500+', label: 'Colleges' },
            { icon: '⚡', stat: '< 1s', label: 'Generation Time' },
            { icon: '🔒', stat: '0', label: 'Conflicts Produced' },
            { icon: '📄', stat: 'Excel', label: 'Ready to Print' },
          ].map(({ icon, stat, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'var(--fs-xl)', color: 'white' }}>{stat}</div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
