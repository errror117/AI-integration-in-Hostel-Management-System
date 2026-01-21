const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/auth');
const {
    getBranding,
    updateBranding,
    getBrandingBySubdomain,
    resetBranding
} = require('../controllers/brandingController');

// Public route - get branding by subdomain
router.get('/public/:subdomain', getBrandingBySubdomain);

// Protected routes
router.use(protect);

// Get current organization branding
router.get('/', getBranding);

// Admin-only routes
router.use(adminOnly);

// Update branding
router.put('/', updateBranding);

// Reset to defaults
router.post('/reset', resetBranding);

module.exports = router;
