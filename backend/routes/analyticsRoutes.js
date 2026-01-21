/**
 * Analytics Routes
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// Public routes for predictions (or add protect if needed)
router.get('/predictions', analyticsController.getPredictions);
router.get('/chatbot-stats', analyticsController.getChatbotAnalytics);
router.get('/mess-predictions', analyticsController.getMessPredictions);

// Protected routes
router.get('/summary', protect, analyticsController.getSummary);
router.get('/chatbot', protect, analyticsController.getChatbotStats);
router.get('/complaints', protect, analyticsController.getComplaintAnalytics);
router.get('/mess-prediction', protect, analyticsController.getMessPrediction);
router.get('/expense-prediction', protect, analyticsController.getExpensePrediction);
router.get('/export', protect, analyticsController.exportReport);

module.exports = router;
