/**
 * @file src/components/HowItWorks.jsx
 * Steps section — white background with numbered orange steps.
 * Redo template style: clean white section, step numbers in orange circles.
 */

const STEPS = [
  {
    num: '01',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
    title: 'Upload Teacher Timetables',
    desc: 'Import existing faculty schedules in Excel or CSV. The system reads current commitments automatically — no manual entry needed.',
  },
  {
    num: '02',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
      </svg>
    ),
    title: 'Configure Exam Slots',
    desc: 'Define exam dates, time slots, halls, and the number of invigilators required per session — all in one settings panel.',
  },
  {
    num: '03',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: 'AI Analyzes & Assigns',
    desc: 'The engine cross-references all timetables, applies fairness weightings, resolves conflicts, and fills every exam slot optimally.',
  },
  {
    num: '04',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    title: 'Export Ready-to-Use Excel',
    desc: 'Download a professionally formatted Excel file, ready to share with the exam branch — formatted, sorted, and auditable.',
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      style={{
        background: 'var(--white)',
        padding: 'var(--sp-24) 0',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 'var(--sp-16)' }}>
          <div className="section-eyebrow">How It Works</div>
          <h2 className="section-title" style={{ maxWidth: 540, marginBottom: 'var(--sp-4)' }}>
            From Upload to Schedule — in 4 Steps
          </h2>
          <div className="divider" />
          <p className="section-subtitle">
            No training required. Your first complete schedule can be generated in under 5 minutes.
          </p>
        </div>

        {/* Steps grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--sp-6)',
          position: 'relative',
        }}>
          {/* Connector line */}
          <div style={{
            position: 'absolute',
            top: 28,
            left: '12.5%',
            right: '12.5%',
            height: 1,
            background: 'linear-gradient(90deg, var(--orange), var(--border), var(--orange))',
            opacity: 0.4,
            pointerEvents: 'none',
          }} />

          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className={`reveal reveal-delay-${i + 1}`}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--sp-4)',
              }}
            >
              {/* Number bubble */}
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: i === 0 || i === 3 ? 'var(--orange)' : 'var(--white)',
                border: `2px solid ${i === 0 || i === 3 ? 'var(--orange)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: 'var(--fs-xl)',
                color: i === 0 || i === 3 ? 'white' : 'var(--orange)',
                boxShadow: i === 0 || i === 3 ? 'var(--shadow-orange)' : 'none',
                zIndex: 1,
                position: 'relative',
              }}>
                {step.num}
              </div>

              {/* Icon */}
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: 'var(--orange-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--orange)',
              }}>
                {step.icon}
              </div>

              <h3 style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: 'var(--fs-base)',
                color: 'var(--charcoal)',
                lineHeight: 1.3,
              }}>
                {step.title}
              </h3>
              <p style={{
                fontSize: 'var(--fs-sm)',
                color: 'var(--mid)',
                lineHeight: 1.7,
              }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          #how-it-works .container > div:last-child {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          #how-it-works .container > div:last-child > div:first-child::after {
            display: none;
          }
        }
        @media (max-width: 560px) {
          #how-it-works .container > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
