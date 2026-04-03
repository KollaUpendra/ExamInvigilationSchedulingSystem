/**
 * @file config/db.js
 * @description MongoDB connection configuration using Mongoose.
 * Reads the MONGODB_URI from environment variables and establishes
 * a connection to the database. Logs success or failure to console.
 */

const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI defined in the .env file.
 * @async
 * @returns {Promise<void>}
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB connection error: ${error.message}`);
        console.warn(`⚠️ Server will continue running, but DB-dependent routes will fail.`);
        // process.exit(1); // Exit with failure if DB cannot connect
    }
};

module.exports = connectDB;
