/**
 * @file src/pages/Dashboard.jsx
 * Temporary post-login dashboard — placeholder until the real app is built.
 * Shows the logged-in user's name, avatar, and a "coming soon" panel.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ScheduleGenerator from '../components/ScheduleGenerator';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [schedules, setSchedules] = useState([]);
    const [stats, setStats] = useState({ schedulesCount: 0, latestTeachersCount: 0 });

    const fetchSchedules = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/schedule`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setSchedules(data.schedules);

                    const scheduledList = data.schedules || [];
                    const schedulesCount = scheduledList.length;
                    let latestTeachersCount = 0;
                    if (schedulesCount > 0) {
                        latestTeachersCount = scheduledList[0].teachersInvolved ? scheduledList[0].teachersInvolved.length : 0;
                    }

                    setStats({ schedulesCount, latestTeachersCount });
                }
            }
        } catch (error) {
            console.error("Failed to fetch schedules:", error);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, []);

    const cards = [
        { icon: '📅', label: 'Schedules', value: stats.schedulesCount > 0 ? stats.schedulesCount : '—', note: stats.schedulesCount > 0 ? 'Generated' : 'Coming soon' },
        { icon: '👩‍🏫', label: 'Teachers', value: stats.latestTeachersCount > 0 ? stats.latestTeachersCount : '—', note: stats.latestTeachersCount > 0 ? 'Recently Uploaded' : 'Coming soon' },
        { icon: '🏛️', label: 'Exam Slots', value: '—', note: 'Coming soon' },
        { icon: '📄', label: 'Excel Exports', value: stats.schedulesCount > 0 ? stats.schedulesCount : '—', note: stats.schedulesCount > 0 ? 'Exported files' : 'Coming soon' },
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--light-gray)', fontFamily: 'var(--font-body)' }}>

            {/* Top bar */}
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
                        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--mid)' }}>
                            {user?.email}
                        </span>
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

            {/* Main content */}
            <main style={{ padding: 'var(--sp-10) 0' }}>
                <div className="container">

                    {/* Welcome banner */}
                    <div style={{
                        background: 'var(--charcoal)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 16,
                        padding: 'var(--sp-8) var(--sp-8)',
                        marginBottom: 'var(--sp-8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 'var(--sp-4)',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        {/* Orange blob */}
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
                                fontFamily: 'var(--font-heading)',
                                fontWeight: 800,
                                fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                                color: 'white',
                                letterSpacing: '-0.025em',
                                marginBottom: 6,
                            }}>
                                Hello, {user?.name?.split(' ')[0] || 'there'} 👋
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'var(--fs-sm)' }}>
                                The scheduling dashboard is being built. Check back soon!
                            </p>
                        </div>
                        <div style={{
                            background: 'var(--orange)', color: 'white',
                            borderRadius: 100, padding: '8px 20px',
                            fontFamily: 'var(--font-heading)', fontWeight: 700,
                            fontSize: 'var(--fs-sm)', whiteSpace: 'nowrap',
                            position: 'relative', zIndex: 1,
                        }}>
                            🚀 In Development
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 'var(--sp-4)',
                        marginBottom: 'var(--sp-8)',
                    }}>
                        {cards.map(({ icon, label, value, note }) => {
                            const isClickable = (label === 'Schedules' || label === 'Excel Exports') && stats.schedulesCount > 0;
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
                                            document.getElementById('recent-schedules')?.scrollIntoView({ behavior: 'smooth' });
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

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 'var(--sp-5)' }}>
                        <ScheduleGenerator onScheduleGenerated={fetchSchedules} />
                        <PlaceholderPanel title="Quick Actions" icon="⚡" />
                    </div>

                    {/* History Section */}
                    {schedules.length > 0 && (
                        <div id="recent-schedules" style={{ marginTop: 'var(--sp-8)' }}>
                            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'var(--fs-lg)', color: 'var(--charcoal)', marginBottom: 'var(--sp-4)' }}>
                                Recent Schedules
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                                {schedules.slice(0, 5).map((sched, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        background: 'var(--white)', padding: '10px 14px', borderRadius: 8,
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)', border: '1px solid var(--border)',
                                        gap: 'var(--sp-3)', overflowX: 'auto'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                                            {/* Input File (Orange Button) */}
                                            <a
                                                href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/schedule/${sched._id}/download?type=input`}
                                                title="Download Input Timetable"
                                                style={{
                                                    background: '#D9774B', color: 'white', padding: '4px 12px', borderRadius: 6,
                                                    fontSize: 12, fontWeight: 700, textDecoration: 'none',
                                                    whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                                }}
                                            >
                                                {sched.inputFileData?.filename || 'Teacher_Timetables.xlsx'}
                                            </a>

                                            {/* Teachers Involved (Green Badge) */}
                                            <div style={{
                                                background: '#2F8A4F', color: 'white', padding: '4px 12px', borderRadius: 6,
                                                fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                            }}>
                                                👤 {sched.teachersInvolved?.length || 0}
                                            </div>

                                            {/* Slots (Green Badge) */}
                                            <div style={{
                                                background: '#2F8A4F', color: 'white', padding: '4px 12px', borderRadius: 6,
                                                fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                            }}>
                                                📅 {sched.examSlots?.length || 0} Slots
                                            </div>

                                            {/* Date (Green Badge) */}
                                            <div style={{
                                                background: '#2F8A4F', color: 'white', padding: '4px 12px', borderRadius: 6,
                                                fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                            }}>
                                                � {new Date(sched.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {/* Output File (Gray Button) */}
                                        <a
                                            href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/schedule/${sched._id}/download`}
                                            title="Download Generated Schedule"
                                            style={{
                                                background: '#E5E7EB', color: '#374151', padding: '4px 12px', borderRadius: 6,
                                                fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
                                                display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #D1D5DB'
                                            }}
                                        >
                                            invigilation_schedule.xlsx
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <style>{`
        @media (max-width: 768px) {
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

function PlaceholderPanel({ title, icon }) {
    return (
        <div className="card" style={{ padding: 'var(--sp-6)', minHeight: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'var(--fs-base)', color: 'var(--charcoal)' }}>
                    {title}
                </h3>
            </div>
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: 'var(--sp-10) 0', gap: 'var(--sp-3)',
                borderTop: '1px solid var(--border)',
            }}>
                <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: 'var(--orange-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 4,
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', textAlign: 'center' }}>
                    This section is under development.<br />Check back soon!
                </p>
            </div>
        </div>
    );
}
