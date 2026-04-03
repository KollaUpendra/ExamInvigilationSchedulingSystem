/**
 * @file server.js
 * @description Main entry point for the Exam Invigilation Scheduling System backend.
 *
 * Responsibilities:
 *  1. Load environment variables from .env
 *  2. Connect to MongoDB via Mongoose
 *  3. Configure Express middleware (JSON parsing, CORS)
 *  4. Register API routes
 *  5. Start the HTTP server on the configured PORT
 *
 * Environment Variables (see .env.example):
 *  - PORT          : HTTP port (default 5000)
 *  - MONGODB_URI   : Full MongoDB connection string
 *  - FRONTEND_URL  : Allowed origin for CORS (e.g. http://localhost:5173)
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// ─── Load environment variables ──────────────────────────────────────────────
dotenv.config();

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
connectDB();

// ─── Initialize Express ───────────────────────────────────────────────────────
const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * CORS Configuration:
 * Allows requests only from the configured FRONTEND_URL.
 * Falls back to localhost:5173 for local development.
 */
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type'],
    })
);

// Parse incoming JSON request bodies
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * Health-check endpoint — used to verify the server is running.
 * GET /api/health → { status: "ok", timestamp: "..." }
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Leads API — handles landing-page "Get Started" form submissions.
 * POST /api/leads  — create a new lead
 * GET  /api/leads  — retrieve all leads (admin)
 */
app.use('/api/leads', require('./routes/leads'));

/**
 * Schedule Generator API 
 * POST /api/schedule/generate - Takes timetable excel and returns matching schedule excel
 */
app.use('/api/schedule', require('./routes/schedule'));

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack);
    res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(`   CORS Origin : ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
