const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { requestMessOff, countMessOff, listMessOff, updateMessOff } = require('../controllers/messoffController');
const { tenantMiddleware } = require('../middleware/tenantMiddleware');

// @route   request api/messoff/request
// @desc    Request for mess off
// @access  Private (requires auth for multi-tenancy)
router.post('/request',
    tenantMiddleware,
    [
        check('student', 'Student ID is required').not().isEmpty(),
        check('leaving_date', 'Leaving date is required').not().isEmpty(),
        check('return_date', 'Return date is required').not().isEmpty()
    ],
    requestMessOff
);

// @route   GET count of request api/messoff/count
// @desc    Get all mess off requests
// @access  Private
router.post('/count',
    tenantMiddleware,
    [
        check('student', 'Student ID is required').not().isEmpty()
    ],
    countMessOff
);

// @route   GET list of request api/messoff/list
// @desc    Get all mess off requests
// @access  Private (requires auth for multi-tenancy)
router.post('/list',
    tenantMiddleware,
    [
        check('hostel', 'Hostel is required').not().isEmpty()
    ],
    listMessOff
);

// @route   POST update request api/messoff/update
// @desc    Update mess off request
// @access  Private (requires auth for multi-tenancy)
router.post('/update',
    tenantMiddleware,
    [
        check('id', 'ID is required').not().isEmpty(),
        check('status', 'Status is required').not().isEmpty()
    ],
    updateMessOff
);

module.exports = router;