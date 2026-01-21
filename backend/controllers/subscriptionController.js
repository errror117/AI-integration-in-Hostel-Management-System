const Subscription = require('../models/Subscription');
const Organization = require('../models/Organization');

// @desc    Get current subscription for organization
// @route   GET /api/subscription
// @access  Private (Admin)
exports.getCurrentSubscription = async (req, res) => {
    try {
        let subscription = await Subscription.findOne({
            organizationId: req.user.organizationId
        }).populate('organizationId', 'name slug');

        if (!subscription) {
            // Create default subscription if doesn't exist
            subscription = await Subscription.create({
                organizationId: req.user.organizationId,
                currentPlan: 'free',
                status: 'trial'
            });
        }

        res.json({
            success: true,
            data: subscription
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subscription',
            error: error.message
        });
    }
};

// @desc    Get all available plans
// @route   GET /api/subscription/plans
// @access  Public
exports.getAvailablePlans = async (req, res) => {
    try {
        const plans = {
            free: Subscription.getPlanPricing('free'),
            starter: Subscription.getPlanPricing('starter'),
            professional: Subscription.getPlanPricing('professional'),
            enterprise: Subscription.getPlanPricing('enterprise')
        };

        res.json({
            success: true,
            data: plans
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch plans',
            error: error.message
        });
    }
};

// @desc    Upgrade subscription
// @route   POST /api/subscription/upgrade
// @access  Private (Admin)
exports.upgradeSubscription = async (req, res) => {
    try {
        const { plan, billingCycle } = req.body;

        if (!['starter', 'professional', 'enterprise'].includes(plan)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan selected'
            });
        }

        let subscription = await Subscription.findOne({
            organizationId: req.user.organizationId
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        // Check if it's actually an upgrade
        const planHierarchy = { free: 0, starter: 1, professional: 2, enterprise: 3 };
        if (planHierarchy[plan] <= planHierarchy[subscription.currentPlan]) {
            return res.status(400).json({
                success: false,
                message: 'Please use downgrade endpoint for downgrades'
            });
        }

        await subscription.upgrade(plan, billingCycle);

        res.json({
            success: true,
            message: `Successfully upgraded to ${plan} plan`,
            data: subscription
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to upgrade subscription',
            error: error.message
        });
    }
};

// @desc    Downgrade subscription
// @route   POST /api/subscription/downgrade
// @access  Private (Admin)
exports.downgradeSubscription = async (req, res) => {
    try {
        const { plan } = req.body;

        let subscription = await Subscription.findOne({
            organizationId: req.user.organizationId
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        await subscription.downgrade(plan);

        res.json({
            success: true,
            message: `Downgrade to ${plan} scheduled for next billing cycle`,
            data: subscription
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to downgrade subscription',
            error: error.message
        });
    }
};

// @desc    Cancel subscription
// @route   POST /api/subscription/cancel
// @access  Private (Admin)
exports.cancelSubscription = async (req, res) => {
    try {
        const { immediately } = req.body;

        let subscription = await Subscription.findOne({
            organizationId: req.user.organizationId
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        await subscription.cancel(immediately);

        res.json({
            success: true,
            message: immediately
                ? 'Subscription cancelled immediately'
                : 'Subscription will cancel at the end of billing period',
            data: subscription
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to cancel subscription',
            error: error.message
        });
    }
};

// @desc    Reactivate cancelled subscription
// @route   POST /api/subscription/reactivate
// @access  Private (Admin)
exports.reactivateSubscription = async (req, res) => {
    try {
        let subscription = await Subscription.findOne({
            organizationId: req.user.organizationId
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        await subscription.reactivate();

        res.json({
            success: true,
            message: 'Subscription reactivated successfully',
            data: subscription
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to reactivate subscription',
            error: error.message
        });
    }
};

// @desc    Update billing information
// @route   PUT /api/subscription/billing
// @access  Private (Admin)
exports.updateBillingInfo = async (req, res) => {
    try {
        const { billingEmail, billingName, billingAddress } = req.body;

        let subscription = await Subscription.findOne({
            organizationId: req.user.organizationId
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        if (billingEmail) subscription.billingEmail = billingEmail;
        if (billingName) subscription.billingName = billingName;
        if (billingAddress) subscription.billingAddress = { ...subscription.billingAddress, ...billingAddress };

        await subscription.save();

        res.json({
            success: true,
            message: 'Billing information updated successfully',
            data: subscription
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update billing information',
            error: error.message
        });
    }
};

// @desc    Get usage statistics
// @route   GET /api/subscription/usage
// @access  Private (Admin)
exports.getUsageStats = async (req, res) => {
    try {
        const subscription = await Subscription.findOne({
            organizationId: req.user.organizationId
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        const Student = require('../models/Student');
        const Admin = require('../models/Admin');
        const Hostel = require('../models/Hostel');

        // Get actual counts
        const [studentCount, adminCount, hostelCount] = await Promise.all([
            Student.countDocuments({ organizationId: req.user.organizationId }),
            Admin.countDocuments({ organizationId: req.user.organizationId }),
            Hostel.countDocuments({ organizationId: req.user.organizationId })
        ]);

        // Update current usage
        subscription.currentUsage = {
            students: studentCount,
            admins: adminCount,
            rooms: hostelCount,
            storageMB: subscription.currentUsage.storageMB || 0
        };
        await subscription.save();

        // Calculate percentages
        const usage = {
            students: {
                current: studentCount,
                limit: subscription.limits.maxStudents,
                percentage: subscription.limits.maxStudents === -1 ? 0 : (studentCount / subscription.limits.maxStudents) * 100
            },
            admins: {
                current: adminCount,
                limit: subscription.limits.maxAdmins,
                percentage: subscription.limits.maxAdmins === -1 ? 0 : (adminCount / subscription.limits.maxAdmins) * 100
            },
            rooms: {
                current: hostelCount,
                limit: subscription.limits.maxRooms,
                percentage: subscription.limits.maxRooms === -1 ? 0 : (hostelCount / subscription.limits.maxRooms) * 100
            }
        };

        res.json({
            success: true,
            data: {
                usage,
                subscription: {
                    plan: subscription.currentPlan,
                    status: subscription.status,
                    limits: subscription.limits
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch usage statistics',
            error: error.message
        });
    }
};

// @desc    Get subscription history
// @route   GET /api/subscription/history
// @access  Private (Admin)
exports.getSubscriptionHistory = async (req, res) => {
    try {
        const subscription = await Subscription.findOne({
            organizationId: req.user.organizationId
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        res.json({
            success: true,
            data: subscription.history
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subscription history',
            error: error.message
        });
    }
};

// SUPER ADMIN ONLY ENDPOINTS

// @desc    Get all subscriptions (Super Admin)
// @route   GET /api/superadmin/subscriptions
// @access  Super Admin
exports.getAllSubscriptions = async (req, res) => {
    try {
        const subscriptions = await Subscription.find()
            .populate('organizationId', 'name slug contact')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: subscriptions.length,
            data: subscriptions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subscriptions',
            error: error.message
        });
    }
};

// @desc    Update subscription (Super Admin)
// @route   PUT /api/superadmin/subscriptions/:id
// @access  Super Admin
exports.updateSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        res.json({
            success: true,
            message: 'Subscription updated successfully',
            data: subscription
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update subscription',
            error: error.message
        });
    }
};

module.exports = exports;
