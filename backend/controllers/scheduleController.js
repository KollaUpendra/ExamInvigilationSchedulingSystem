const xlsx = require('@e965/xlsx');
const Schedule = require('../models/Schedule');

// -----------------------------
// CONFIGURATION
// -----------------------------

const PERIOD_TIMES = {
    1: ["09:30", "10:20"],
    2: ["10:20", "11:10"],
    3: ["11:10", "12:00"],
    4: ["12:00", "12:50"],
    5: ["13:40", "14:30"],
    6: ["14:30", "15:20"]
};

const MAX_SLOTS_PER_DAY = 2;

// -----------------------------
// TIME UTILITIES
// -----------------------------

function timeToMinutes(timeString) {
    if (!timeString) return 0;
    const parts = timeString.split(":");
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

function overlap(start1, end1, start2, end2) {
    const s1 = timeToMinutes(start1);
    const e1 = timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    const e2 = timeToMinutes(end2);

    return s1 < e2 && s2 < e1;
}

// -----------------------------
// FIND OVERLAPPING PERIODS
// -----------------------------

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

function extractYear(cell) {
    if (cell === null || cell === undefined || cell === "") {
        return null;
    }

    const parts = String(cell).split(/\s+/);
    for (const part of parts) {
        if (/^\d+$/.test(part)) {
            return parseInt(part, 10);
        }
    }

    return null;
}

function parseTimetable(buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const teacherSchedule = {};

    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        const teacher = sheetName;
        teacherSchedule[teacher] = {};

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];

            if (!row || row.length === 0) continue;

            const day = row[0];

            if (day === null || day === undefined || day === "") {
                continue;
            }

            teacherSchedule[teacher][day] = {};

            for (let periodIndex = 1; periodIndex <= 6; periodIndex++) {
                const cell = row[periodIndex];
                const year = extractYear(cell);
                teacherSchedule[teacher][day][periodIndex] = year;
            }
        }
    }

    return teacherSchedule;
}

// -----------------------------
// CONFLICT CHECK (core)
// -----------------------------

/**
 * Returns true if the teacher has NO explicit different-year conflict.
 * A null/undefined period entry is treated as free (no conflict).
 * A same-year entry is also treated as free (teacher's students are in exam).
 */
function hasNoConflict(teacher, slot, teacherSchedule) {
    const day = slot.day;
    const examYear = slot.year;
    const periods = getOverlappingPeriods(slot.start, slot.end);
    const daySchedule = (teacherSchedule[teacher] && teacherSchedule[teacher][day]) || {};

    for (const periodId of periods) {
        const year = daySchedule[periodId];
        // explicit different-year → conflict
        if (year !== null && year !== undefined && year !== examYear) {
            return false;
        }
    }

    return true;
}

/**
 * Returns true if the teacher teaches the same year as the exam in any
 * overlapping period (used for the same-year bonus in scoring).
 */
function teacherTeachesSameYear(teacher, slot, teacherSchedule) {
    const day = slot.day;
    const examYear = slot.year;
    const periods = getOverlappingPeriods(slot.start, slot.end);
    const daySchedule = (teacherSchedule[teacher] && teacherSchedule[teacher][day]) || {};

    for (const periodId of periods) {
        const year = daySchedule[periodId];
        if (year === examYear) return true;
    }

    return false;
}

// -----------------------------
// WEIGHTED TEACHER SCORING
// -----------------------------

/**
 * Calculates a priority score for a teacher for a given slot.
 * Lower score = higher priority (assigned first).
 *
 * score = (totalLoad × 0.6) + (dayLoad × 2.0) - sameYearBonus
 *
 * @param {string} teacher
 * @param {object} slot
 * @param {object} teacherSchedule
 * @param {object} teacherLoad      - { teacherName: totalInvigilationCount }
 * @param {object} teacherDailyLoad - { teacherName: { date: dailyCount } }
 */
