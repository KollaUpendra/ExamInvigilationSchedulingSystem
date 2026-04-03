const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
    createdAt: {
        type: Date,
        default: Date.now,
    },
    examSlots: [{
        date: String,
        day: String,
        slot: String,
        start: String,
        end: String,
        year: Number,
        teachers_required: Number
    }],
    assignedSchedule: [{
        teacher: String,
        date: String,
        slot: String
    }],
    teachersInvolved: [String],
    fileData: {
        // We will store the generated Excel buffer in MongoDB as a Buffer directly for small files, 
        // or just rely on the stored JSON to re-generate it if needed. 
        // Given the requirement "store the excel sheet in the user database", 
        // storing the binary BSON Buffer of the generated file is the most robust way to actually store the "sheet".
        data: Buffer,
        contentType: String,
        filename: String
    },
    inputFileData: {
        data: Buffer,
        contentType: String,
        filename: String
    }
});

module.exports = mongoose.model('Schedule', ScheduleSchema);
