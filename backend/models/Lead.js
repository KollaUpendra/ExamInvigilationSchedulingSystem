/**
 * @file models/Lead.js
 * @description Mongoose model for storing leads/sign-ups captured
 * from the "Get Started" form on the landing page.
 *
 * Schema Fields:
 *  - name        {String}  Full name of the person signing up (required)
 *  - email       {String}  Email address — unique per lead (required)
 *  - institution {String}  College / University name (required)
 *  - createdAt   {Date}    Auto-timestamp of when the lead was captured
 */

const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email address',
            ],
        },
        institution: {
            type: String,
            required: [true, 'Institution name is required'],
            trim: true,
            maxlength: [200, 'Institution name cannot exceed 200 characters'],
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt automatically
    }
);

module.exports = mongoose.model('Lead', LeadSchema);
