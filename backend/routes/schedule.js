const express = require('express');
const router = express.Router();
const multer = require('multer');
const { generateSchedule, getSchedules, downloadSchedule } = require('../controllers/scheduleController');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
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

module.exports = router;
