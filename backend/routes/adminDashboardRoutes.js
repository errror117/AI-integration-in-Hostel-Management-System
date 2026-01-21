/**
 * Admin Dashboard Routes
 * Centralized view of all student submissions
 */

const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Protect all routes - admin only
router.use(protect);
router.use(adminOnly);

/**
 * GET /api/admin/dashboard/submissions
 * Get all student submissions (complaints, requests, suggestions)
 * Query params: filter, limit, sortBy, includeChat
 */
router.get('/submissions', adminDashboardController.getAllSubmissions);

/**
 * GET /api/admin/dashboard/:type/:id
 * Get detailed view of specific submission
 * type: complaint | leave_request | suggestion
 */
router.get('/:type/:id', adminDashboardController.getSubmissionDetails);

/**
 * PUT /api/admin/dashboard/:type/:id/status
 * Update submission status
 */
router.put('/:type/:id/status', adminDashboardController.updateSubmissionStatus);

module.exports = router;
