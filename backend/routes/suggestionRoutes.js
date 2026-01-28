const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { registerSuggestion, getbyhostel, getbystudent, updateSuggestion } = require('../controllers/suggestionController');
const { tenantMiddleware } = require('../middleware/tenantMiddleware');

// @route   Register api/suggestion
// @desc    Register suggestion
// @access  Private (requires auth for multi-tenancy)
router.post('/register',
    tenantMiddleware,
    [
        check('student', 'Student is required').not().isEmpty(),
        check('hostel', 'Hostel is required').not().isEmpty(),
        check('title', 'Title is required').not().isEmpty(),
        check('description', 'Description is required').not().isEmpty()
    ],
    registerSuggestion
);

// @route   GET api/suggestion
// @desc    Get all suggestions by hostel id
// @access  Private (requires auth for multi-tenancy)
router.post('/hostel',
    tenantMiddleware,
    [
        check('hostel', 'Hostel is required').not().isEmpty()
    ],
    getbyhostel
);

// @route   GET api/suggestion
// @desc    Get all suggestions by student id
// @access  Private (requires auth for multi-tenancy)
router.post('/student',
    tenantMiddleware,
    [
        check('student', 'Student is required').not().isEmpty()
    ],
    getbystudent
);

// @route Update api/suggestion
// @desc Update suggestion
// @access Private (requires auth for multi-tenancy)
router.post('/update',
    tenantMiddleware,
    [
        check('id', 'Id is required').not().isEmpty(),
        check('status', 'Status is required').not().isEmpty()
    ],
    updateSuggestion
);

module.exports = router;