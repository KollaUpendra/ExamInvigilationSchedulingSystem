/**
 * @file src/pages/Dashboard.jsx
 * Post-login dashboard — schedule generator + history.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import ScheduleGenerator from '../components/ScheduleGenerator';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [schedules, setSchedules] = useState([]);
    const [statsLoading, setStatsLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [deleteLoadingId, setDeleteLoadingId] = useState(null);
    const [deleteError, setDeleteError] = useState('');

    // ── Derived stats ─────────────────────────────────────────────────────────
    const schedulesCount = schedules.length;
    const latestTeachersCount = schedules[0]?.teachersInvolved?.length ?? 0;
    const latestExamSlots = schedules[0]?.examSlots?.length ?? 0;

    // ── Fetch history ─────────────────────────────────────────────────────────
    const fetchSchedules = useCallback(async () => {
        setFetchError('');
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10_000);
            let res;
            try {
                res = await fetch(`${API}/api/schedule`, { signal: controller.signal });
            } finally {
                clearTimeout(timeoutId);
            }
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            const data = await res.json();
            if (data.success) setSchedules(data.schedules || []);
        } catch (err) {
            const msg = err.name === 'AbortError'
                ? 'Request timed out. Is the server running?'
                : 'Could not load schedule history. Is the server running?';
            setFetchError(msg);
            console.error('fetchSchedules:', err);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        setDeleteLoadingId(id);
        setDeletingId(null);
        setDeleteError('');
        try {
            const res = await fetch(`${API}/api/schedule/${id}`, { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                await fetchSchedules(); // re-fetch so all counters update correctly
            } else {
                setDeleteError(data.message || 'Delete failed. Please try again.');
            }
        } catch (err) {
            setDeleteError('Network error. Could not delete schedule.');
            console.error('Delete failed:', err);
        } finally {
            setDeleteLoadingId(null);
        }
    };

    // ── Stat cards ────────────────────────────────────────────────────────────
    const cards = [
        {
            icon: '📅',
            label: 'Schedules',
            value: statsLoading ? '…' : (schedulesCount > 0 ? schedulesCount : '—'),
            note: schedulesCount > 0 ? 'Generated' : 'None yet',
            scrollTo: 'recent-schedules',
        },
        {
            icon: '👩‍🏫',
            label: 'Teachers',
            value: statsLoading ? '…' : (latestTeachersCount > 0 ? latestTeachersCount : '—'),
            note: latestTeachersCount > 0 ? 'In latest run' : 'None yet',
        },
        {
            icon: '🏛️',
            label: 'Exam Slots',
            value: statsLoading ? '…' : (latestExamSlots > 0 ? latestExamSlots : '—'),
            note: latestExamSlots > 0 ? 'In latest run' : 'None yet',
        },
        {
            icon: '📄',
            label: 'Excel Exports',
            value: statsLoading ? '…' : (schedulesCount > 0 ? schedulesCount : '—'),
            note: schedulesCount > 0 ? 'Downloaded files' : 'None yet',
            scrollTo: 'recent-schedules',
        },
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--light-gray)', fontFamily: 'var(--font-body)' }}>

            {/* ── Header ────────────────────────────────────────────────────── */}
            <header style={{
                background: 'var(--white)',
                borderBottom: '1px solid var(--border)',
                position: 'sticky', top: 0, zIndex: 100,
                boxShadow: 'var(--shadow-xs)',
            }}>
                <div className="container" style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', height: 64,
                }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 6,
                            background: 'var(--orange)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="3" width="7" height="7" rx="1" fill="white" />
                                <rect x="14" y="3" width="7" height="7" rx="1" fill="white" opacity="0.6" />
                                <rect x="3" y="14" width="7" height="7" rx="1" fill="white" opacity="0.6" />
                                <rect x="14" y="14" width="7" height="7" rx="1" fill="white" />
                            </svg>
                        </div>
                        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1rem', color: 'var(--charcoal)', letterSpacing: '-0.03em' }}>
                            Exam<span style={{ color: 'var(--orange)' }}>Sched</span>
                        </span>
                    </div>

                    {/* User menu */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--mid)' }}>{user?.email}</span>
                        {user?.picture ? (
                            <img
                                src={user.picture}
                                alt={user.name}
                                referrerPolicy="no-referrer"
                                style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--border)' }}
                            />
                        ) : (
                            <div style={{
                                width: 36, height: 36, borderRadius: '50%',
                                background: 'var(--orange)', color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 14,
                            }}>
                                {user?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                        <button
                            className="btn btn-outline btn-sm"
                            onClick={logout}
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Main content ──────────────────────────────────────────────── */}
            <main style={{ padding: 'var(--sp-10) 0' }}>
                <div className="container">

                    {/* Welcome banner */}
                    <div style={{
                        background: 'var(--charcoal)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 16,
                        padding: 'var(--sp-8)',
                        marginBottom: 'var(--sp-8)',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap', gap: 'var(--sp-4)',
                        position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'absolute', right: -60, top: -60,
                            width: 240, height: 240, borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(255,106,0,0.18) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }} />
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                                Welcome back
                            </div>
                            <h1 style={{
                                fontFamily: 'var(--font-heading)', fontWeight: 800,
                                fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                                color: 'white', letterSpacing: '-0.025em', marginBottom: 6,
                            }}>
                                Hello, {user?.name?.split(' ')[0] || 'there'} 👋
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'var(--fs-sm)' }}>
                                {schedulesCount > 0
                                    ? `You have generated ${schedulesCount} schedule${schedulesCount !== 1 ? 's' : ''}.`
                                    : 'Generate your first invigilation schedule below.'}
                            </p>
                        </div>
                        {/* Dynamic chip instead of "In Development" */}
                        {schedulesCount > 0 ? (
                            <div style={{
                                background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)',
                                borderRadius: 100, padding: '8px 20px',
                                fontFamily: 'var(--font-heading)', fontWeight: 700,
                                fontSize: 'var(--fs-sm)', whiteSpace: 'nowrap',
                                border: '1px solid rgba(255,255,255,0.12)',
                                position: 'relative', zIndex: 1,
                            }}>
                                🗓 Last: {new Date(schedules[0].createdAt).toLocaleDateString()}
                            </div>
                        ) : (
                            <div style={{
                                background: 'var(--orange)', color: 'white',
                                borderRadius: 100, padding: '8px 20px',
                                fontFamily: 'var(--font-heading)', fontWeight: 700,
                                fontSize: 'var(--fs-sm)', whiteSpace: 'nowrap',
                                position: 'relative', zIndex: 1,
                            }}>
                                ✨ Get started below
                            </div>
                        )}
                    </div>

                    {/* Stat cards */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 'var(--sp-4)', marginBottom: 'var(--sp-8)',
                    }}>
                        {cards.map(({ icon, label, value, note, scrollTo }) => {
                            const isClickable = !!scrollTo && schedulesCount > 0;
                            return (
                                <div
                                    key={label}
                                    className="card"
                                    style={{
                                        padding: 'var(--sp-5)',
                                        cursor: isClickable ? 'pointer' : 'default',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                    }}
                                    onClick={() => {
                                        if (isClickable) {
                                            document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth' });
                                        }
                                    }}
                                    onMouseEnter={(e) => { if (isClickable) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                    onMouseLeave={(e) => { if (isClickable) e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    <div style={{ fontSize: 24, marginBottom: 'var(--sp-3)' }}>{icon}</div>
                                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'var(--fs-2xl)', color: 'var(--charcoal)', marginBottom: 2 }}>{value}</div>
                                    <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)', color: 'var(--dark)', marginBottom: 2 }}>{label}</div>
                                    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{note}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Generator + Quick Actions row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 'var(--sp-5)' }}>
                        <ScheduleGenerator onScheduleGenerated={fetchSchedules} />
                        <QuickActionsPanel />
                    </div>

                    {/* Fetch error */}
                    {fetchError && (
                        <div style={{
                            marginTop: 'var(--sp-6)',
                            padding: '12px 16px',
                            background: '#FFF5F5', border: '1px solid #FED7D7',
                            borderRadius: 8, color: 'var(--error)', fontSize: 'var(--fs-sm)', fontWeight: 600,
                        }}>
                            ⚠️ {fetchError}
                        </div>
                    )}

                    {/* Delete error */}
                    {deleteError && (
                        <div style={{
                            marginTop: 'var(--sp-4)',
                            padding: '10px 14px',
                            background: '#FFF5F5', border: '1px solid #FED7D7',
                            borderRadius: 8, color: 'var(--error)', fontSize: 'var(--fs-sm)', fontWeight: 600,
                        }}>
                            ❌ {deleteError}
                        </div>
                    )}

                    {/* ── History section ────────────────────────────────────── */}
                    <div id="recent-schedules" style={{ marginTop: 'var(--sp-8)' }}>
                        <h3 style={{
                            fontFamily: 'var(--font-heading)', fontWeight: 800,
                            fontSize: 'var(--fs-lg)', color: 'var(--charcoal)', marginBottom: 'var(--sp-4)',
                        }}>
                            Recent Schedules
                        </h3>

                        {statsLoading ? (
                            /* Loading skeleton */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                                {[1, 2, 3].map((i) => (
                                    <div key={i} style={{
                                        height: 48, borderRadius: 8,
                                        background: 'var(--border)',
                                        animation: 'pulse 1.4s ease-in-out infinite',
                                    }} />
                                ))}
                            </div>
                        ) : schedules.length === 0 ? (
                            /* Empty state */
                            <div style={{
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                padding: 'var(--sp-12) var(--sp-8)',
                                background: 'var(--white)',
                                border: '1px dashed var(--border)',
                                borderRadius: 12, textAlign: 'center', gap: 'var(--sp-3)',
                            }}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: 14,
                                    background: 'var(--orange-light)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 26,
                                }}>
                                    📭
                                </div>
                                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'var(--fs-lg)', color: 'var(--charcoal)' }}>
                                    No schedules yet
                                </div>
                                <p style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)', maxWidth: 340 }}>
                                    Upload a teacher timetable and configure exam slots above to generate your first invigilation roster.
                                </p>
                            </div>
                        ) : (
                            /* Schedule rows */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                                {schedules.slice(0, 10).map((sched) => (
                                    <div key={sched._id} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        background: 'var(--white)', padding: '10px 14px', borderRadius: 8,
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)', border: '1px solid var(--border)',
                                        gap: 'var(--sp-3)', overflowX: 'auto',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flex: 1, minWidth: 0 }}>
                                            {/* Input file download */}
                                            <a
                                                href={`${API}/api/schedule/${sched._id}/download?type=input`}
                                                title="Download Input Timetable"
                                                style={{
                                                    background: '#D9774B', color: 'white', padding: '4px 12px', borderRadius: 6,
                                                    fontSize: 12, fontWeight: 700, textDecoration: 'none',
                                                    whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                                }}
                                            >
                                                📥 {sched.inputFileData?.filename || 'Teacher_Timetables.xlsx'}
                                            </a>

                                            <Badge icon="👤" label={`${sched.teachersInvolved?.length ?? 0} teachers`} />
                                            <Badge icon="📅" label={`${sched.examSlots?.length ?? 0} slots`} />
                                            <Badge icon="🗓" label={new Date(sched.createdAt).toLocaleDateString()} />
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                            {/* Output file download */}
                                            <a
                                                href={`${API}/api/schedule/${sched._id}/download`}
                                                title="Download Generated Schedule"
                                                style={{
                                                    background: '#E5E7EB', color: '#374151', padding: '4px 12px', borderRadius: 6,
                                                    fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
                                                    display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #D1D5DB',
                                                }}
                                            >
                                                ⬇️ invigilation_schedule.xlsx
                                            </a>

                                            {/* Delete confirmation inline */}
                                            {deletingId === sched._id ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600, whiteSpace: 'nowrap' }}>Delete?</span>
                                                    <button
                                                        onClick={() => handleDelete(sched._id)}
                                                        style={{
                                                            background: '#DC2626', color: 'white', border: 'none',
                                                            borderRadius: 6, padding: '4px 10px', fontSize: 12,
                                                            fontWeight: 700, cursor: 'pointer',
                                                        }}
                                                    >Yes</button>
                                                    <button
                                                        onClick={() => setDeletingId(null)}
                                                        style={{
                                                            background: '#E5E7EB', color: '#374151', border: '1px solid #D1D5DB',
                                                            borderRadius: 6, padding: '4px 10px', fontSize: 12,
                                                            fontWeight: 700, cursor: 'pointer',
                                                        }}
                                                    >No</button>
                                                </div>
                                            ) : deleteLoadingId === sched._id ? (
                                                <span style={{ fontSize: 12, color: '#9CA3AF' }}>Deleting…</span>
                                            ) : (
                                                <button
                                                    onClick={() => setDeletingId(sched._id)}
                                                    title="Delete this schedule"
                                                    style={{
                                                        background: 'none', border: '1px solid #FCA5A5',
                                                        borderRadius: 6, padding: '4px 8px',
                                                        cursor: 'pointer', color: '#DC2626',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        transition: 'background 0.15s',
                                                    }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.background = '#FEE2E2')}
                                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                                >
                                                    🗑
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.45; }
                }
                @media (max-width: 900px) {
                    main .container > div:nth-child(2) { grid-template-columns: repeat(2,1fr) !important; }
                    main .container > div:nth-child(3) { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 480px) {
                    main .container > div:nth-child(2) { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    );
}

/** Small green info badge used in schedule history rows. */
function Badge({ icon, label }) {
    return (
        <div style={{
            background: '#2F8A4F', color: 'white', padding: '4px 12px', borderRadius: 6,
            fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}>
            {icon} {label}
        </div>
    );
}

/** Quick-Actions placeholder panel. */
function QuickActionsPanel() {
    const shortcuts = [
        { icon: '📋', title: 'Export All History', desc: 'Download a combined report of all past schedules.' },
        { icon: '⚙️', title: 'Configure Periods', desc: 'Customise the teaching period time windows.' },
        { icon: '📨', title: 'Email Roster', desc: 'Send the invigilation roster directly to teachers.' },
    ];

    return (
        <div className="card" style={{ padding: 'var(--sp-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
                <span style={{ fontSize: 20 }}>⚡</span>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'var(--fs-base)', color: 'var(--charcoal)' }}>
                    Quick Actions
                </h3>
                <span style={{
                    marginLeft: 'auto', background: 'var(--orange-light)', color: 'var(--orange-dark)',
                    borderRadius: 100, fontSize: 11, fontWeight: 700, padding: '2px 10px',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                    Coming soon
                </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', borderTop: '1px solid var(--border)', paddingTop: 'var(--sp-4)' }}>
                {shortcuts.map(({ icon, title, desc }) => (
                    <div key={title} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)',
                        padding: 'var(--sp-3)', borderRadius: 8, border: '1px solid var(--border)',
                        background: 'var(--light-gray)', opacity: 0.7,
                    }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 8,
                            background: 'var(--orange-light)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 16, flexShrink: 0,
                        }}>
                            {icon}
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)', color: 'var(--dark)', marginBottom: 2 }}>{title}</div>
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{desc}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
