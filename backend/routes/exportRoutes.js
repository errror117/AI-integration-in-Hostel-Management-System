/**
 * Export Routes
 * CSV/Excel download endpoints
 */

const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');

// All export routes are public for easy download
router.get('/students', exportController.exportStudents);
router.get('/complaints', exportController.exportComplaints);
router.get('/invoices', exportController.exportInvoices);
router.get('/attendance', exportController.exportAttendance);
router.get('/suggestions', exportController.exportSuggestions);
router.get('/chatlogs', exportController.exportChatLogs);
router.get('/all', exportController.exportAll);

module.exports = router;
