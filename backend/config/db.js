/**
 * @file config/db.js
 * @description MongoDB connection configuration using Mongoose.
 * Reads the MONGODB_URI from environment variables and establishes
 * a connection to the database. Logs success or failure to console.
 */

const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI defined in the .env file.
 *
 * serverSelectionTimeoutMS is set to 5 000 ms so that a failed or
 * unreachable Atlas cluster is reported within 5 s rather than the
 * Mongoose default of 30 s (which then surfaces as silent 10 s
 * buffering timeouts on every subsequent query).
 *
 * Common causes of connection failure:
 *  1. Your current IP is not whitelisted in Atlas → Network Access → Add IP
 *  2. The Atlas free-tier cluster is paused      → Dashboard → Resume
 *  3. MONGODB_URI in .env is wrong/stale         → Atlas → Connect → copy URI
 *  4. Outbound port 27017 blocked by firewall/VPN
 *
 * @async
 * @returns {Promise<void>}
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // Fail fast: surface Atlas unreachability in 5 s instead of 30 s
            serverSelectionTimeoutMS: 5_000,

            // ── TLS fix ──────────────────────────────────────────────────────
            // SSL alert 80 (TLSV1_ALERT_INTERNAL_ERROR / BoringSSL) means the
            // TLS handshake was rejected by Atlas before a cipher was agreed.
            // This happens when Node.js's OpenSSL build (or BoringSSL on some
            // Windows builds) cannot negotiate with Atlas's TLS 1.2+ stack.
            //
            // tls:true           — explicitly enable TLS (already implied by
            //                      mongodb+srv but set it explicitly for clarity)
            // tlsAllowInvalidCertificates:true — bypass the certificate chain
            //                      validation that triggers the handshake error
            //                      on certain Node/OpenSSL version combos.
            //
            // NOTE: In a production deployment with a properly trusted CA this
            // option should be removed and the system CA bundle used instead.
            tls: true,
            tlsAllowInvalidCertificates: true,
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        // Log dropped connections immediately so they are visible in the console
        // rather than appearing as silent buffering timeouts on the next query.
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB connection lost. Queries will buffer until reconnected.');
        });
        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected.');
        });

    } catch (error) {
        console.error(`❌ MongoDB connection error: ${error.message}`);
        console.warn('⚠️  Possible causes:');
        console.warn('    1. Your IP is not whitelisted in Atlas → Network Access → Add IP');
        console.warn('    2. The Atlas cluster is paused         → Dashboard → Resume');
        console.warn('    3. MONGODB_URI in .env is wrong/stale  → Atlas → Connect → copy URI');
        console.warn('    4. Outbound port 27017 blocked by firewall/VPN');
        console.warn('⚠️  Server will continue running, but all DB-dependent routes will fail.');
    }
};

module.exports = connectDB;
