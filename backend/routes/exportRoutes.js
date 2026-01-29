/**
 * Export Routes
 * CSV/Excel download endpoints - Requires authentication for organization context
 */

const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { tenantMiddleware } = require('../middleware/tenantMiddleware');

// All export routes require authentication to get organizationId
router.get('/students', tenantMiddleware, exportController.exportStudents);
router.get('/complaints', tenantMiddleware, exportController.exportComplaints);
router.get('/invoices', tenantMiddleware, exportController.exportInvoices);
router.get('/attendance', tenantMiddleware, exportController.exportAttendance);
router.get('/suggestions', tenantMiddleware, exportController.exportSuggestions);
router.get('/chatlogs', tenantMiddleware, exportController.exportChatLogs);
router.get('/all', tenantMiddleware, exportController.exportAll);

module.exports = router;
