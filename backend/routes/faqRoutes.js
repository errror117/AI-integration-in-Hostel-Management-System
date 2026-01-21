/**
 * FAQ Routes
 */

const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/', faqController.getAllFAQs);
router.get('/:id', faqController.getFAQById);

// Protected routes (admin only)
router.post('/', protect, faqController.createFAQ);
router.put('/:id', protect, faqController.updateFAQ);
router.delete('/:id', protect, faqController.deleteFAQ);
router.post('/bulk', protect, faqController.bulkUploadFAQs);
router.post('/regenerate-embeddings', protect, faqController.regenerateEmbeddings);

// Feedback route
router.post('/:id/feedback', faqController.feedbackFAQ);

module.exports = router;
