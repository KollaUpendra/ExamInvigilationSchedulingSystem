const xlsx = require('@e965/xlsx');
const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');

/** True when running in production — suppresses detailed error info in responses. */
const IS_PROD = process.env.NODE_ENV === 'production';

// -----------------------------
// CONFIGURATION
// -----------------------------

/**
 * Fixed teaching period windows for the institution.
 * Key = period number (1-6), Value = [startTime, endTime] in HH:MM.
 * Lunch break is between periods 4 and 5 (12:50–13:40).
 */

const PERIOD_TIMES = {
    1: ['09:00', '10:00'],
    2: ['10:00', '11:00'],
    3: ['11:00', '12:00'],
    4: ['12:00', '12:40'],
    5: ['12:40', '13:40'],
    6: ['13:40', '14:40'],
    7: ['14:40', '15:40'],
    8: ['15:40', '16:40'],
};

/** Maximum invigilation slots a single teacher may take on one calendar day. */
const MAX_SLOTS_PER_DAY = 3;

/** Maximum schedules returned by the history endpoint (prevents huge payloads). */
const MAX_HISTORY_RECORDS = 50;

// -----------------------------
// IN-MEMORY RATE LIMITING
// (no extra npm package required)
// -----------------------------

/**
 * Simple in-memory store for rate limiting schedule generation.
 * Structure: { ip: [timestamp, timestamp, ...] }
 * Max 5 requests per IP per 60 seconds.
 */
const _rateLimitMap = new Map();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

function checkRateLimit(ip) {
    const now = Date.now();
    const timestamps = (_rateLimitMap.get(ip) || []).filter(
        (t) => now - t < RATE_LIMIT_WINDOW_MS
    );
    if (timestamps.length >= RATE_LIMIT_MAX) return false; // blocked
    timestamps.push(now);
    _rateLimitMap.set(ip, timestamps);
    return true; // allowed
}

/**
 * In-flight deduplication: prevent double-submissions from a double-click.
 * Keyed by a fingerprint of (ip + examSlots JSON).
 * Entries expire after 30 seconds automatically.
 */
const _inFlight = new Map();
const IN_FLIGHT_TTL_MS = 30_000;

function acquireInFlight(key) {
    const now = Date.now();
    const entry = _inFlight.get(key);
    if (entry && now - entry < IN_FLIGHT_TTL_MS) return false; // duplicate
    _inFlight.set(key, now);
    return true;
}

function releaseInFlight(key) {
    _inFlight.delete(key);
}

// -----------------------------
// TIME UTILITIES
// -----------------------------

/**
 * Converts an "HH:MM" string to total minutes since midnight.
 * Returns -1 for invalid input so callers can detect it.
 */
function timeToMinutes(timeString) {
    if (!timeString || typeof timeString !== 'string') return -1;
    const parts = timeString.split(':');
    if (parts.length !== 2) return -1;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return -1;
    return h * 60 + m;
}

/** Returns true if the two time intervals overlap (exclusive endpoints). */
function overlap(start1, end1, start2, end2) {
    const s1 = timeToMinutes(start1);
    const e1 = timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    const e2 = timeToMinutes(end2);
    // Guard: invalid times never overlap
    if (s1 < 0 || e1 < 0 || s2 < 0 || e2 < 0) return false;
    if (s1 >= e1 || s2 >= e2) return false; // degenerate interval
    return s1 < e2 && s2 < e1;
}

// -----------------------------
// FIND OVERLAPPING PERIODS
// -----------------------------

/**
 * Returns the list of teaching period IDs (1-6) that overlap with the
 * given exam time window.  Uses precise minute-level comparison.
 */
function getOverlappingPeriods(slotStart, slotEnd) {
    const overlapping = [];
    for (const [periodId, [periodStart, periodEnd]] of Object.entries(PERIOD_TIMES)) {
        if (overlap(periodStart, periodEnd, slotStart, slotEnd)) {
            overlapping.push(Number(periodId));
        }
    }
    return overlapping;
}

// -----------------------------
// PARSE TIMETABLE
// -----------------------------

/**
 * Extracts the student year integer from a spreadsheet cell value.
 * Accepts values like "Year 1", "1", "CSE 2", "  3  " etc.
 * Returns null for empty / non-numeric cells.
 */
