const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { markAttendance, getAttendance, updateAttendance, getHostelAttendance, markAllAttendance } = require('../controllers/attendanceController');

// @route   POST api/attendance/mark
// @desc    Mark attendance
// @access  Public
router.post('/mark', [
    check('student', 'Student is required').not().isEmpty(),
    check('status', 'Status is required').not().isEmpty()
], markAttendance);

// @route   POST api/attendance/markAll
// @desc    Mark all students attendance at once
// @access  Public
router.post('/markAll', [
    check('students', 'Students array is required').isArray(),
    check('status', 'Status is required').not().isEmpty()
], markAllAttendance);

// @route   GET api/attendance/get
// @desc    Get attendance
// @access  Public
router.post('/get', [
    check('student', 'Student is required').not().isEmpty()
], getAttendance);

// @route   PUT api/attendance/update
// @desc    Update attendance
// @access  Public
router.put('/update', [
    check('student', 'Student is required').not().isEmpty(),
    check('status', 'Status is required').not().isEmpty()
], updateAttendance);

// @route   GET api/attendance/getHostelAttendance
// @desc    Get hostel attendance
// @access  Public
router.post('/getHostelAttendance', [
    check('hostel', 'Hostel is required').not().isEmpty()
], getHostelAttendance);

module.exports = router;