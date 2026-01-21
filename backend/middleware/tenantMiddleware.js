/**
 * Tenant Middleware - Multi-tenancy Data Isolation
 * Ensures every request is scoped to the correct organization
 * CRITICAL: This is the security layer that prevents cross-organization data access
 */

const Organization = require('../models/Organization');
const { verifyToken } = require('../utils/auth');

/**
 * Extract and validate organization context
 * This middleware MUST be applied to all tenant-scoped routes
 */
const tenantMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                errors: [{ msg: 'No token, authorization denied' }]
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                errors: [{ msg: 'Invalid token' }]
            });
        }

        // Attach user info to request
        req.userId = decoded.userId;
        req.userRole = decoded.role || (decoded.isAdmin ? 'org_admin' : 'student');

        // Super admin can access all organizations
        if (req.userRole === 'super_admin') {
            // For super admin, organizationId can be specified in query/body
            // or left empty to access cross-organization data
            const orgId = req.query.organizationId || req.body.organizationId;
            if (orgId) {
                const org = await Organization.findById(orgId);
                if (!org) {
                    return res.status(404).json({
                        success: false,
                        errors: [{ msg: 'Organization not found' }]
                    });
                }
                req.organizationId = org._id;
                req.organization = org;
            }
            // If no orgId specified, super admin has global access
            return next();
        }

        // For regular users, organizationId MUST come from JWT token
        const organizationId = decoded.organizationId;

        if (!organizationId) {
            return res.status(403).json({
                success: false,
                errors: [{ msg: 'No organization associated with this account' }]
            });
        }

        // Fetch and validate organization
        const organization = await Organization.findById(organizationId);

        if (!organization) {
            return res.status(404).json({
                success: false,
                errors: [{ msg: 'Organization not found' }]
            });
        }

        // Check if organization is active
        if (!organization.isActive) {
            return res.status(403).json({
                success: false,
                errors: [{ msg: 'Organization account is inactive. Please contact support.' }]
            });
        }

        // Check subscription status
        if (!organization.isSubscriptionActive()) {
            // Check if trial expired
            if (organization.isTrialExpired()) {
                return res.status(402).json({
                    success: false,
                    errors: [{ msg: 'Trial period has expired. Please upgrade your subscription.' }],
                    trialExpired: true
                });
            }

            // Check if subscription is suspended or cancelled
            if (['suspended', 'cancelled', 'expired'].includes(organization.subscription.status)) {
                return res.status(402).json({
                    success: false,
                    errors: [{
                        msg: `Subscription is ${organization.subscription.status}. Please contact billing.`
                    }],
                    subscriptionStatus: organization.subscription.status
                });
            }
        }

        // Attach organization context to request
        req.organizationId = organization._id;
        req.organization = organization;

        next();
    } catch (error) {
        console.error('Tenant Middleware Error:', error);
        res.status(500).json({
            success: false,
            errors: [{ msg: 'Server error in tenant validation' }]
        });
    }
};

/**
 * Feature Gate Middleware
 * Check if organization has access to specific features
 * Usage: router.post('/export', tenantMiddleware, featureGate('exportData'), handler)
 */
const featureGate = (featureName) => {
    return (req, res, next) => {
        // Super admin bypasses feature gates
        if (req.userRole === 'super_admin') {
            return next();
        }

        if (!req.organization) {
            return res.status(403).json({
                success: false,
                errors: [{ msg: 'Organization context not found' }]
            });
        }

        // Check if organization has the feature
        if (!req.organization.hasFeature(featureName)) {
            return res.status(403).json({
                success: false,
                errors: [{
                    msg: `This feature is not available on your current plan.`,
                    feature: featureName,
                    currentPlan: req.organization.subscription.plan,
                    upgradeRequired: true
                }]
            });
        }

        next();
    };
};

/**
 * Usage Limit Middleware
 * Check if organization has reached usage limits
 * Usage: router.post('/students', tenantMiddleware, checkLimit('students'), handler)
 */
const checkLimit = (resourceType) => {
    return (req, res, next) => {
        // Super admin bypasses limits
        if (req.userRole === 'super_admin') {
            return next();
        }

        if (!req.organization) {
            return res.status(403).json({
                success: false,
                errors: [{ msg: 'Organization context not found' }]
            });
        }

        const org = req.organization;

        switch (resourceType) {
            case 'students':
                if (!org.canAddStudents()) {
                    return res.status(403).json({
                        success: false,
                        errors: [{
                            msg: `Student limit reached (${org.limits.maxStudents}). Please upgrade your plan.`,
                            limitType: 'students',
                            currentCount: org.usage.studentCount,
                            maxAllowed: org.limits.maxStudents,
                            upgradeRequired: true
                        }]
                    });
                }
                break;

            case 'admins':
                if (!org.canAddAdmins()) {
                    return res.status(403).json({
                        success: false,
                        errors: [{
                            msg: `Admin limit reached (${org.limits.maxAdmins}). Please upgrade your plan.`,
                            limitType: 'admins',
                            currentCount: org.usage.adminCount,
                            maxAllowed: org.limits.maxAdmins,
                            upgradeRequired: true
                        }]
                    });
                }
                break;

            case 'storage':
                const maxStorageMB = org.limits.maxStorageMB;
                if (maxStorageMB > 0 && org.usage.storageMB >= maxStorageMB) {
                    return res.status(403).json({
                        success: false,
                        errors: [{
                            msg: `Storage limit reached (${maxStorageMB}MB). Please upgrade your plan.`,
                            limitType: 'storage',
                            currentUsageMB: org.usage.storageMB,
                            maxAllowedMB: maxStorageMB,
                            upgradeRequired: true
                        }]
                    });
                }
                break;

            default:
                console.warn(`Unknown resource type for limit check: ${resourceType}`);
        }

        next();
    };
};

/**
 * Role-based Access Control Middleware
 * Check if user has required role
 * Usage: router.delete('/students/:id', tenantMiddleware, requireRole('org_admin'), handler)
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.userRole) {
            return res.status(403).json({
                success: false,
                errors: [{ msg: 'User role not found' }]
            });
        }

        // Super admin always has access
        if (req.userRole === 'super_admin') {
            return next();
        }

        if (!allowedRoles.includes(req.userRole)) {
            return res.status(403).json({
                success: false,
                errors: [{
                    msg: 'Insufficient permissions',
                    requiredRole: allowedRoles,
                    yourRole: req.userRole
                }]
            });
        }

        next();
    };
};

/**
 * Optional Tenant Middleware
 * For public routes that may have organization context but don't require it
 */
const optionalTenantMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(); // No auth, continue without tenant context
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (decoded && decoded.organizationId) {
            const organization = await Organization.findById(decoded.organizationId);
            if (organization && organization.isActive) {
                req.organizationId = organization._id;
                req.organization = organization;
                req.userId = decoded.userId;
                req.userRole = decoded.role;
            }
        }

        next();
    } catch (error) {
        // Don't block request on errors for optional middleware
        next();
    }
};

module.exports = {
    tenantMiddleware,
    featureGate,
    checkLimit,
    requireRole,
    optionalTenantMiddleware
};