function extractYear(cell) {
    if (cell === null || cell === undefined || cell === '') return null;
    const parts = String(cell).split(/\s+/);
    for (const part of parts) {
        if (/^\d+$/.test(part)) return parseInt(part, 10);
    }
    return null;
}

/**
 * Validates that the uploaded file is actually an xlsx/zip by checking
 * the magic bytes at the start of the buffer.
 * xlsx files are zips and always start with PK (0x50 0x4B).
 */
function isXlsxBuffer(buffer) {
    return (
        buffer.length >= 4 &&
        buffer[0] === 0x50 && // P
        buffer[1] === 0x4b && // K
        (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) &&
        (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08)
    );
}

/**
 * Parses the uploaded timetable workbook.
 * Each sheet = one teacher. Rows = days, columns 1-6 = periods.
 *
 * Duplicate sheet names are MERGED (union of day entries).
 * If both sheets define the same day, the one with more non-null periods wins.
 *
 * Returns:
 *   { teacherSchedule: { teacherName: { dayName: { 1: year|null, ..., 6: year|null } } },
 *     duplicateWarnings: string[] }
 */
function parseTimetable(buffer) {
    let workbook;
    try {
        workbook = xlsx.read(buffer, { type: 'buffer' });
    } catch (e) {
        throw new Error('Could not read the uploaded file. Make sure it is a valid .xlsx workbook.');
    }

    const teacherSchedule = {};
    const duplicateWarnings = [];
    const sheetNameCount = {};

    for (const sheetName of workbook.SheetNames) {
        sheetNameCount[sheetName] = (sheetNameCount[sheetName] || 0) + 1;
    }

    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        const teacher = sheetName.trim();

        const dayData = {};
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;
            const day = row[0];
            if (day === null || day === undefined || day === '') continue;
            const dayKey = String(day).trim();
            dayData[dayKey] = {};
            for (let periodIndex = 1; periodIndex <= 6; periodIndex++) {
                dayData[dayKey][periodIndex] = extractYear(row[periodIndex]);
            }
        }

        if (teacherSchedule[teacher]) {
            // Merge: duplicate sheet — union of day entries, keep the
            // day with more non-null period values when there's a conflict.
            if (sheetNameCount[sheetName] > 1) {
                duplicateWarnings.push(
                    `Duplicate sheet name "${teacher}" found — merging entries from both sheets.`
                );
            }
            for (const [day, periods] of Object.entries(dayData)) {
                if (!teacherSchedule[teacher][day]) {
                    teacherSchedule[teacher][day] = periods;
                } else {
                    // Keep the entry with more non-null filled periods
                    const existingCount = Object.values(teacherSchedule[teacher][day]).filter(v => v !== null).length;
                    const newCount = Object.values(periods).filter(v => v !== null).length;
                    if (newCount > existingCount) {
                        teacherSchedule[teacher][day] = periods;
                    }
                }
            }
        } else {
            teacherSchedule[teacher] = dayData;
        }
    }

    return { teacherSchedule, duplicateWarnings };
}

// -----------------------------
// CONFLICT CHECK
// -----------------------------

/**
 * Returns true if the teacher has NO blocking timetable conflict during the
 * periods that overlap with the exam slot, applying **day-level normalization**.
 *
 * Rules (evaluated per overlapping period):
 *  - null/undefined period entry                       → free (no conflict)
 *  - teacherYear ∈ examYearsForDay[slot.day]           → treat as free
 *    (that year's classes are suspended for the exam)
 *  - teacherYear ∉ examYearsForDay[slot.day]           → CONFLICT
 *
 * A teacher with no timetable entry for that day is treated as fully free.
 *
 * @param {string} teacher
 * @param {object} slot              - exam slot (must have .day, .start, .end)
 * @param {object} teacherSchedule   - parsed timetable
 * @param {Map<string,Set<number>>} examYearsForDay - precomputed day → Set<year>
 */
