/**
 * Organization Controller
 * Handles organization management for Hostel Ease SaaS platform
 * Used by both super admins (manage all orgs) and org admins (manage their org)
 */

const Organization = require('../models/Organization');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const { generateToken } = require('../utils/auth');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

/**
 * Create new organization (Super Admin or Public Registration)
 * POST /api/organizations
 */
const createOrganization = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const {
            name,
            slug,
            type,
            contactEmail,
            contactPhone,
            address,
            plan = 'free',
            adminName,
            adminEmail,
            adminPassword
        } = req.body;

        // Check if slug is already taken
        const existingOrg = await Organization.findOne({ slug: slug.toLowerCase() });
        if (existingOrg) {
            return res.status(400).json({
                success: false,
                errors: [{ msg: 'This subdomain is already taken. Please choose another.' }]
            });
        }

        // Check if email is already used
        const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                errors: [{ msg: 'This email is already registered.' }]
            });
        }

        // Get plan limits
        const planLimits = Organization.getPlanLimits(plan);

        // Create organization
        const organization = new Organization({
            name,
            slug: slug.toLowerCase(),
            type: type || 'hostel',
            contact: {
                email: contactEmail,
                phone: contactPhone,
                address: address || {}
            },
            subscription: {
                plan,
                status: plan === 'free' ? 'trial' : 'active',
                trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
            },
            limits: {
                maxStudents: planLimits.maxStudents,
                maxAdmins: planLimits.maxAdmins,
                maxRooms: planLimits.maxRooms,
                maxStorageMB: planLimits.maxStorageMB
            },
            features: planLimits.features,
            isActive: true,
            createdBy: req.userId || null
        });

        await organization.save();

        // Create admin user for this organization
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        const adminUser = new User({
            email: adminEmail,
            password: hashedPassword,
            organizationId: organization._id,
            role: 'org_admin',
            isAdmin: true,
            isActive: true,
            isVerified: true,
            verifiedAt: new Date()
        });

        await adminUser.save();

        // Create admin profile
        const admin = new Admin({
            name: adminName,
            email: adminEmail,
            organizationId: organization._id,
            user: adminUser._id,
            contact: contactPhone || '',
            address: address?.street || '',
            hostel: null // Will be set when hostel is created
        });

        await admin.save();

        // Update organization usage
        organization.usage.adminCount = 1;
        await organization.save();

        // Generate token for auto-login
        const token = generateToken(
            adminUser._id,
            organization._id,
            'org_admin',
            true
        );

        res.status(201).json({
            success: true,
            message: 'Organization created successfully! Welcome to Hostel Ease.',
            organization: {
                id: organization._id,
                name: organization.name,
                slug: organization.slug,
                subdomain: organization.fullSubdomain,
                plan: organization.subscription.plan,
                trialEndsAt: organization.subscription.trialEndsAt
            },
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email
            },
            token
        });

    } catch (error) {
        console.error('Create Organization Error:', error);
        res.status(500).json({
            success: false,
            errors: [{ msg: 'Error creating organization' }]
        });
    }
};

/**
 * Get organization details
 * GET /api/organizations/:id or /api/organizations/current
 */
const getOrganization = async (req, res) => {
    try {
        let orgId;

        // If 'current', use organizationId from token
        if (req.params.id === 'current') {
            if (!req.organizationId) {
                return res.status(400).json({
                    success: false,
                    errors: [{ msg: 'No organization context found' }]
                });
            }
            orgId = req.organizationId;
        } else {
            // Super admin can view any organization
            if (req.userRole !== 'super_admin' && req.params.id !== req.organizationId?.toString()) {
                return res.status(403).json({
                    success: false,
                    errors: [{ msg: 'Access denied' }]
                });
            }
            orgId = req.params.id;
        }

        const organization = await Organization.findById(orgId);

        if (!organization) {
            return res.status(404).json({
                success: false,
                errors: [{ msg: 'Organization not found' }]
            });
        }

        res.json({
            success: true,
            organization
        });

    } catch (error) {
        console.error('Get Organization Error:', error);
        res.status(500).json({
            success: false,
            errors: [{ msg: 'Error fetching organization' }]
        });
    }
};

/**
 * Update organization details
 * PUT /api/organizations/:id
 */
const updateOrganization = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const orgId = req.params.id === 'current' ? req.organizationId : req.params.id;

        // Check permissions
        if (req.userRole !== 'super_admin' && orgId?.toString() !== req.organizationId?.toString()) {
            return res.status(403).json({
                success: false,
                errors: [{ msg: 'Access denied' }]
            });
        }

        const organization = await Organization.findById(orgId);

        if (!organization) {
            return res.status(404).json({
                success: false,
                errors: [{ msg: 'Organization not found' }]
            });
        }

        const {
            name,
            contactEmail,
            contactPhone,
            address,
            website,
            branding,
            settings
        } = req.body;

        // Update fields
        if (name) organization.name = name;
        if (contactEmail) organization.contact.email = contactEmail;
        if (contactPhone) organization.contact.phone = contactPhone;
        if (address) organization.contact.address = { ...organization.contact.address, ...address };
        if (website) organization.contact.website = website;
        if (branding) organization.branding = { ...organization.branding, ...branding };
        if (settings) organization.settings = { ...organization.settings, ...settings };

        organization.lastModifiedBy = req.userId;

        await organization.save();

        res.json({
            success: true,
            message: 'Organization updated successfully',
            organization
        });

    } catch (error) {
        console.error('Update Organization Error:', error);
        res.status(500).json({
            success: false,
            errors: [{ msg: 'Error updating organization' }]
        });
    }
};

/**
 * List all organizations (Super Admin only)
 * GET /api/organizations
 */
