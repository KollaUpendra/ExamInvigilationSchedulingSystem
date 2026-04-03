import React, { useState } from 'react';

export default function ScheduleGenerator({ onScheduleGenerated }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [downloadId, setDownloadId] = useState(null);
    const [summary, setSummary] = useState(null);
    const [warningsOpen, setWarningsOpen] = useState(false);

    // State for selected dates
    const [dates, setDates] = useState(['']);

    // State for daily slots templates (max 3)
    const defaultDailySlot = {
        slot: 'Slot1',
        start: '',
        end: '',
        year: 1,
        teachers_required: 1
    };
    const [dailySlots, setDailySlots] = useState([{ ...defaultDailySlot }]);

    // Date Functions
    const addDate = () => setDates([...dates, '']);
    const removeDate = (index) => setDates(dates.filter((_, i) => i !== index));
    const handleDateChange = (index, value) => {
        const newDates = [...dates];
        newDates[index] = value;
        setDates(newDates);
    };
    // Daily Slot Functions
    const addDailySlot = () => {
        if (dailySlots.length < 3) {
            setDailySlots([...dailySlots, { ...defaultDailySlot, slot: `Slot${dailySlots.length + 1}` }]);
        }
    };
    const removeDailySlot = (index) => setDailySlots(dailySlots.filter((_, i) => i !== index));
    const handleDailySlotChange = (index, field, value) => {
        const newSlots = [...dailySlots];
        newSlots[index][field] = value;
        setDailySlots(newSlots);
    };

    const getDayName = (dateStr) => {
        if (!dateStr) return '';
        const dayIndex = new Date(dateStr).getDay();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dayIndex] || '';
    };

    const formatToBackendDate = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${parseInt(day)}/${parseInt(month)}/${year.substring(2)}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setSummary(null);
        setDownloadUrl(null);
        setDownloadId(null);
        setWarningsOpen(false);

        if (!file) {
            setMessage('Please upload a timetable Excel file.');
            return;
        }

        const validDates = dates.filter(d => d.trim() !== '');
        if (validDates.length === 0) {
            setMessage('Please select at least one date.');
            return;
        }

        for (const s of dailySlots) {
            if (!s.slot || !s.start || !s.end || !s.year || !s.teachers_required) {
                setMessage('Please fill in all details for each daily slot.');
                return;
            }
        }

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
                    year: slot.year,
                    teachers_required: slot.teachers_required
                });
            }
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('examSlots', JSON.stringify(generatedSlots));

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/schedule/generate`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Failed to generate schedule.');
            }

            // Backend now returns JSON with downloadId + summary
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to generate schedule.');
            }

            setSummary(data.summary);
            setDownloadId(data.downloadId);
            setMessage('');

            if (onScheduleGenerated) {
                onScheduleGenerated();
            }
        } catch (error) {
            console.error('Submit error:', error);
            setMessage(`❌ Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Build the download URL from the stored downloadId via the existing download endpoint
    const getDownloadHref = () => {
        if (!downloadId) return '#';
        return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/schedule/download/${downloadId}`;
    };

    const hasUnderstaffed = summary && summary.understaffedSlots && summary.understaffedSlots.length > 0;
    const hasWarnings = summary && summary.warnings && summary.warnings.length > 0;

    return (
        <div className="card" style={{ padding: 'var(--sp-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
                <span style={{ fontSize: 24 }}>📅</span>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'var(--fs-lg)', color: 'var(--charcoal)' }}>
                    Schedule Generator
                </h3>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>

                {/* File Upload */}
                <div style={{ background: 'var(--light-gray)', padding: 'var(--sp-4)', borderRadius: 12, border: '1px dashed var(--border)' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: 'var(--fs-sm)', marginBottom: 8, color: 'var(--dark)' }}>
                        Teacher Timetables (.xlsx)
                    </label>
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={(e) => setFile(e.target.files[0])}
                        style={{ fontSize: 'var(--fs-sm)' }}
                    />
                </div>

                {/* Dates Configuration */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
                        <label style={{ fontWeight: 600, fontSize: 'var(--fs-sm)', color: 'var(--dark)' }}>
                            Exam Dates
                        </label>
                        <button
                            type="button"
                            onClick={addDate}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '4px 12px', fontSize: 12 }}
                        >
                            + Add Date
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
                        {dates.map((date, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--light-gray)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => handleDateChange(index, e.target.value)}
                                    className="input"
                                    style={{ border: 'none', background: 'transparent', padding: 0, fontSize: 13, height: 'auto' }}
                                    required
                                />
                                {dates.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeDate(index)}
                                        style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center' }}
                                    >
                                        &times;
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Daily Slots Configuration */}
                <div style={{ paddingTop: 'var(--sp-5)', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
                        <label style={{ fontWeight: 600, fontSize: 'var(--fs-sm)', color: 'var(--dark)' }}>
                            Daily Slots (Max 3 / Day)
                        </label>
                        {dailySlots.length < 3 && (
                            <button
                                type="button"
                                onClick={addDailySlot}
                                className="btn btn-outline btn-sm"
                                style={{ padding: '4px 12px', fontSize: 12 }}
                            >
                                + Add Slot
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                        {dailySlots.map((slot, index) => (
                            <div key={index} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 'var(--sp-4)', position: 'relative' }}>

                                {dailySlots.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeDailySlot(index)}
                                        style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 18 }}
                                    >
                                        &times;
                                    </button>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--sp-3)' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Slot Name</label>
                                        <input className="form-input" style={{ padding: '8px 12px', fontSize: 13 }} type="text" value={slot.slot} onChange={(e) => handleDailySlotChange(index, 'slot', e.target.value)} required placeholder="Slot1" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Start Time</label>
                                        <input className="form-input" style={{ padding: '8px 12px', fontSize: 13 }} type="time" value={slot.start} onChange={(e) => handleDailySlotChange(index, 'start', e.target.value)} required />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>End Time</label>
                                        <input className="form-input" style={{ padding: '8px 12px', fontSize: 13 }} type="time" value={slot.end} onChange={(e) => handleDailySlotChange(index, 'end', e.target.value)} required />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Year</label>
                                        <input className="form-input" style={{ padding: '8px 12px', fontSize: 13 }} type="number" min="1" value={slot.year} onChange={(e) => handleDailySlotChange(index, 'year', parseInt(e.target.value))} required />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Teachers Req.</label>
                                        <input className="form-input" style={{ padding: '8px 12px', fontSize: 13 }} type="number" min="1" value={slot.teachers_required} onChange={(e) => handleDailySlotChange(index, 'teachers_required', parseInt(e.target.value))} required />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {message && (
                    <div style={{ fontSize: 'var(--fs-sm)', color: message.includes('❌') ? 'var(--red)' : '#10B981', fontWeight: 600 }}>
                        {message}
                    </div>
                )}

                {/* ── SUMMARY PANEL ── */}
                {summary && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                        {/* Success / Understaffed banner */}
                        {!hasUnderstaffed ? (
                            <div style={{
                                padding: '14px 18px',
                                background: '#ECFDF5',
                                border: '1.5px solid #10B981',
                                borderRadius: 10,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                fontWeight: 700,
                                color: '#047857',
                                fontSize: 'var(--fs-sm)'
                            }}>
                                ✅ All {summary.totalSlots} slot{summary.totalSlots !== 1 ? 's' : ''} fully staffed!
                            </div>
                        ) : (
                            <div style={{
                                padding: '14px 18px',
                                background: '#FFF7ED',
                                border: '1.5px solid #F97316',
                                borderRadius: 10,
                                color: '#C2410C'
                            }}>
                                <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', marginBottom: 10 }}>
                                    ⚠️ {summary.understaffedSlots.length} slot{summary.understaffedSlots.length !== 1 ? 's' : ''} could not be fully staffed
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                        <thead>
                                            <tr style={{ background: '#FFEDD5' }}>
                                                {['Slot', 'Date', 'Required', 'Assigned', 'Shortage'].map(h => (
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

                        {/* Constraint relaxation warnings (collapsible) */}
                        {hasWarnings && (
                            <div style={{
                                border: '1.5px solid #EAB308',
                                borderRadius: 10,
                                overflow: 'hidden',
                                background: '#FEFCE8'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setWarningsOpen(o => !o)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 18px',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: 700,
                                        fontSize: 'var(--fs-sm)',
                                        color: '#92400E'
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

                        {/* Download button — always shown after generation */}
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
                                    (Download unavailable — database save failed, but schedule was generated.)
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Keep old downloadUrl support (legacy blob downloads, if any) */}
                {!summary && downloadUrl && (
                    <div style={{ padding: 'var(--sp-4)', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 8, textAlign: 'center' }}>
                        <p style={{ color: '#047857', fontWeight: 600, marginBottom: 'var(--sp-3)' }}>Your schedule is ready!</p>
                        <a
                            href={downloadUrl}
                            download="invigilation_schedule.xlsx"
                            className="btn btn-primary"
                            style={{ background: '#10B981', border: 'none', width: '100%', justifyContent: 'center' }}
                            onClick={() => {
                                setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
                            }}
                        >
                            ⬇️ Download Output Excel
                        </a>
                    </div>
                )}

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !file || dates.length === 0}
                    style={{ width: '100%', justifyContent: 'center' }}
                >
                    {loading ? 'Generating...' : 'Generate New Schedule'}
                </button>
            </form>
        </div>
    );
}
