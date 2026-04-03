/**
 * @file routes/leads.js
 * @description Express router for the /api/leads endpoint.
 *
 * Routes:
 *  POST /api/leads  — Accepts a lead submission from the landing page
 *                     "Get Started" form and saves it to MongoDB.
 *
 * Request Body (JSON):
 *  { name: String, email: String, institution: String }
 *
 * Responses:
 *  201 { success: true, message: "...", data: Lead }  — Created
 *  400 { success: false, message: "..." }             — Validation error
 *  409 { success: false, message: "..." }             — Duplicate email
 *  500 { success: false, message: "..." }             — Server error
 */

const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');

/**
 * @route   POST /api/leads
 * @desc    Save a new lead captured from the landing page sign-up form
 * @access  Public
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, institution } = req.body;

        // Basic presence check (Mongoose will also validate types & formats)
        if (!name || !email || !institution) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and institution.',
            });
        }

        // Create and save the lead document
        const lead = await Lead.create({ name, email, institution });

        return res.status(201).json({
            success: true,
            message: "You're on the list! We'll be in touch soon.",
            data: lead,
        });
    } catch (error) {
        // Handle duplicate email (MongoDB error code 11000)
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'This email is already registered. We will reach out soon!',
            });
        }

        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', '),
            });
        }

        console.error('Lead creation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
});

/**
 * @route   GET /api/leads
 * @desc    Retrieve all leads (admin use — protect in production)
 * @access  Public (demo) — Add auth middleware in production
 */
router.get('/', async (req, res) => {
    try {
        const leads = await Lead.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, count: leads.length, data: leads });
    } catch (error) {
        console.error('Fetch leads error:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;
