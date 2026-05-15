const express = require('express');
const router = express.Router();
const multer = require('multer');
const { generateSchedule, getSchedules, downloadSchedule, deleteSchedule } = require('../controllers/scheduleController');

// Configure multer for memory storage
const storage = multer.memoryStorage();

/**
 * Only accept MIME types that correspond to Excel workbooks.
 * Browsers may send .xlsx as 'application/octet-stream' so that is also allowed.
 * The magic-byte check inside the controller is the authoritative second layer.
 */
const ALLOWED_MIME_TYPES = new Set([
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel',                                            // .xls
    'application/octet-stream',                                            // generic binary (some browsers)
]);

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
            cb(null, true);
        } else {
            const err = new Error('Only .xlsx or .xls Excel files are allowed.');
            err.code = 'INVALID_FILE_TYPE';
            err.status = 400;
            cb(err, false);
        }
    },
});

/**
 * @route POST /api/schedule/generate
 * @desc Takes a timetable Excel file and exam slots JSON, returns generated Excel schedule.
 */
router.post('/generate', upload.single('file'), generateSchedule);

/**
 * @route GET /api/schedule
 * @desc Gets all generated schedules without binary data
 */
router.get('/', getSchedules);

/**
 * @route GET /api/schedule/:id/download
 * @desc Download the generated schedule excel file (or input file if ?type=input)
 */
router.get('/:id/download', downloadSchedule);

/**
 * @route DELETE /api/schedule/:id
 * @desc Delete a schedule record from the database
 */
router.delete('/:id', deleteSchedule);

module.exports = router;
