/**
 * Notice Routes
 */

const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const { protect } = require('../middleware/authMiddleware');

// AI generation (protected)
router.post('/generate', protect, noticeController.generateNotice);

// CRUD operations
router.get('/', noticeController.getAllNotices);
router.get('/:id', noticeController.getNoticeById);
router.post('/', protect, noticeController.createNotice);
router.put('/:id', protect, noticeController.updateNotice);
router.delete('/:id', protect, noticeController.deleteNotice);

// Acknowledgment (students)
router.post('/:id/acknowledge', protect, noticeController.acknowledgeNotice);

module.exports = router;
