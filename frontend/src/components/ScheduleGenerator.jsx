import React, { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ScheduleGenerator({ onScheduleGenerated }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);       // 0–100 for animated bar
    const [message, setMessage] = useState('');
    const [downloadId, setDownloadId] = useState(null);
    const [summary, setSummary] = useState(null);
    const [warningsOpen, setWarningsOpen] = useState(false);
    const [fileInputKey, setFileInputKey] = useState(0); // increment to force remount

    // ── Date state ────────────────────────────────────────────────────────────
    const [dates, setDates] = useState(['']);

    // ── Daily slot state ──────────────────────────────────────────────────────
    const defaultDailySlot = { slot: 'Slot1', start: '', end: '', year: 1, teachers_required: 1 };
    const [dailySlots, setDailySlots] = useState([{ ...defaultDailySlot }]);

    // ── Date helpers ──────────────────────────────────────────────────────────
    const addDate = () => setDates([...dates, '']);
    const removeDate = (i) => setDates(dates.filter((_, idx) => idx !== i));
    const handleDateChange = (i, v) => {
        const next = [...dates];
        next[i] = v;
        setDates(next);
    };

    // ── Slot helpers ──────────────────────────────────────────────────────────
    const addDailySlot = () => {
        if (dailySlots.length < 3) {
            setDailySlots([...dailySlots, { ...defaultDailySlot, slot: `Slot${dailySlots.length + 1}` }]);
        }
    };
    const removeDailySlot = (i) => setDailySlots(dailySlots.filter((_, idx) => idx !== i));
    const handleDailySlotChange = (i, field, value) => {
        const next = [...dailySlots];
        next[i] = { ...next[i], [field]: value };
        setDailySlots(next);
    };

    // ── Date utilities ────────────────────────────────────────────────────────
    const getDayName = (dateStr) => {
        if (!dateStr) return '';
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        // Append 'T00:00' (no Z) so the browser parses the date in LOCAL time
        // instead of UTC. Without this, 'YYYY-MM-DD' is treated as UTC midnight,
        // which shifts the day backwards by 1 in UTC+ timezones (e.g. IST = UTC+5:30).
        return days[new Date(dateStr + 'T00:00').getDay()] || '';
    };

    /** Converts "YYYY-MM-DD" → "D/M/YY" for the backend. */
    const formatToBackendDate = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${parseInt(day)}/${parseInt(month)}/${year.substring(2)}`;
    };

    /**
     * Simulate a staggered progress bar while the real fetch is in flight.
     * - Quickly advances to 60% in the first 2 s.
     * - Slows to 90% over the next 5 s.
     * - Stays at 90% until the response arrives, then jumps to 100%.
     */
    const startProgressAnimation = () => {
        setProgress(0);
        let pct = 0;
        const interval = setInterval(() => {
            pct += pct < 60 ? 4 : pct < 90 ? 0.8 : 0;
            if (pct > 90) pct = 90;
            setProgress(Math.round(pct));
        }, 120);
        return interval;
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setSummary(null);
        setDownloadId(null);
        setWarningsOpen(false);

        // ── Client-side validation ────────────────────────────────────────────
        if (!file) {
            setMessage('Please upload a timetable Excel file.');
            return;
        }

        const validDates = dates.filter((d) => d.trim() !== '');
        if (validDates.length === 0) {
            setMessage('Please select at least one exam date.');
            return;
        }

        if (new Set(validDates).size !== validDates.length) {
            setMessage('Duplicate dates found. Please ensure all exam dates are unique.');
            return;
        }

        for (const s of dailySlots) {
            if (!s.slot?.trim() || !s.start || !s.end || !s.year || !s.teachers_required) {
                setMessage('Please fill in all fields for each daily slot.');
                return;
            }
            if (s.start >= s.end) {
                setMessage(`Slot "${s.slot}": start time must be before end time.`);
                return;
            }
        }

        // ── Build examSlots payload ───────────────────────────────────────────
        const generatedSlots = [];
        for (const dateStr of validDates) {
            const formattedDate = formatToBackendDate(dateStr);
            const dayName = getDayName(dateStr);
            for (const slot of dailySlots) {
                generatedSlots.push({
                    date: formattedDate,
                    day: dayName,
                    slot: slot.slot,
                    start: slot.start,
                    end: slot.end,
                    year: Number(slot.year),
                    teachers_required: Number(slot.teachers_required),
                });
            }
        }

        setLoading(true);
        const progressInterval = startProgressAnimation();

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('examSlots', JSON.stringify(generatedSlots));

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30_000);

            let response;
            try {
                response = await fetch(`${API}/api/schedule/generate`, {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal,
                });
            } finally {
                clearTimeout(timeoutId);
            }

            clearInterval(progressInterval);
            setProgress(100);

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    (response.status === 429 ? 'Too many requests — please wait a moment.' : 'Failed to generate schedule.')
                );
            }

            setSummary(data.summary);
            setDownloadId(data.downloadId);
            setMessage('');

            // Reset form
            setFile(null);
            setFileInputKey((k) => k + 1);
            setDates(['']);
            setDailySlots([{ ...defaultDailySlot }]);

            if (onScheduleGenerated) onScheduleGenerated();

        } catch (error) {
            clearInterval(progressInterval);
            setProgress(0);
            console.error('Submit error:', error);
            const msg = error.name === 'AbortError'
                ? 'Request timed out (30 s). Check your connection and try again.'
                : error.message;
            setMessage(`❌ ${msg}`);
        } finally {
            // Let the 100% bar linger briefly before hiding
            setTimeout(() => {
                setLoading(false);
                setProgress(0);
            }, 600);
        }
    };

    // ── Download URL ──────────────────────────────────────────────────────────
    const getDownloadHref = () =>
        downloadId ? `${API}/api/schedule/${downloadId}/download` : '#';

    const hasUnderstaffed = summary?.understaffedSlots?.length > 0;
    const hasWarnings = summary?.warnings?.length > 0;
    const canSubmit = !loading && !!file && dates.some((d) => d.trim());

    return (
        <div className="card" style={{ padding: 'var(--sp-6)', position: 'relative', overflow: 'hidden' }}>

            {/* ── Progress bar overlay ──────────────────────────────────────── */}
            {loading && (
                <div style={{
                    position: 'absolute', inset: 0, backdropFilter: 'blur(2px)',
                    background: 'rgba(255,255,255,0.7)', zIndex: 10,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 16,
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: 32, marginBottom: 8,
                            animation: 'spin 1.2s linear infinite',
                            display: 'inline-block',
                        }}>
                            ⚙️
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-heading)', fontWeight: 700,
                            fontSize: 'var(--fs-lg)', color: 'var(--charcoal)', marginBottom: 4,
                        }}>
                            Generating schedule…
                        </div>
                        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)' }}>
                            Running conflict analysis and load balancing
                        </div>
                    </div>
                    {/* Progress bar */}
                    <div style={{ width: 260, background: 'var(--border)', borderRadius: 100, height: 8 }}>
                        <div style={{
                            height: '100%', borderRadius: 100,
                            background: 'linear-gradient(90deg, var(--orange), #FF9A3D)',
                            width: `${progress}%`,
                            transition: 'width 0.12s linear',
                        }} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{progress}%</div>
                </div>
            )}

            {/* ── Card header ───────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
                <span style={{ fontSize: 24 }}>📅</span>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'var(--fs-lg)', color: 'var(--charcoal)' }}>
                    Schedule Generator
                </h3>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>

                {/* ── File upload ────────────────────────────────────────────── */}
                <div style={{ background: 'var(--light-gray)', padding: 'var(--sp-4)', borderRadius: 12, border: '1px dashed var(--border)' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: 'var(--fs-sm)', marginBottom: 8, color: 'var(--dark)' }}>
                        Teacher Timetables (.xlsx)
                    </label>
                    <input
                        key={fileInputKey}
                        id="timetable-file-input"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => {
                            setFile(e.target.files[0] || null);
                            // Clear previous results when a new file is picked
                            setSummary(null);
                            setDownloadId(null);
                            setMessage('');
                        }}
                        style={{ fontSize: 'var(--fs-sm)' }}
                    />
                    {file && (
                        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--muted)' }}>
                            ✅ {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </div>
                    )}
                </div>

                {/* ── Exam Dates ─────────────────────────────────────────────── */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
                        <label style={{ fontWeight: 600, fontSize: 'var(--fs-sm)', color: 'var(--dark)' }}>
                            Exam Dates
                        </label>
                        <button type="button" onClick={addDate} className="btn btn-outline btn-sm" style={{ padding: '4px 12px', fontSize: 12 }}>
                            + Add Date
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
                        {dates.map((date, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                background: 'var(--light-gray)', padding: '6px 12px',
                                borderRadius: 8, border: '1px solid var(--border)',
                            }}>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => handleDateChange(i, e.target.value)}
                                    style={{ border: 'none', background: 'transparent', padding: 0, fontSize: 13, height: 'auto' }}
                                />
                                {date && (
                                    <span style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                                        {getDayName(date)}
                                    </span>
                                )}
                                {dates.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeDate(i)}
                                        style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center' }}
                                    >
                                        &times;
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Daily Slots ────────────────────────────────────────────── */}
                <div style={{ paddingTop: 'var(--sp-5)', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
                        <label style={{ fontWeight: 600, fontSize: 'var(--fs-sm)', color: 'var(--dark)' }}>
                            Daily Slots <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(max 3 per day)</span>
                        </label>
                        {dailySlots.length < 3 && (
                            <button type="button" onClick={addDailySlot} className="btn btn-outline btn-sm" style={{ padding: '4px 12px', fontSize: 12 }}>
                                + Add Slot
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                        {dailySlots.map((slot, i) => (
                            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 'var(--sp-4)', position: 'relative' }}>
                                {dailySlots.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeDailySlot(i)}
                                        style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: 18 }}
                                    >
                                        &times;
                                    </button>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 'var(--sp-3)' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Slot Name</label>
                                        <input
                                            className="form-input"
                                            style={{ padding: '8px 12px', fontSize: 13 }}
                                            type="text"
                                            value={slot.slot}
                                            onChange={(e) => handleDailySlotChange(i, 'slot', e.target.value)}
                                            placeholder="e.g. Slot1"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Start</label>
                                        <input
                                            className="form-input"
                                            style={{ padding: '8px 12px', fontSize: 13 }}
                                            type="time"
                                            value={slot.start}
                                            onChange={(e) => handleDailySlotChange(i, 'start', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>End</label>
                                        <input
                                            className="form-input"
                                            style={{ padding: '8px 12px', fontSize: 13 }}
                                            type="time"
                                            value={slot.end}
                                            onChange={(e) => handleDailySlotChange(i, 'end', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Year</label>
                                        <input
                                            className="form-input"
                                            style={{ padding: '8px 12px', fontSize: 13 }}
                                            type="number"
                                            min="1"
                                            value={slot.year || ''}
                                            onChange={(e) => handleDailySlotChange(i, 'year', parseInt(e.target.value) || '')}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Teachers Req.</label>
                                        <input
                                            className="form-input"
                                            style={{ padding: '8px 12px', fontSize: 13 }}
                                            type="number"
                                            min="1"
                                            value={slot.teachers_required || ''}
                                            onChange={(e) => handleDailySlotChange(i, 'teachers_required', parseInt(e.target.value) || '')}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Error / success message ───────────────────────────────── */}
                {message && (
                    <div style={{
                        padding: '12px 16px', borderRadius: 8,
                        background: message.includes('❌') ? '#FFF5F5' : '#ECFDF5',
                        border: `1px solid ${message.includes('❌') ? '#FED7D7' : '#10B981'}`,
                        fontSize: 'var(--fs-sm)',
                        color: message.includes('❌') ? 'var(--error)' : '#047857',
                        fontWeight: 600,
                    }}>
                        {message}
                    </div>
                )}

                {/* ── Summary panel (shown after successful generation) ─────── */}
                {summary && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                        {/* Fully-staffed vs understaffed banner */}
                        {!hasUnderstaffed ? (
                            <div style={{
                                padding: '14px 18px', background: '#ECFDF5',
                                border: '1.5px solid #10B981', borderRadius: 10,
                                display: 'flex', alignItems: 'center', gap: 10,
                                fontWeight: 700, color: '#047857', fontSize: 'var(--fs-sm)',
                            }}>
                                ✅ All {summary.totalSlots} slot{summary.totalSlots !== 1 ? 's' : ''} fully staffed!
                            </div>
                        ) : (
                            <div style={{ padding: '14px 18px', background: '#FFF7ED', border: '1.5px solid #F97316', borderRadius: 10, color: '#C2410C' }}>
                                <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', marginBottom: 10 }}>
                                    ⚠️ {summary.understaffedSlots.length} slot{summary.understaffedSlots.length !== 1 ? 's' : ''} could not be fully staffed
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                        <thead>
                                            <tr style={{ background: '#FFEDD5' }}>
                                                {['Slot', 'Date', 'Required', 'Assigned', 'Shortage'].map((h) => (
                                                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, borderBottom: '1px solid #FED7AA', whiteSpace: 'nowrap' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {summary.understaffedSlots.map((s, idx) => (
                                                <tr key={idx} style={{ background: '#FFF0EC' }}>
                                                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #FED7AA' }}>{s.slotName}</td>
                                                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #FED7AA' }}>{s.date}</td>
                                                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #FED7AA' }}>{s.required}</td>
                                                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #FED7AA' }}>{s.assigned}</td>
                                                    <td style={{ padding: '6px 10px', borderBottom: '1px solid #FED7AA', color: '#DC2626', fontWeight: 700 }}>{s.shortage}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Collapsible constraint warnings */}
                        {hasWarnings && (
                            <div style={{ border: '1.5px solid #EAB308', borderRadius: 10, overflow: 'hidden', background: '#FEFCE8' }}>
                                <button
                                    type="button"
                                    onClick={() => setWarningsOpen((o) => !o)}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center',
                                        justifyContent: 'space-between', padding: '12px 18px',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        fontWeight: 700, fontSize: 'var(--fs-sm)', color: '#92400E',
                                    }}
                                >
                                    <span>⚡ Constraint Relaxations Applied ({summary.warnings.length})</span>
                                    <span style={{ fontSize: 18 }}>{warningsOpen ? '▲' : '▼'}</span>
                                </button>
                                {warningsOpen && (
                                    <div style={{ padding: '0 18px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        {summary.warnings.map((w, idx) => (
                                            <div key={idx} style={{ fontSize: 12, color: '#78350F', padding: '3px 0', borderBottom: idx < summary.warnings.length - 1 ? '1px solid #FDE68A' : 'none' }}>
                                                • {w}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Download card */}
                        <div style={{ padding: 'var(--sp-4)', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 8, textAlign: 'center' }}>
                            <p style={{ color: '#047857', fontWeight: 600, marginBottom: 'var(--sp-3)', fontSize: 'var(--fs-sm)' }}>
                                Your schedule is ready!
                            </p>
                            {downloadId ? (
                                <a
                                    href={getDownloadHref()}
                                    download="invigilation_schedule.xlsx"
                                    className="btn btn-primary"
                                    style={{ background: '#10B981', border: 'none', width: '100%', justifyContent: 'center', display: 'inline-flex' }}
                                >
                                    ⬇️ Download Output Excel
                                </a>
                            ) : (
                                <span style={{ color: '#6B7280', fontSize: 12 }}>
                                    Download unavailable — database save failed, but the schedule was generated successfully.
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Submit button ─────────────────────────────────────────── */}
                <button
                    id="generate-schedule-btn"
                    type="submit"
                    className="btn btn-primary"
                    disabled={!canSubmit}
                    style={{ width: '100%', justifyContent: 'center' }}
                >
                    {loading ? 'Generating…' : 'Generate Schedule'}
                </button>
            </form>

            {/* Spin animation for the gear icon */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