function hasNoConflict(teacher, slot, teacherSchedule, examYearsForDay) {
    const periods = getOverlappingPeriods(slot.start, slot.end);
    const daySchedule = (teacherSchedule[teacher] && teacherSchedule[teacher][slot.day]) || {};
    const freeYears = examYearsForDay.get(slot.day) || new Set();

    for (const periodId of periods) {
        const year = daySchedule[periodId];
        // Null/undefined → free; year has an exam that day → free; otherwise conflict
        if (year !== null && year !== undefined && !freeYears.has(year)) {
            return false; // teaching a year with no exam today → conflict
        }
    }
    return true;
}

/**
 * Returns true if the teacher teaches the same year as the exam in any
 * overlapping period (drives the same-year priority bonus in scoring).
 */
function teacherTeachesSameYear(teacher, slot, teacherSchedule) {
    const examYear = slot.year;
    const periods = getOverlappingPeriods(slot.start, slot.end);
    const daySchedule = (teacherSchedule[teacher] && teacherSchedule[teacher][slot.day]) || {};

    for (const periodId of periods) {
        if (daySchedule[periodId] === examYear) return true;
    }
    return false;
}

// -----------------------------
// WEIGHTED TEACHER SCORING
// -----------------------------

/**
 * Priority score for a teacher for a given exam slot.
 * Lower score = higher priority (assigned first).
 *
 * score = (dayLoad × 10)
 *       + (totalLoad × 1)
 *       - (sameYearBonus × 2)
 *       + (assignedYesterdayPenalty × 3)
 *
 * Rationale:
 *   - Day load is the strongest signal: respect the 2/day limit direction.
 *   - Total load drives long-term fairness.
 *   - Same-year bonus rewards "natural" invigilators (their class is in the exam).
 *   - Yesterday penalty prevents assigning the same teachers on back-to-back days
 *     when alternatives exist (tiebreaker only — weight is low).
 *
 * @param {string}  teacher
 * @param {object}  slot               - exam slot object
 * @param {object}  teacherSchedule    - parsed timetable
 * @param {object}  teacherLoad        - { name: totalCount }
 * @param {object}  teacherDailyLoad   - { name: { date: count } }
 * @param {object}  teacherLastDate    - { name: 'lastAssignedDate' | null }
 */
function computeScore(teacher, slot, teacherSchedule, teacherLoad, teacherDailyLoad, teacherLastDate) {
    const totalLoad = teacherLoad[teacher] || 0;
    const dayLoad = (teacherDailyLoad[teacher] && teacherDailyLoad[teacher][slot.date]) || 0;
    const sameYearBonus = teacherTeachesSameYear(teacher, slot, teacherSchedule) ? 1 : 0;

    // Yesterday penalty: add 3 if the teacher's last assignment was the previous calendar day
    let yesterdayPenalty = 0;
    const lastDate = teacherLastDate[teacher];
    if (lastDate) {
        const slotDateMs = new Date(parseBackendDate(slot.date)).getTime();
        const lastDateMs = new Date(parseBackendDate(lastDate)).getTime();
        const diffDays = Math.round((slotDateMs - lastDateMs) / 86_400_000);
        if (diffDays === 1) yesterdayPenalty = 1;
    }

    return (dayLoad * 10) + (totalLoad * 1) - (sameYearBonus * 2) + (yesterdayPenalty * 3);
}

/**
 * Parses the backend date format "D/M/YY" into a JS Date.
 * Used only for date arithmetic in the yesterday-penalty calculation.
 */
