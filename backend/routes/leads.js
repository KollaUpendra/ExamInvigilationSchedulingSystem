/**
 * @file routes/leads.js
 * @description Express router for /api/leads — landing-page lead capture.
 *
 * Routes:
 *  POST /api/leads  — Validates and saves a lead to MongoDB.
 *  GET  /api/leads  — Returns all leads (admin use only; protect in production).
 *
 * Error shape:  { success: false, code: 'ERROR_CODE', message: '...' }
 * Success shape: { success: true, message: '...', data: Lead } (POST)
 *               { success: true, count: N, data: Lead[] }     (GET)
 */

const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');

const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * @route   POST /api/leads
 * @desc    Save a new lead from the landing-page "Get Started" form.
 * @access  Public
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, institution } = req.body;

        // ── Field presence ─────────────────────────────────────────────────────
        if (!name || !email || !institution) {
            return res.status(400).json({
                success: false,
                code: 'MISSING_FIELDS',
                message: 'Please provide name, email, and institution.',
            });
        }

        // ── Basic format guards (belt-and-suspenders over Mongoose validation) ─
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(String(email).trim())) {
            return res.status(400).json({
                success: false,
                code: 'INVALID_EMAIL',
                message: 'Please provide a valid email address.',
            });
        }
        if (String(name).trim().length < 2) {
            return res.status(400).json({
                success: false,
                code: 'INVALID_NAME',
                message: 'Name must be at least 2 characters.',
            });
        }
        if (String(institution).trim().length < 2) {
            return res.status(400).json({
                success: false,
                code: 'INVALID_INSTITUTION',
                message: 'Institution name must be at least 2 characters.',
            });
        }

        const lead = await Lead.create({
            name: String(name).trim(),
            email: String(email).trim().toLowerCase(),
            institution: String(institution).trim(),
        });

        return res.status(201).json({
            success: true,
            message: "You're on the list! We'll be in touch soon.",
            data: lead,
        });

    } catch (error) {
        // Duplicate email (MongoDB duplicate-key error)
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                code: 'DUPLICATE_EMAIL',
                message: 'This email is already registered. We will reach out soon!',
            });
        }

        // Mongoose validation failure
        if (error.name === 'ValidationError') {
            const message = Object.values(error.errors).map((e) => e.message).join(', ');
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_ERROR',
                message,
            });
        }

        if (!IS_PROD) console.error('[leads] POST error:', error.stack);
        else console.error('[leads] POST error:', error.message);

        return res.status(500).json({
            success: false,
            code: 'INTERNAL_ERROR',
            message: 'Server error. Please try again later.',
        });
    }
});

/**
 * @route   GET /api/leads
 * @desc    Retrieve all leads — admin use only.
 * @access  Public (demo) — Add auth middleware before releasing to production.
 */
router.get('/', async (req, res) => {
    try {
        const leads = await Lead.find({}).sort({ createdAt: -1 }).lean();
        return res.status(200).json({ success: true, count: leads.length, data: leads });
    } catch (error) {
        if (!IS_PROD) console.error('[leads] GET error:', error.stack);
        else console.error('[leads] GET error:', error.message);
        return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'Server error.' });
    }
});

module.exports = router;
