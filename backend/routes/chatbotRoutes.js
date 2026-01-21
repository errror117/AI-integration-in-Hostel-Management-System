const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// Route: POST /api/chatbot/message
// Description: Main interaction endpoint
// Access: Public with optional authentication
router.post('/message', optionalAuth, chatbotController.processMessage);

// Route: GET /api/chatbot/logs
// Description: Get chat history for Admin
// Access: Admin Only (should add verifyAdmin middleware if available)
router.get('/logs', protect, chatbotController.getLogs);

// Route: GET /api/chatbot/stats
// Description: Get analytics for Admin Dashboard
router.get('/stats', protect, chatbotController.getStats);

// Route: POST /api/chatbot/feedback
// Description: Provide feedback on chatbot response
router.post('/feedback', protect, chatbotController.provideFeedback);

module.exports = router;
