const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/auth');
const {
    getCurrentSubscription,
    getAvailablePlans,
    upgradeSubscription,
    downgradeSubscription,
    cancelSubscription,
    reactivateSubscription,
    updateBillingInfo,
    getUsageStats,
    getSubscriptionHistory
} = require('../controllers/subscriptionController');

// Public routes
router.get('/plans', getAvailablePlans);

// Protected routes (require authentication)
router.use(protect);

// Current subscription info
router.get('/', getCurrentSubscription);

// Usage statistics
router.get('/usage', getUsageStats);

// Subscription history
router.get('/history', getSubscriptionHistory);

// Admin-only routes
router.use(adminOnly);

// Subscription management
router.post('/upgrade', upgradeSubscription);
router.post('/downgrade', downgradeSubscription);
router.post('/cancel', cancelSubscription);
router.post('/reactivate', reactivateSubscription);

// Billing
router.put('/billing', updateBillingInfo);

module.exports = router;
