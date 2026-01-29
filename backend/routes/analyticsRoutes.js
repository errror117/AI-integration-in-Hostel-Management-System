/**
 * Analytics Routes
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { tenantMiddleware } = require('../middleware/tenantMiddleware');

// All analytics routes require tenant context
router.get('/predictions', tenantMiddleware, analyticsController.getPredictions);
router.get('/chatbot-stats', tenantMiddleware, analyticsController.getChatbotAnalytics);
router.get('/mess-predictions', tenantMiddleware, analyticsController.getMessPredictions);

// Protected routes with tenant context
router.get('/summary', tenantMiddleware, analyticsController.getSummary);
router.get('/chatbot', tenantMiddleware, analyticsController.getChatbotStats);
router.get('/complaints', tenantMiddleware, analyticsController.getComplaintAnalytics);
router.get('/mess-prediction', tenantMiddleware, analyticsController.getMessPrediction);
router.get('/expense-prediction', tenantMiddleware, analyticsController.getExpensePrediction);
router.get('/export', tenantMiddleware, analyticsController.exportReport);

module.exports = router;