function computeScore(teacher, slot, teacherSchedule, teacherLoad, teacherDailyLoad) {
    const totalLoad = teacherLoad[teacher] || 0;
    const dayLoad = (teacherDailyLoad[teacher] && teacherDailyLoad[teacher][slot.date]) || 0;
    const sameYearBonus = teacherTeachesSameYear(teacher, slot, teacherSchedule) ? 1 : 0;

    return (totalLoad * 0.6) + (dayLoad * 2.0) - sameYearBonus;
}

// -----------------------------
// TIERED FALLBACK ASSIGNMENT
// -----------------------------

/**
 * Attempts to assign teachers to a single exam slot using a 3-tier fallback.
 *
 * Returns:
 *   { assigned: string[], warnings: string[], understaffed: boolean, shortage: number }
 */
function assignTeachersToSlot(slot, teachers, teacherSchedule, teacherLoad, teacherDailyLoad) {
    const required = slot.teachers_required;
    const warnings = [];

    // Helper: sort a teacher array by weighted score (ascending)
    const sortByScore = (arr) =>
        arr.slice().sort((a, b) =>
            computeScore(a, slot, teacherSchedule, teacherLoad, teacherDailyLoad) -
            computeScore(b, slot, teacherSchedule, teacherLoad, teacherDailyLoad)
        );

    // --- TIER 1: strict (conflict-free + daily limit) ---
    const tier1Pool = teachers.filter(t => {
        const dailyLoad = (teacherDailyLoad[t] && teacherDailyLoad[t][slot.date]) || 0;
        return hasNoConflict(t, slot, teacherSchedule) && dailyLoad < MAX_SLOTS_PER_DAY;
    });

    const tier1Sorted = sortByScore(tier1Pool);
    if (tier1Sorted.length >= required) {
        return { assigned: tier1Sorted.slice(0, required), warnings, understaffed: false, shortage: 0 };
    }

    // Carry forward tier-1 picks; try to fill remainder from tier 2
    const tier1Assigned = new Set(tier1Sorted.slice(0, tier1Sorted.length));

    // --- TIER 2: relax daily limit ---
    const tier2Pool = teachers.filter(t => {
        return !tier1Assigned.has(t) && hasNoConflict(t, slot, teacherSchedule);
        // No daily limit check
    });

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

    // --- TIER 3: relax conflict check (allow missing entries, keep explicit conflict exclusion) ---
    const tier2Set = new Set(tier2Combined);
    const tier3Pool = teachers.filter(t => {
        if (tier2Set.has(t)) return false;
        // Exclude only if there is an EXPLICIT different-year conflict;
        // teachers with no timetable entry for that day/period are included.
        return hasNoConflict(t, slot, teacherSchedule);
        // Note: hasNoConflict already treats undefined/null as free, so this
        // naturally includes teachers with no timetable entry for that period.
    });

    // Additionally include teachers who have NO timetable for that day at all
    const tier3PoolExtra = teachers.filter(t => {
        if (tier2Set.has(t)) return false;
        if (tier3Pool.includes(t)) return false;
        // Teachers with NO day entry at all → treat as free
        const daySchedule = teacherSchedule[t] && teacherSchedule[t][slot.day];
        return !daySchedule; // no day entry means no info → include
    });

    const tier3All = sortByScore([...tier3Pool, ...tier3PoolExtra]);
    const tier3Picks = [];
    for (const t of tier3All) {
        if (tier2Combined.length + tier3Picks.length >= required) break;
        tier3Picks.push(t);
        warnings.push(`${t} assigned with relaxed constraints on ${slot.date}`);
    }

    const tier3Combined = [...tier2Combined, ...tier3Picks];
    const finalAssigned = tier3Combined.slice(0, required);
    const shortage = required - finalAssigned.length;

    return {
        assigned: finalAssigned,
        warnings,
        understaffed: shortage > 0,
        shortage
    };
}

