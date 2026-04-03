/**
 * @file models/Schedule.js
 * @description Mongoose model for a generated invigilation schedule.
 *
 * Storage layout:
 *  - examSlots       — the input exam slot configuration (dates, times, year, etc.)
 *  - assignedSchedule — flat list of { teacher, date, slot } assignment entries
 *  - teachersInvolved — unique list of teacher names included in the run
 *  - fileData         — generated output Excel binary (BSON Buffer)
 *  - inputFileData    — original uploaded timetable Excel binary (BSON Buffer)
 *  - userId           — reserved for future per-user scoping via Google sub ID
 *
 * Indexes:
 *  - createdAt (desc) — fast descending sort for the history list
 *  - userId           — fast lookup when user-scoped filtering is added
 */

const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema(
    {
        /** Input exam slot definitions provided by the user at generation time. */
        examSlots: [
            {
                date: { type: String, required: true },
                day: { type: String, required: true },
                slot: { type: String, required: true },
                start: { type: String, required: true },
                end: { type: String, required: true },
                year: { type: Number, required: true, min: 1 },
                teachers_required: { type: Number, required: true, min: 1 },
            },
        ],

        /** Flat assignment list: one entry per (teacher, exam slot) pair. */
        assignedSchedule: [
            {
                teacher: { type: String, required: true },
                date: { type: String, required: true },
                slot: { type: String, required: true },
            },
        ],

        /** All teacher names present in the uploaded timetable for this run. */
        teachersInvolved: [{ type: String }],

        /** Generated output Excel file — stored as raw BSON Buffer. */
        fileData: {
            data: Buffer,
            contentType: { type: String, default: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
            filename: { type: String, default: 'invigilation_schedule.xlsx' },
        },

        /** Original uploaded timetable Excel — stored for re-download from history. */
        inputFileData: {
            data: Buffer,
            contentType: String,
            filename: String,
        },

        /**
         * Google OAuth sub ID of the user who generated this schedule.
         * Reserved — not enforced yet (no auth middleware on routes).
         * Add an auth guard to /api/schedule once user-scoping is needed.
         */
        userId: { type: String, index: true, default: null },
    },
    {
        /**
         * Automatically adds createdAt and updatedAt.
         * We index createdAt separately below for the sorted history query.
         */
        timestamps: true,
    }
);

/** Index for fast descending sort on the history list endpoint. */
ScheduleSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Schedule', ScheduleSchema);
