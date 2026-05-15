/**
 * @file server.js
 * @description Express entry point for the Exam Invigilation Scheduling System backend.
 *
 * Responsibilities:
 *  1. Load environment variables
 *  2. Connect to MongoDB
 *  3. Configure middleware (CORS, JSON parsing, file size limits)
 *  4. Mount API routes
 *  5. Global 404 + error handlers (no stack traces in production)
 *  6. Start HTTP server
 *
 * Environment variables (see .env.example):
 *  PORT          — HTTP port (default 5000)
 *  MONGODB_URI   — Full MongoDB connection string
 *  FRONTEND_URL  — Allowed CORS origin (e.g. http://localhost:5173)
 *  NODE_ENV      — 'development' | 'production'
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// ── Load environment variables ────────────────────────────────────────────────
dotenv.config();

const IS_PROD = process.env.NODE_ENV === 'production';

// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ── Initialize Express ────────────────────────────────────────────────────────
const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────

/**
 * CORS — allow requests only from the configured frontend origin.
 * Falls back to localhost:5173 for local development.
 */
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

/**
 * JSON body parser — 1 MB cap prevents OOM from oversized payloads.
 * The SyntaxError thrown by malformed JSON is caught by the global
 * error handler below and returned as a structured 400.
 */
app.use(express.json({ limit: '1mb' }));

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * Health-check — used by deployment platforms to verify liveness.
 * GET /api/health → { status: "ok", timestamp: "..." }
 */
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Leads API — landing-page "Get Started" form submissions.
 * POST /api/leads  — create lead
 * GET  /api/leads  — list all leads (admin)
 */
app.use('/api/leads', require('./routes/leads'));

/**
 * Schedule API
 * POST   /api/schedule/generate      — generate a new schedule
 * GET    /api/schedule               — list past schedules
 * GET    /api/schedule/:id/download  — download Excel output
 * DELETE /api/schedule/:id           — delete a schedule record
 */
app.use('/api/schedule', require('./routes/schedule'));

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.originalUrl} not found.`,
    });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
/**
 * Catches all errors forwarded via next(err), including:
 *  - SyntaxError from malformed JSON bodies (express.json)
 *  - Multer file-size errors
 *  - Any unhandled controller errors
 *
 * Stack traces are NEVER sent to clients in production.
 */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
    // Malformed JSON body
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            code: 'INVALID_JSON',
            message: 'Request body contains malformed JSON.',
        });
    }

    // Multer file-too-large
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            success: false,
            code: 'FILE_TOO_LARGE',
            message: 'Uploaded file exceeds the 10 MB size limit.',
        });
    }

    // Multer / fileFilter — wrong MIME type
    if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
            success: false,
            code: 'INVALID_FILE_TYPE',
            message: err.message || 'Only .xlsx or .xls Excel files are allowed.',
        });
    }

    // Generic server error — only log full details server-side
    if (!IS_PROD) {
        console.error('[Error]', err.stack || err);
    } else {
        console.error('[Error]', err.message);
    }

    res.status(err.status || 500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: IS_PROD
            ? 'An internal server error occurred. Please try again later.'
            : (err.message || 'Internal server error.'),
    });
});

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    console.log(`CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
