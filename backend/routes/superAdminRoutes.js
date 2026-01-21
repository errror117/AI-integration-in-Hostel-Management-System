const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isSuperAdmin, logSuperAdminAction } = require('../middleware/superAdminAuth');
const {
    getAllOrganizations,
    getOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    getSystemStats,
    updateOrganizationStatus,
    getAllUsers
} = require('../controllers/superAdminController');

// All routes require authentication and super admin role
router.use(protect);
router.use(isSuperAdmin);

// System statistics
router.get('/stats', logSuperAdminAction('View System Stats'), getSystemStats);

// Organization management
router.route('/organizations')
    .get(logSuperAdminAction('List All Organizations'), getAllOrganizations)
    .post(logSuperAdminAction('Create Organization'), createOrganization);

router.route('/organizations/:id')
    .get(logSuperAdminAction('View Organization'), getOrganization)
    .put(logSuperAdminAction('Update Organization'), updateOrganization)
    .delete(logSuperAdminAction('Delete Organization'), deleteOrganization);

router.patch('/organizations/:id/status',
    logSuperAdminAction('Update Organization Status'),
    updateOrganizationStatus
);

// User management
router.get('/users', logSuperAdminAction('List All Users'), getAllUsers);

// Subscription management
const { getAllSubscriptions, updateSubscription } = require('../controllers/subscriptionController');
router.get('/subscriptions', logSuperAdminAction('List All Subscriptions'), getAllSubscriptions);
router.put('/subscriptions/:id', logSuperAdminAction('Update Subscription'), updateSubscription);

module.exports = router;