function parseBackendDate(dateStr) {
    if (!dateStr) return new Date(0);
    const [d, m, y] = dateStr.split('/');
    // Assume 2000s for 2-digit year
    return new Date(`20${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
}

// -----------------------------
// TIERED FALLBACK ASSIGNMENT
// -----------------------------

/**
 * Assigns teachers to a single exam slot using a 3-tier fallback.
 *
 * Tier 1 (strict):  conflict-free + within daily limit
 * Tier 2 (relaxed): conflict-free + ignore daily limit
 * Tier 3 (last resort): no explicit conflict (null/same-year periods ok)
 *
 * Returns:
 *   { assigned: string[], warnings: string[], understaffed: boolean, shortage: number }
 *
 * Guaranteed to never crash: if fewer teachers exist than required, returns
 * a partial assignment with understaffed=true and shortage > 0.
 */
function assignTeachersToSlot(slot, teachers, teacherSchedule, teacherLoad, teacherDailyLoad, teacherLastDate, examYearsForDay) {
    const required = slot.teachers_required;
    const warnings = [];

    // Helper: sort a teacher array by weighted score (ascending = best first)
    const sortByScore = (arr) =>
        arr.slice().sort((a, b) =>
            computeScore(a, slot, teacherSchedule, teacherLoad, teacherDailyLoad, teacherLastDate) -
            computeScore(b, slot, teacherSchedule, teacherLoad, teacherDailyLoad, teacherLastDate)
        );

    // ── TIER 1: strict ──────────────────────────────────────────────────────
    const tier1Pool = teachers.filter((t) => {
        const dailyLoad = (teacherDailyLoad[t] && teacherDailyLoad[t][slot.date]) || 0;
        return hasNoConflict(t, slot, teacherSchedule, examYearsForDay) && dailyLoad < MAX_SLOTS_PER_DAY;
    });

    const tier1Sorted = sortByScore(tier1Pool);
    if (tier1Sorted.length >= required) {
        return { assigned: tier1Sorted.slice(0, required), warnings, understaffed: false, shortage: 0 };
    }

    const tier1Assigned = new Set(tier1Sorted);

    // ── TIER 2: relax daily limit (still conflict-free) ─────────────────────
    const tier2Pool = teachers.filter(
        (t) => !tier1Assigned.has(t) && hasNoConflict(t, slot, teacherSchedule, examYearsForDay)
    );

    const tier2Sorted = sortByScore(tier2Pool);
    const tier2Picks = [];
    for (const t of tier2Sorted) {
        if (tier1Assigned.size + tier2Picks.length >= required) break;
        tier2Picks.push(t);
        warnings.push(`${t} exceeded daily limit on ${slot.date}`);
    }

    const tier2Combined = [...tier1Assigned, ...tier2Picks];
    if (tier2Combined.length >= required) {
        return { assigned: tier2Combined.slice(0, required), warnings, understaffed: false, shortage: 0 };
    }

    // ── TIER 3: last resort — day-level normalized conflict check ────────────
    // Applies the same examYearsForDay normalization for consistency.
    const freeYears = examYearsForDay.get(slot.day) || new Set();
    const tier2Set = new Set(tier2Combined);
    const tier3Pool = teachers.filter((t) => {
        if (tier2Set.has(t)) return false;
        const daySchedule = (teacherSchedule[t] && teacherSchedule[t][slot.day]) || {};
        const periods = getOverlappingPeriods(slot.start, slot.end);
        for (const periodId of periods) {
            const year = daySchedule[periodId];
            // Same day-level rule: only block if year has NO exam today
            if (year !== null && year !== undefined && !freeYears.has(year)) {
                return false; // teaching a non-exam year → still a conflict
            }
        }
        return true;
    });

    const tier3All = sortByScore(tier3Pool);
    const tier3Picks = [];
    for (const t of tier3All) {
        if (tier2Combined.length + tier3Picks.length >= required) break;
        tier3Picks.push(t);
        warnings.push(`${t} assigned with relaxed constraints on ${slot.date}`);
    }

    const tier3Combined = [...tier2Combined, ...tier3Picks];
    const finalAssigned = tier3Combined.slice(0, required);
    const shortage = required - finalAssigned.length;

    return { assigned: finalAssigned, warnings, understaffed: shortage > 0, shortage };
}

// -----------------------------
// ELIGIBLE COUNT (for scarcity ordering)
// -----------------------------

/**
 * Counts teachers who are conflict-free for a slot (ignores daily limits).
 * Used to order slots for scheduling: scarcest slot goes first.
 * Uses day-level normalization via examYearsForDay.
 */
function countEligibleTeachers(slot, teachers, teacherSchedule, examYearsForDay) {
    return teachers.filter((t) => hasNoConflict(t, slot, teacherSchedule, examYearsForDay)).length;
}

// -----------------------------
// MAIN SCHEDULER
// -----------------------------

/**
 * Runs the full greedy scheduling algorithm.
 *
 * Algorithm:
 *   1. Scarcity-first: sort exam slots by fewest conflict-free teachers (ascending).
 *   2. For each slot (in scarcity order): use 3-tier assignment.
 *   3. Update load counters and lastAssignedDate after each slot.
 *   4. Return results in original slot order for output.
 *
 * Complexity: O(slots × teachers) per tier pass — all data held in memory.
 * No DB calls inside any loop.
 */
function generateScheduleList(teacherSchedule, examSlots, duplicateWarnings) {
    const teachers = Object.keys(teacherSchedule);
    const teacherLoad = {};
    const teacherDailyLoad = {};
    const teacherLastDate = {}; // tracks last date a teacher was assigned
    const warnings = [...(duplicateWarnings || [])];

    for (const t of teachers) {
        teacherLoad[t] = 0;
        teacherDailyLoad[t] = {};
        teacherLastDate[t] = null;
    }

    // ── Precompute day-level exam years (O(slots)) ────────────────────────────
    // examYearsForDay: Map<slotDay, Set<year>>
    // For each calendar day, collect all student years that have an exam.
    // Any timetable period whose year appears in this set is treated as free
    // (classes for that year are effectively suspended on exam day).
    const examYearsForDay = new Map();
    for (const slot of examSlots) {
        if (!examYearsForDay.has(slot.day)) {
            examYearsForDay.set(slot.day, new Set());
        }
        examYearsForDay.get(slot.day).add(slot.year);
    }

    // ── Step 1: Scarcity-first ordering ──────────────────────────────────────
    const slotsWithIndex = examSlots.map((slot, idx) => ({
        slot,
        originalIndex: idx,
        eligibilityCount: countEligibleTeachers(slot, teachers, teacherSchedule, examYearsForDay),
    }));

    // Keep a stable sort: tie-break by original index so identical-eligibility
    // slots are always processed in the order the user entered them.
    const sortedSlots = slotsWithIndex.slice().sort((a, b) =>
        a.eligibilityCount !== b.eligibilityCount
            ? a.eligibilityCount - b.eligibilityCount
            : a.originalIndex - b.originalIndex
    );

    // ── Step 2–3: Assign ──────────────────────────────────────────────────────
    const schedule = [];
    const slotResults = new Array(examSlots.length).fill(null);

    for (const { slot, originalIndex } of sortedSlots) {
        const result = assignTeachersToSlot(
            slot, teachers, teacherSchedule, teacherLoad, teacherDailyLoad, teacherLastDate, examYearsForDay
        );

        for (const w of result.warnings) warnings.push(w);

        for (const teacher of result.assigned) {
            schedule.push({ teacher, date: slot.date, slot: slot.slot });

            teacherLoad[teacher] = (teacherLoad[teacher] || 0) + 1;
            teacherDailyLoad[teacher][slot.date] = (teacherDailyLoad[teacher][slot.date] || 0) + 1;
            teacherLastDate[teacher] = slot.date; // record last assignment date
        }

        slotResults[originalIndex] = {
            slotName: slot.slot,
            date: slot.date,
            required: slot.teachers_required,
            assigned: result.assigned.length,
            understaffed: result.understaffed,
            shortage: result.shortage,
        };
    }

    // ── Step 4: Summary ───────────────────────────────────────────────────────
    const understaffedSlots = slotResults
        .filter((r) => r && r.understaffed)
        .map((r) => ({
            slotName: r.slotName,
            date: r.date,
            required: r.required,
            assigned: r.assigned,
            shortage: r.shortage,
        }));

    const summary = {
        totalSlots: examSlots.length,
        fullyStaffed: examSlots.length - understaffedSlots.length,
        understaffedSlots,
        warnings,
    };

    return { schedule, summary, slotResults };
}

// -----------------------------
// GENERATE OUTPUT EXCEL
// -----------------------------

function generateOutputExcel(schedule, teachers, examSlots, slotResults) {
    // Columns in original slot order
    const columns = examSlots.map(
        (slot) => `${slot.date} ${slot.slot} (${slot.start}-${slot.end})`
    );

    // Quick lookup: which column names are understaffed?
    const understaffedCols = new Set(
        examSlots
            .filter((_, idx) => slotResults[idx] && slotResults[idx].understaffed)
            .map((slot) => `${slot.date} ${slot.slot} (${slot.start}-${slot.end})`)
    );

    // Build one row per teacher
    const dataRows = teachers.map((teacherName) => {
        const row = { Teacher: teacherName };
        for (const col of columns) row[col] = '';
        return row;
    });

    // Populate YES cells
    for (const { teacher, date, slot } of schedule) {
        const slotInfo = examSlots.find((s) => s.slot === slot && s.date === date);
        if (!slotInfo) continue;
        const colName = `${slotInfo.date} ${slotInfo.slot} (${slotInfo.start}-${slotInfo.end})`;
        const row = dataRows.find((r) => r.Teacher === teacher);
        if (row) row[colName] = 'YES';
    }

    // ── Main worksheet ────────────────────────────────────────────────────────
    const worksheet = xlsx.utils.json_to_sheet(dataRows);

    // Uniform 25-char column widths
    worksheet['!cols'] = [{ wch: 25 }, ...columns.map(() => ({ wch: 25 }))];

    // Freeze header row + teacher name column
    worksheet['!views'] = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];

    // Red header cells for understaffed slots
    columns.forEach((col, colOffset) => {
        if (understaffedCols.has(col)) {
            const cellAddress = xlsx.utils.encode_cell({ r: 0, c: colOffset + 1 });
            if (worksheet[cellAddress]) {
                worksheet[cellAddress].s = {
                    fill: { patternType: 'solid', fgColor: { argb: 'FFFF0000' } },
                    font: { bold: true, color: { argb: 'FFFFFFFF' } },
                    alignment: { horizontal: 'center' },
                };
            }
        }
    });

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Invigilation Schedule');

    // ── Summary worksheet ─────────────────────────────────────────────────────
    const summaryData = slotResults
        .filter((r) => r !== null)
        .map((r) => ({
            'Slot Name': r.slotName,
            Date: r.date,
            Required: r.required,
            Assigned: r.assigned,
            Shortage: r.shortage,
        }));

    if (summaryData.length === 0) {
        summaryData.push({ 'Slot Name': '', Date: '', Required: 0, Assigned: 0, Shortage: 0 });
    }

    const summarySheet = xlsx.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [
        { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    ];

    // Style understaffed rows — track actual data-row index (nulls were filtered out)
    let dataRow = 1; // row 0 = header
    for (const r of slotResults) {
        if (r === null) continue;
        if (r.understaffed) {
            for (let c = 0; c < 5; c++) {
                const addr = xlsx.utils.encode_cell({ r: dataRow, c });
                if (summarySheet[addr]) summarySheet[addr].s = { font: { bold: true } };
            }
            const shortageAddr = xlsx.utils.encode_cell({ r: dataRow, c: 4 });
            if (summarySheet[shortageAddr]) {
                summarySheet[shortageAddr].s = {
                    fill: { patternType: 'solid', fgColor: { argb: 'FFFF0000' } },
                    font: { bold: true, color: { argb: 'FFFFFFFF' } },
                };
            }
        }
        dataRow++;
    }

    xlsx.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

// =============================================================================
// CONTROLLER EXPORTS
// =============================================================================

/**
 * POST /api/schedule/generate
 *
 * Pipeline:
 *   1. Rate-limit check (5 req/IP/min)
 *   2. In-flight dedup (prevent double-submit)
 *   3. File presence + magic-byte validation
 *   4. examSlots JSON parse + field coercion + range validation
 *   5. Time format validation (HH:MM, start < end)
 *   6. Max 3 slots per day
 *   7. parseTimetable → generateScheduleList → generateOutputExcel
 *   8. Save to MongoDB (non-fatal if DB down)
 *   9. Return { success, downloadId, summary }
 */
exports.generateSchedule = async (req, res) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';

    // ── 1. Rate limit ─────────────────────────────────────────────────────────
    if (!checkRateLimit(ip)) {
        return res.status(429).json({
            success: false,
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please wait a moment before generating another schedule.',
        });
    }

    try {
        // ── 2. File presence ──────────────────────────────────────────────────
        if (!req.file) {
            return res.status(400).json({ success: false, code: 'NO_FILE', message: 'No timetable Excel file uploaded.' });
        }

        // ── 3. Magic-byte validation (xlsx = zip = starts with PK) ────────────
        if (!isXlsxBuffer(req.file.buffer)) {
            return res.status(400).json({
                success: false,
                code: 'INVALID_FILE_TYPE',
                message: 'Invalid file type. Please upload a valid .xlsx Excel workbook.',
            });
        }

        // ── 4. Parse examSlots ────────────────────────────────────────────────
        let examSlots = [];
        try {
            examSlots = JSON.parse(req.body.examSlots);
        } catch (e) {
            return res.status(400).json({
                success: false,
                code: 'INVALID_EXAM_SLOTS',
                message: 'Invalid format for examSlots. Must be a valid JSON array.',
            });
        }

        if (!Array.isArray(examSlots) || examSlots.length === 0) {
            return res.status(400).json({ success: false, code: 'INVALID_EXAM_SLOTS', message: 'examSlots must be a non-empty array.' });
        }

        // ── 5. Field coercion + range validation ──────────────────────────────
        const HH_MM_RE = /^\d{2}:\d{2}$/;

        for (const slot of examSlots) {
            slot.year = Number(slot.year);
            slot.teachers_required = Number(slot.teachers_required);

            if (!slot.date || !slot.day || !slot.slot || !slot.start || !slot.end) {
                return res.status(400).json({
                    success: false,
                    message: 'Each exam slot must have date, day, slot, start, and end.',
                });
            }
            if (isNaN(slot.year) || slot.year < 1) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid year value in slot "${slot.slot}": must be a positive integer.`,
                });
            }
            if (isNaN(slot.teachers_required) || slot.teachers_required < 1) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid teachers_required in slot "${slot.slot}": must be ≥ 1.`,
                });
            }
            // Time format check
            if (!HH_MM_RE.test(slot.start) || !HH_MM_RE.test(slot.end)) {
                return res.status(400).json({
                    success: false,
                    message: `Slot "${slot.slot}" has an invalid time format. Expected HH:MM (e.g. 09:30).`,
                });
            }
            // start must be before end
            if (timeToMinutes(slot.start) >= timeToMinutes(slot.end)) {
                return res.status(400).json({
                    success: false,
                    message: `Slot "${slot.slot}" start time (${slot.start}) must be before end time (${slot.end}).`,
                });
            }
        }

        // ── 6. Max 3 slots per day ────────────────────────────────────────────
        const slotsPerDay = {};
        for (const slot of examSlots) {
            slotsPerDay[slot.date] = (slotsPerDay[slot.date] || 0) + 1;
            if (slotsPerDay[slot.date] > 3) {
                return res.status(400).json({
                    success: false,
                    message: `Maximum 3 slots per day. Found more than 3 for date: ${slot.date}`,
                });
            }
        }

        // ── 7. In-flight dedup (fingerprint = ip + sorted examSlots JSON) ─────
        const fingerprint = ip + ':' + JSON.stringify(examSlots);
        if (!acquireInFlight(fingerprint)) {
            return res.status(429).json({
                success: false,
                code: 'DUPLICATE_REQUEST',
                message: 'A schedule with these exact parameters is already being generated. Please wait.',
            });
        }

        let downloadId = null;
        try {
            // ── 8. Parse timetable ────────────────────────────────────────────
            const { teacherSchedule, duplicateWarnings } = parseTimetable(req.file.buffer);

            if (Object.keys(teacherSchedule).length === 0) {
                return res.status(400).json({
                    success: false,
                    code: 'EMPTY_WORKBOOK',
                    message: 'The uploaded workbook contains no teacher sheets. Each sheet should be named after a teacher.',
                });
            }

            // ── 9. Run scheduler ──────────────────────────────────────────────
            const { schedule, summary, slotResults } = generateScheduleList(
                teacherSchedule, examSlots, duplicateWarnings
            );
            const teachers = Object.keys(teacherSchedule);

            // ── 10. Build output Excel ────────────────────────────────────────
            const outputBuffer = generateOutputExcel(schedule, teachers, examSlots, slotResults);

            // ── 11. Persist to MongoDB (non-fatal) ────────────────────────────
            try {
                const saved = await new Schedule({
                    examSlots,
                    assignedSchedule: schedule,
                    teachersInvolved: teachers,
                    fileData: {
                        data: outputBuffer,
                        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        filename: 'invigilation_schedule.xlsx',
                    },
                    inputFileData: {
                        data: req.file.buffer,
                        contentType: req.file.mimetype,
                        filename: req.file.originalname,
                    },
                }).save();
                downloadId = saved._id;
            } catch (dbError) {
                // Non-fatal — schedule was still generated, just not persisted.
                if (!IS_PROD) console.error('[scheduleController] DB save failed:', dbError.stack);
                else console.error('[scheduleController] DB save failed:', dbError.message);
            }

            return res.status(200).json({ success: true, downloadId, summary });

        } finally {
            // Always release the in-flight lock even if an error was thrown
            releaseInFlight(fingerprint);
        }

    } catch (error) {
        if (!IS_PROD) console.error('[scheduleController] generateSchedule error:', error.stack);
        else console.error('[scheduleController] generateSchedule error:', error.message);
        res.status(500).json({
            success: false,
            code: 'INTERNAL_ERROR',
            message: IS_PROD ? 'Failed to generate schedule. Please try again.' : (error.message || 'Failed to generate schedule.'),
        });
    }
};

// =============================================================================

/**
 * GET /api/schedule
 * Returns up to 50 most-recent schedules, binary fields excluded.
 * Uses .lean() for read-only plain-JS objects (faster than full Mongoose docs).
 */
exports.getSchedules = async (req, res) => {
    try {
        const schedules = await Schedule.find({})
            .select('-fileData.data -inputFileData.data')
            .sort({ createdAt: -1 })
            .limit(MAX_HISTORY_RECORDS)
            .lean();

        res.status(200).json({ success: true, schedules });
    } catch (error) {
        if (!IS_PROD) console.error('[scheduleController] getSchedules error:', error.stack);
        else console.error('[scheduleController] getSchedules error:', error.message);
        res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to fetch schedules.' });
    }
};

// =============================================================================

/**
 * GET /api/schedule/:id/download
 * Streams the generated Excel (or input timetable if ?type=input) from MongoDB.
 * Correctly unwraps the BSON Binary wrapper to send raw bytes.
 */
exports.downloadSchedule = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid schedule ID.' });
        }

        // Use .lean() since we only need the raw data fields
        const schedule = await Schedule.findById(id).lean();

        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Schedule not found.' });
        }

        const { type } = req.query;
        let targetFile;

        if (type === 'input' && schedule.inputFileData && schedule.inputFileData.data) {
            targetFile = schedule.inputFileData;
        } else if (schedule.fileData && schedule.fileData.data) {
            targetFile = schedule.fileData;
        } else {
            return res.status(404).json({ success: false, message: 'File data not found in this schedule.' });
        }

        // Mongoose/BSON wraps Buffer fields in a Binary object whose raw
        // bytes live in `binary.buffer` (a Node.js Buffer / Uint8Array).
        // res.send() detects a Buffer and streams it; Binary objects are
        // sent as-is (corrupt). So we always unwrap first.
        const rawBuffer = Buffer.isBuffer(targetFile.data)
            ? targetFile.data
            : Buffer.from(targetFile.data.buffer ?? targetFile.data);

        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${targetFile.filename || 'download.xlsx'}"`
        );
        res.setHeader(
            'Content-Type',
            targetFile.contentType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Length', rawBuffer.length);
        res.send(rawBuffer);

    } catch (error) {
        if (!IS_PROD) console.error('[scheduleController] downloadSchedule error:', error.stack);
        else console.error('[scheduleController] downloadSchedule error:', error.message);
        res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to download schedule.' });
    }
};

// =============================================================================

/**
 * DELETE /api/schedule/:id
 * Removes a schedule document from MongoDB.
 */
exports.deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid schedule ID.' });
        }

        const deleted = await Schedule.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Schedule not found.' });
        }

        res.status(200).json({ success: true, message: 'Schedule deleted successfully.' });
    } catch (error) {
        if (!IS_PROD) console.error('[scheduleController] deleteSchedule error:', error.stack);
        else console.error('[scheduleController] deleteSchedule error:', error.message);
        res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to delete schedule.' });
    }
};
