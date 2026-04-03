/**
 * @file src/components/Footer.jsx
 * Dark charcoal footer — Redo brand template style: minimal, clean, 3-col layout.
 */

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: 'var(--charcoal)', color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-body)' }}>
      <div className="container" style={{ padding: 'var(--sp-16) var(--sp-6)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: 'var(--sp-10)',
          marginBottom: 'var(--sp-10)',
        }}>
          {/* Brand col */}
          <div>
            <a href="#hero" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 'var(--sp-4)', textDecoration: 'none' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 6, background: 'var(--orange)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="7" height="7" rx="1" fill="white" />
                  <rect x="14" y="3" width="7" height="7" rx="1" fill="white" opacity="0.6" />
                  <rect x="3" y="14" width="7" height="7" rx="1" fill="white" opacity="0.6" />
                  <rect x="14" y="14" width="7" height="7" rx="1" fill="white" />
                </svg>
              </div>
              <span style={{
                fontFamily: 'var(--font-heading)', fontWeight: 800,
                fontSize: '1rem', color: 'white', letterSpacing: '-0.03em',
              }}>
                Exam<span style={{ color: 'var(--orange)' }}>Sched</span>
              </span>
            </a>
            <p style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.75, maxWidth: 240 }}>
              Automated exam invigilation scheduling for colleges and universities. Fair, fast, conflict-free.
            </p>
          </div>

          {/* Product */}
          <FooterCol title="Product" links={[
            { label: 'Features', href: '#features' },
            { label: 'How It Works', href: '#how-it-works' },
            { label: 'Pricing', href: '#' },
            { label: 'Changelog', href: '#' },
          ]} />

          {/* Resources */}
          <FooterCol title="Resources" links={[
            { label: 'Documentation', href: '#' },
            { label: 'API Reference', href: '#' },
            { label: 'Support', href: '#' },
            { label: 'Blog', href: '#' },
          ]} />

          {/* Legal */}
          <FooterCol title="Company" links={[
            { label: 'About', href: '#' },
            { label: 'Privacy Policy', href: '#' },
            { label: 'Terms of Use', href: '#' },
            { label: 'Contact', href: '#' },
          ]} />
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: 'var(--sp-6)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 'var(--sp-3)',
        }}>
          <span style={{ fontSize: 'var(--fs-sm)' }}>© {year} ExamSched. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 'var(--sp-4)' }}>
            {['Twitter', 'LinkedIn', 'GitHub'].map(s => (
              <a key={s} href="#" style={{
                fontSize: 'var(--fs-sm)', color: 'rgba(255,255,255,0.4)',
                transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.target.style.color = 'var(--orange)'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
              >{s}</a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          footer .container > div:first-child {
            grid-template-columns: 1fr 1fr !important;
          }
          footer .container > div:first-child > div:first-child {
            grid-column: 1 / -1 !important;
          }
        }
      `}</style>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontWeight: 700, fontSize: 'var(--fs-sm)',
        color: 'white', marginBottom: 'var(--sp-4)',
        letterSpacing: '0.01em',
      }}>{title}</div>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        {links.map(({ label, href }) => (
          <li key={label}>
            <a href={href} style={{
              fontSize: 'var(--fs-sm)',
              color: 'rgba(255,255,255,0.45)',
              transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.target.style.color = 'var(--orange)'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.45)'}
            >{label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