const listOrganizations = async (req, res) => {
    try {
        // Only super admin can list all organizations
        if (req.userRole !== 'super_admin') {
            return res.status(403).json({
                success: false,
                errors: [{ msg: 'Super admin access required' }]
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = {};

        // Filter by status
        if (req.query.status) {
            filter['subscription.status'] = req.query.status;
        }

        // Filter by plan
        if (req.query.plan) {
            filter['subscription.plan'] = req.query.plan;
        }

        // Filter by active status
        if (req.query.active !== undefined) {
            filter.isActive = req.query.active === 'true';
        }

        // Search by name or slug
        if (req.query.search) {
            filter.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { slug: { $regex: req.query.search, $options: 'i' } },
                { 'contact.email': { $regex: req.query.search, $options: 'i' } }
            ];
        }

        const organizations = await Organization.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-branding -settings'); // Exclude detailed fields for list view

        const total = await Organization.countDocuments(filter);

        res.json({
            success: true,
            organizations,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('List Organizations Error:', error);
        res.status(500).json({
            success: false,
            errors: [{ msg: 'Error fetching organizations' }]
        });
    }
};

/**
 * Get organization statistics
 * GET /api/organizations/:id/stats
 */
const getOrganizationStats = async (req, res) => {
    try {
        const orgId = req.params.id === 'current' ? req.organizationId : req.params.id;

        // Check permissions
        if (req.userRole !== 'super_admin' && orgId?.toString() !== req.organizationId?.toString()) {
            return res.status(403).json({
                success: false,
                errors: [{ msg: 'Access denied' }]
            });
        }

        const organization = await Organization.findById(orgId);

        if (!organization) {
            return res.status(404).json({
                success: false,
                errors: [{ msg: 'Organization not found' }]
            });
        }

        // Get counts from database
        const studentCount = await Student.countDocuments({ organizationId: orgId });
        const adminCount = await Admin.countDocuments({ organizationId: orgId });

        // Update organization usage if different
        if (organization.usage.studentCount !== studentCount ||
            organization.usage.adminCount !== adminCount) {
            organization.usage.studentCount = studentCount;
            organization.usage.adminCount = adminCount;
            await organization.save();
        }

        res.json({
            success: true,
            stats: {
                students: {
                    current: studentCount,
                    limit: organization.limits.maxStudents,
                    percentage: organization.limits.maxStudents > 0
                        ? (studentCount / organization.limits.maxStudents * 100).toFixed(1)
                        : 0
                },
                admins: {
                    current: adminCount,
                    limit: organization.limits.maxAdmins,
                    percentage: organization.limits.maxAdmins > 0
                        ? (adminCount / organization.limits.maxAdmins * 100).toFixed(1)
                        : 0
                },
                storage: {
                    currentMB: organization.usage.storageMB,
                    limitMB: organization.limits.maxStorageMB,
                    percentage: organization.limits.maxStorageMB > 0
                        ? (organization.usage.storageMB / organization.limits.maxStorageMB * 100).toFixed(1)
                        : 0
                },
                subscription: {
                    plan: organization.subscription.plan,
                    status: organization.subscription.status,
                    isTrialExpired: organization.isTrialExpired(),
                    isActive: organization.isSubscriptionActive(),
                    trialEndsAt: organization.subscription.trialEndsAt,
                    currentPeriodEnd: organization.subscription.currentPeriodEnd
                }
            }
        });

    } catch (error) {
        console.error('Get Organization Stats Error:', error);
        res.status(500).json({
            success: false,
            errors: [{ msg: 'Error fetching statistics' }]
        });
    }
};

/**
 * Suspend/Activate organization (Super Admin only)
 * PATCH /api/organizations/:id/status
 */
const updateOrganizationStatus = async (req, res) => {
    try {
        if (req.userRole !== 'super_admin') {
            return res.status(403).json({
                success: false,
                errors: [{ msg: 'Super admin access required' }]
            });
        }

        const { isActive, subscriptionStatus } = req.body;
        const organization = await Organization.findById(req.params.id);

        if (!organization) {
            return res.status(404).json({
                success: false,
                errors: [{ msg: 'Organization not found' }]
            });
        }

        if (isActive !== undefined) {
            organization.isActive = isActive;
        }

        if (subscriptionStatus) {
            organization.subscription.status = subscriptionStatus;
        }

        organization.lastModifiedBy = req.userId;
        await organization.save();

        res.json({
            success: true,
            message: `Organization ${isActive ? 'activated' : 'suspended'} successfully`,
            organization
        });

    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(500).json({
            success: false,
            errors: [{ msg: 'Error updating status' }]
        });
    }
};

/**
 * Delete organization (Soft delete - Super Admin only)
 * DELETE /api/organizations/:id
 */
const deleteOrganization = async (req, res) => {
    try {
        if (req.userRole !== 'super_admin') {
            return res.status(403).json({
                success: false,
                errors: [{ msg: 'Super admin access required' }]
            });
        }

        const organization = await Organization.findById(req.params.id);

        if (!organization) {
            return res.status(404).json({
                success: false,
                errors: [{ msg: 'Organization not found' }]
            });
        }

        // Soft delete
        organization.deletedAt = new Date();
        organization.isActive = false;
        organization.subscription.status = 'cancelled';
        await organization.save();

        res.json({
            success: true,
            message: 'Organization deleted successfully'
        });

    } catch (error) {
        console.error('Delete Organization Error:', error);
        res.status(500).json({
            success: false,
            errors: [{ msg: 'Error deleting organization' }]
        });
    }
};

module.exports = {
    createOrganization,
    getOrganization,
    updateOrganization,
    listOrganizations,
    getOrganizationStats,
    updateOrganizationStatus,
    deleteOrganization
};