// -----------------------------
// COUNT CONFLICT-FREE TEACHERS (for scarcity ordering)
// -----------------------------

/**
 * Counts how many teachers pass the conflict check for a slot,
 * ignoring all load limits (used purely for ordering slots).
 */
function countEligibleTeachers(slot, teachers, teacherSchedule) {
    return teachers.filter(t => hasNoConflict(t, slot, teacherSchedule)).length;
}

// -----------------------------
// SCHEDULER (main)
// -----------------------------

function generateScheduleList(teacherSchedule, examSlots) {
    const teachers = Object.keys(teacherSchedule);
    const teacherLoad = {};
    const teacherDailyLoad = {};
    const warnings = [];

    // Initialize load counters
    for (const t of teachers) {
        teacherLoad[t] = 0;
        teacherDailyLoad[t] = {};
    }

    // --- STEP 1: Scarcity-first ordering ---
    // Attach original index so we can restore display order later
    const slotsWithIndex = examSlots.map((slot, idx) => ({ slot, originalIndex: idx }));

    // Count eligible teachers per slot (no load limit)
    const eligibilityCounts = slotsWithIndex.map(({ slot }) =>
        countEligibleTeachers(slot, teachers, teacherSchedule)
    );

    // Sort by ascending eligible count (fewest available → first)
    const sortedSlotsWithIndex = slotsWithIndex.slice().sort((a, b) => {
        const ia = slotsWithIndex.indexOf(a);
        const ib = slotsWithIndex.indexOf(b);
        return eligibilityCounts[ia] - eligibilityCounts[ib];
    });

    // --- STEP 2–3: Tiered assignment with weighted scoring ---
    const schedule = [];
    // slotResults[originalIndex] = { assigned, understaffed, shortage, slotName, date, warnings }
    const slotResults = new Array(examSlots.length).fill(null);

    for (const { slot, originalIndex } of sortedSlotsWithIndex) {
        const result = assignTeachersToSlot(
            slot, teachers, teacherSchedule, teacherLoad, teacherDailyLoad
        );

        // Record warnings
        for (const w of result.warnings) {
            warnings.push(w);
        }

        // Update load counters for assigned teachers
        for (const teacher of result.assigned) {
            schedule.push({
                teacher,
                date: slot.date,
                slot: slot.slot
            });

            teacherLoad[teacher] = (teacherLoad[teacher] || 0) + 1;

            if (!teacherDailyLoad[teacher][slot.date]) {
                teacherDailyLoad[teacher][slot.date] = 0;
            }
            teacherDailyLoad[teacher][slot.date] += 1;
        }

        slotResults[originalIndex] = {
            slotName: slot.slot,
            date: slot.date,
            required: slot.teachers_required,
            assigned: result.assigned.length,
            understaffed: result.understaffed,
            shortage: result.shortage
        };
    }

    // --- STEP 4: Build summary ---
    const understaffedSlots = slotResults.filter(r => r && r.understaffed).map(r => ({
        slotName: r.slotName,
        date: r.date,
        required: r.required,
        assigned: r.assigned,
        shortage: r.shortage
    }));

    const summary = {
        totalSlots: examSlots.length,
        fullyStaffed: examSlots.length - understaffedSlots.length,
        understaffedSlots,
        warnings
    };

    return { schedule, summary, slotResults };
}

// -----------------------------
// GENERATE OUTPUT EXCEL
// -----------------------------

