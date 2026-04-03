/**
 * @file src/components/ProblemSolution.jsx
 * Light gray background section — clean comparison layout.
 * Redo template style: white cards on #F2F2F2 background, orange highlights.
 */

export default function ProblemSolution() {
  const oldWay = [
    'Manual spreadsheet assignment takes hours',
    'Teacher conflicts & double-bookings happen constantly',
    'Unfair workload distribution causes friction',
    'No audit trail — errors go unnoticed',
    'Revision requests take days to process',
  ];

  const newWay = [
    'Auto-assigns based on availability & timetable',
    'Conflict detection built in — zero double-bookings',
    'Fair, weighted distribution across all staff',
    'Full audit log with timestamps & approvals',
    'Instant regeneration on any change',
  ];

  return (
    <section
      id="benefits"
      style={{
        background: 'var(--light-gray)',
        padding: 'var(--sp-24) 0',
      }}
    >
      <div className="container">
        {/* Header */}
        <div className="text-center" style={{ marginBottom: 'var(--sp-16)' }}>
          <div className="section-eyebrow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--orange)">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            The Difference
          </div>
          <h2 className="section-title" style={{ marginBottom: 'var(--sp-4)' }}>
            Stop Doing It the Hard Way
          </h2>
          <div className="divider divider-center" />
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            See what changes when your exam office switches from manual spreadsheets to automated scheduling.
          </p>
        </div>

        {/* Two Column Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 'var(--sp-6)',
          alignItems: 'start',
        }}>
          {/* Old Way */}
          <div className="card reveal" style={{ padding: 'var(--sp-8)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
              marginBottom: 'var(--sp-6)',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                background: '#FEE2E2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E53E3E" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'var(--fs-base)', color: 'var(--charcoal)' }}>The Old Way</div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>Manual process</div>
              </div>
            </div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {oldWay.map((item) => (
                <li key={item} style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
                  <span style={{
                    flexShrink: 0,
                    width: 20, height: 20, borderRadius: '50%',
                    background: '#FEE2E2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: 2,
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#E53E3E" strokeWidth="3">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </span>
                  <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--mid)', lineHeight: 1.6 }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* VS Badge */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 80,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--orange)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontFamily: 'var(--font-heading)',
              fontWeight: 800, fontSize: 'var(--fs-sm)',
              boxShadow: 'var(--shadow-orange)',
            }}>VS</div>
          </div>

          {/* New Way */}
          <div className="card reveal reveal-delay-2" style={{
            padding: 'var(--sp-8)',
            borderColor: 'var(--orange)',
            boxShadow: 'var(--shadow-orange)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
              marginBottom: 'var(--sp-6)',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                background: 'var(--orange-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22,4 12,14.01 9,11.01" />
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'var(--fs-base)', color: 'var(--charcoal)' }}>ExamSched Way</div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--orange)', fontWeight: 600, marginTop: 2 }}>Automated & smart</div>
              </div>
            </div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {newWay.map((item) => (
                <li key={item} style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
                  <span style={{
                    flexShrink: 0,
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'var(--orange-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: 2,
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="3">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  </span>
                  <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--dark)', lineHeight: 1.6 }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #benefits .container > div:last-child {
            grid-template-columns: 1fr !important;
          }
          #benefits .container > div:last-child > div:nth-child(2) {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
