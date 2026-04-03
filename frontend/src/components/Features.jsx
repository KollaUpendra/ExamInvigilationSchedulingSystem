/**
 * @file src/components/Features.jsx
 * Orange-accented feature cards on a white background.
 * Redo template: clean grid, left orange border on hover, minimal icons.
 */

const FEATURES = [
    {
        color: 'var(--orange)',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
        title: 'Smart Conflict Detection',
        desc: 'Automatically flags and resolves scheduling conflicts before they appear in the final output. Every slot is validated.',
    },
    {
        color: '#7C3AED',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
        ),
        title: 'Workload Fairness',
        desc: 'Built-in weighting ensures no teacher is overburdened. Tracks cumulative duty count across the exam session.',
    },
    {
        color: '#0EA5E9',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),
        title: 'Flexible Slot Configuration',
        desc: 'Define any number of exam slots with custom time windows. Supports morning, afternoon, and multi-day seasons.',
    },
    {
        color: '#10B981',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
        ),
        title: 'Excel Export',
        desc: 'One-click export to formatted, print-ready Excel. Includes department-wise sheets and summary statistics.',
    },
    {
        color: '#F59E0B',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
        ),
        title: 'Instant Regeneration',
        desc: 'Changed an exam date? Added a new teacher? Regenerate the full schedule in under a second without losing settings.',
    },
    {
        color: '#EC4899',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
        title: 'Role-Based Access',
        desc: 'Separate logins for coordinators, HODs, and principals. Control who can view, edit, or approve the schedule.',
    },
];

export default function Features() {
    return (
        <section
            id="features"
            style={{
                background: 'var(--white)',
                padding: 'var(--sp-24) 0',
            }}
        >
            <div className="container">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--sp-12)', flexWrap: 'wrap', gap: 'var(--sp-6)' }}>
                    <div>
                        <div className="section-eyebrow">Features</div>
                        <h2 className="section-title">Everything You Need,<br />Nothing You Don't</h2>
                        <div className="divider" />
                    </div>
                    <p className="section-subtitle" style={{ maxWidth: 360 }}>
                        Built specifically for exam offices at colleges and universities in India.
                    </p>
                </div>

                {/* Feature Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 'var(--sp-5)',
                }}>
                    {FEATURES.map((f, i) => (
                        <FeatureCard key={f.title} feature={f} delay={i} />
                    ))}
                </div>
            </div>

            <style>{`
        @media (max-width: 900px) {
          #features .container > div:last-child { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 560px) {
          #features .container > div:last-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
        </section>
    );
}

function FeatureCard({ feature, delay }) {
    return (
        <div
            className={`card reveal reveal-delay-${(delay % 5) + 1}`}
            style={{
                padding: 'var(--sp-6)',
                borderLeft: `3px solid ${feature.color}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--sp-3)',
            }}
        >
            <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: `${feature.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: feature.color,
            }}>
                {feature.icon}
            </div>
            <h3 style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: 'var(--fs-base)',
                color: 'var(--charcoal)',
            }}>
                {feature.title}
            </h3>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--mid)', lineHeight: 1.7 }}>
                {feature.desc}
            </p>
        </div>
    );
}