function generateOutputExcel(schedule, teachers, examSlots, slotResults) {
    // examSlots are in their ORIGINAL order for column display
    const columns = examSlots.map(slot =>
        `${slot.date} ${slot.slot} (${slot.start}-${slot.end})`
    );

    // Build a set of understaffed column names for quick lookup
    const understaffedCols = new Set();
    if (slotResults) {
        examSlots.forEach((slot, idx) => {
            const r = slotResults[idx];
            if (r && r.understaffed) {
                understaffedCols.add(`${slot.date} ${slot.slot} (${slot.start}-${slot.end})`);
            }
        });
    }

    // Prepare rows for each teacher
    const dataRows = [];
    for (const teacherName of teachers) {
        const row = { Teacher: teacherName };
        for (const col of columns) {
            row[col] = "";
        }
        dataRows.push(row);
    }

    // Populate YES cells
    for (const scheduledSlot of schedule) {
        const slotInfo = examSlots.find(
            s => s.slot === scheduledSlot.slot && s.date === scheduledSlot.date
        );
        if (slotInfo) {
            const colName = `${slotInfo.date} ${slotInfo.slot} (${slotInfo.start}-${slotInfo.end})`;
            const row = dataRows.find(r => r.Teacher === scheduledSlot.teacher);
            if (row) {
                row[colName] = "YES";
            }
        }
    }

    // Create main worksheet
    const worksheet = xlsx.utils.json_to_sheet(dataRows);

    // Column widths
    const wscols = [{ wch: 25 }];
    for (let i = 0; i < columns.length; i++) wscols.push({ wch: 25 });
    worksheet['!cols'] = wscols;

    // Freeze panes
    if (!worksheet['!views']) worksheet['!views'] = [];
    worksheet['!views'].push({ state: 'frozen', xSplit: 1, ySplit: 1 });

    // --- STEP 5: Apply red header styling for understaffed slot columns ---
    // Row 0 is headers. Column 0 = "Teacher", columns 1..N = exam slots
    const headerRowIndex = 0; // 0-based row
    columns.forEach((col, colOffset) => {
        if (understaffedCols.has(col)) {
            // Cell address: column index = colOffset + 1 (because col 0 is Teacher)
            const cellAddress = xlsx.utils.encode_cell({ r: headerRowIndex, c: colOffset + 1 });
            if (worksheet[cellAddress]) {
                worksheet[cellAddress].s = {
                    fill: { patternType: 'solid', fgColor: { argb: 'FFFF0000' } },
                    font: { bold: true, color: { argb: 'FFFFFFFF' } },
                    alignment: { horizontal: 'center' }
                };
            }
        }
    });

    // Create workbook
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Invigilation Schedule");

    // --- Summary sheet ---
    if (slotResults) {
        const summaryData = slotResults
            .filter(r => r !== null)
            .map(r => ({
                'Slot Name': r.slotName,
                'Date': r.date,
                'Required': r.required,
                'Assigned': r.assigned,
                'Shortage': r.shortage
            }));

        if (summaryData.length === 0) {
            // At least one empty row so the sheet isn't blank
            summaryData.push({ 'Slot Name': '', 'Date': '', 'Required': 0, 'Assigned': 0, 'Shortage': 0 });
        }

        const summarySheet = xlsx.utils.json_to_sheet(summaryData);
        summarySheet['!cols'] = [
            { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
        ];

        // Style understaffed rows in summary sheet (shortage > 0)
        // Headers are row 0; data starts at row 1
        slotResults.forEach((r, idx) => {
            if (r && r.understaffed) {
                // Find which data row this corresponds to
                // slotResults order matches examSlots original order
                // summaryData order is the same (filtered nulls)
                const dataRowIndex = idx + 1; // +1 for header row
                const shortageColIndex = 4; // "Shortage" is the 5th column (0-based: 4)

                const shortageCell = xlsx.utils.encode_cell({ r: dataRowIndex, c: shortageColIndex });

                // Bold all cells in this row and red-fill the shortage cell
                for (let c = 0; c < 5; c++) {
                    const cellAddr = xlsx.utils.encode_cell({ r: dataRowIndex, c });
                    if (summarySheet[cellAddr]) {
                        summarySheet[cellAddr].s = {
                            font: { bold: true }
                        };
                    }
                }

                if (summarySheet[shortageCell]) {
                    summarySheet[shortageCell].s = {
                        fill: { patternType: 'solid', fgColor: { argb: 'FFFF0000' } },
                        font: { bold: true, color: { argb: 'FFFFFFFF' } }
                    };
                }
            }
        });

        xlsx.utils.book_append_sheet(workbook, summarySheet, "Summary");
    }

    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}


// -----------------------------
// CONTROLLER EXPORT
// -----------------------------

exports.generateSchedule = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No timetable Excel file uploaded." });
        }

        let examSlots = [];
        try {
            examSlots = JSON.parse(req.body.examSlots);
        } catch (e) {
            return res.status(400).json({ success: false, message: "Invalid format for examSlots. Must be valid JSON array." });
        }

        if (!Array.isArray(examSlots) || examSlots.length === 0) {
            return res.status(400).json({ success: false, message: "examSlots must be a non-empty array." });
        }

        // Validate max 3 slots per day
        const slotsPerDay = {};
        for (const slot of examSlots) {
            slotsPerDay[slot.date] = (slotsPerDay[slot.date] || 0) + 1;
            if (slotsPerDay[slot.date] > 3) {
                return res.status(400).json({
                    success: false,
                    message: `A maximum of 3 slots is allowed per day. Found more than 3 slots for date: ${slot.date}`
                });
            }
        }

        const fileBuffer = req.file.buffer;

        // Run logic
        const teacherSchedule = parseTimetable(fileBuffer);
        const { schedule, summary, slotResults } = generateScheduleList(teacherSchedule, examSlots);
        const teachers = Object.keys(teacherSchedule);

        const outputBuffer = generateOutputExcel(schedule, teachers, examSlots, slotResults);

        let downloadId = null;
        try {
            const newSchedule = new Schedule({
                examSlots: examSlots,
                assignedSchedule: schedule,
                teachersInvolved: teachers,
                fileData: {
                    data: outputBuffer,
                    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    filename: 'invigilation_schedule.xlsx'
                },
                inputFileData: {
                    data: fileBuffer,
                    contentType: req.file.mimetype,
                    filename: req.file.originalname
                }
            });
            const saved = await newSchedule.save();
            downloadId = saved._id;
        } catch (dbError) {
            console.error("Warning: Could not save schedule to database.", dbError.message);
            // Proceed — downloadId stays null; frontend will handle missing ID gracefully
        }

        // --- STEP 6: Return JSON response with summary ---
        return res.status(200).json({
            success: true,
            downloadId,
            summary
        });

    } catch (error) {
        console.error("Error generating schedule:", error);
        res.status(500).json({ success: false, message: "Failed to generate schedule.", error: error.message });
    }
};

exports.getSchedules = async (req, res) => {
    try {
        const schedules = await Schedule.find({})
            .select('-fileData.data -inputFileData.data')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, schedules });
    } catch (error) {
        console.error("Error fetching schedules:", error);
        res.status(500).json({ success: false, message: "Failed to fetch schedules.", error: error.message });
    }
};

exports.downloadSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query;

        const schedule = await Schedule.findById(id);

        if (!schedule) {
            return res.status(404).json({ success: false, message: "Schedule not found." });
        }

        let targetFile;
        if (type === 'input' && schedule.inputFileData && schedule.inputFileData.data) {
            targetFile = schedule.inputFileData;
        } else if (schedule.fileData && schedule.fileData.data) {
            targetFile = schedule.fileData;
        } else {
            return res.status(404).json({ success: false, message: "File data not found in this schedule." });
        }

        res.setHeader('Content-Disposition', `attachment; filename="${targetFile.filename || 'download.xlsx'}"`);
        res.setHeader('Content-Type', targetFile.contentType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(targetFile.data);

    } catch (error) {
        console.error("Error downloading schedule file:", error);
        res.status(500).json({ success: false, message: "Failed to download schedule.", error: error.message });
    }
};
