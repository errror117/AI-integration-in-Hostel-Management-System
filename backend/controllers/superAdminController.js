const Organization = require('../models/Organization');
const User = require('../models/User');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const Complaint = require('../models/Complaint');
const Hostel = require('../models/Hostel');

// @desc    Get all organizations (Super Admin only)
// @route   GET /api/superadmin/organizations
// @access  Super Admin
exports.getAllOrganizations = async (req, res) => {
    try {
        const organizations = await Organization.find()
            .sort({ createdAt: -1 })
            .select('-__v')
            .lean();

        if (organizations.length === 0) {
            return res.json({
                success: true,
                count: 0,
                data: []
            });
        }

        const orgIds = organizations.map(org => org._id);

        // OPTIMIZED: Use aggregation to get counts for all organizations at once
        // Instead of n*4 queries, we do 4 queries total
        const [studentCounts, adminCounts, hostelCounts, complaintCounts] = await Promise.all([
            Student.aggregate([
                { $match: { organizationId: { $in: orgIds } } },
                { $group: { _id: '$organizationId', count: { $sum: 1 } } }
            ]),
            Admin.aggregate([
                { $match: { organizationId: { $in: orgIds } } },
                { $group: { _id: '$organizationId', count: { $sum: 1 } } }
            ]),
            Hostel.aggregate([
                { $match: { organizationId: { $in: orgIds } } },
                { $group: { _id: '$organizationId', count: { $sum: 1 } } }
            ]),
            Complaint.aggregate([
                { $match: { organizationId: { $in: orgIds } } },
                { $group: { _id: '$organizationId', count: { $sum: 1 } } }
            ])
        ]);

        // Create lookup maps for O(1) access
        const countMaps = {
            students: new Map(studentCounts.map(c => [c._id.toString(), c.count])),
            admins: new Map(adminCounts.map(c => [c._id.toString(), c.count])),
            hostels: new Map(hostelCounts.map(c => [c._id.toString(), c.count])),
            complaints: new Map(complaintCounts.map(c => [c._id.toString(), c.count]))
        };

        // Attach stats to each organization (O(n) in-memory operation)
        const orgsWithStats = organizations.map(org => ({
            ...org,
            stats: {
                students: countMaps.students.get(org._id.toString()) || 0,
                admins: countMaps.admins.get(org._id.toString()) || 0,
                hostels: countMaps.hostels.get(org._id.toString()) || 0,
                complaints: countMaps.complaints.get(org._id.toString()) || 0
            }
        }));

        res.json({
            success: true,
            count: orgsWithStats.length,
            data: orgsWithStats
        });
    } catch (error) {
        console.error('Error fetching organizations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch organizations',
            error: error.message
        });
    }
};

// @desc    Get single organization details
// @route   GET /api/superadmin/organizations/:id
// @access  Super Admin
exports.getOrganization = async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id);

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        // Get detailed stats
        const [students, admins, hostels, complaints, recentComplaints] = await Promise.all([
            Student.find({ organizationId: organization._id }).select('name email roomNumber'),
            Admin.find({ organizationId: organization._id }).select('name email department'),
            Hostel.find({ organizationId: organization._id }).select('name type totalRooms occupiedRooms'),
            Complaint.countDocuments({ organizationId: organization._id }),
            Complaint.find({ organizationId: organization._id })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('studentId', 'name')
        ]);

        res.json({
            success: true,
            data: {
                organization,
                stats: {
                    students: students.length,
                    admins: admins.length,
                    hostels: hostels.length,
                    complaints
                },
                students,
                admins,
                hostels,
                recentComplaints
            }
        });
    } catch (error) {
        console.error('Error fetching organization:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch organization details',
            error: error.message
        });
    }
};

// @desc    Create new organization
// @route   POST /api/superadmin/organizations
// @access  Super Admin
exports.createOrganization = async (req, res) => {
    try {
        const {
            name,
            subdomain,
            email,
            phone,
            address,
            subscriptionPlan,
            subscriptionStatus,
            adminName, // Added
            adminPassword // Added
        } = req.body;

        // Convert subdomain to slug format
        const slug = (subdomain || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).toLowerCase();

        // Check if slug already exists
        const existingOrg = await Organization.findOne({ slug });
        if (existingOrg) {
            return res.status(400).json({
                success: false,
                message: 'Subdomain/slug already exists'
            });
        }

        // Check if email already exists
        const existingEmail = await Organization.findOne({ 'contact.email': email });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Get plan limits
        const plan = subscriptionPlan || 'free';
        const planLimits = Organization.getPlanLimits(plan);

        // Create organization
        const organization = await Organization.create({
            name,
            slug,
            contact: {
                email,
                phone: phone || '',
                address: {
                    street: address || '',
                    city: '',
                    state: '',
                    country: 'India',
                    zipCode: ''
                }
            },
            subscription: {
                plan,
                status: subscriptionStatus || 'trial'
            },
            limits: planLimits,
            features: planLimits.features || {
                aiChatbot: true,
                analytics: plan !== 'free',
                customBranding: plan === 'professional' || plan === 'enterprise',
                exportData: plan !== 'free',
                apiAccess: plan === 'professional' || plan === 'enterprise',
                whiteLabel: plan === 'enterprise'
            },
            usage: {
                adminCount: 1 // We will create one admin
            }
        });

        // --- Create Admin User ---
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        // Default password if not provided
        const passwordToHash = adminPassword || 'admin123';
        const hashedPassword = await bcrypt.hash(passwordToHash, salt);

        const adminUser = new User({
            name: adminName || 'Admin',
            email: email, // Use organization contact email for admin
            password: hashedPassword,
            organizationId: organization._id,
            role: 'org_admin',
            isAdmin: true,
            isActive: true,
            isVerified: true,
            verifiedAt: new Date()
        });

        await adminUser.save();

        // Create Admin Profile
        const adminProfile = new Admin({
            name: adminName || 'Admin',
            email: email,
            organizationId: organization._id,
            user: adminUser._id,
            contact: phone || '',
            address: address || '',
            hostel: null
        });

        await adminProfile.save();

        res.status(201).json({
            success: true,
            message: 'Organization and Admin created successfully',
            data: {
                organization,
                admin: {
                    email: adminUser.email,
                    password: passwordToHash // Return plain text once so SA knows (optional, verify security policy later)
                }
            }
        });
    } catch (error) {
        console.error('Error creating organization:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create organization',
            error: error.message
        });
    }
};

// @desc    Update organization
// @route   PUT /api/superadmin/organizations/:id
// @access  Super Admin
exports.updateOrganization = async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id);

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        // Update fields
        const allowedUpdates = [
            'name', 'email', 'phone', 'address',
            'subscriptionPlan', 'subscriptionStatus',
            'features', 'branding', 'limits'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                organization[field] = req.body[field];
            }
        });

        await organization.save();

        res.json({
            success: true,
            message: 'Organization updated successfully',
            data: organization
        });
    } catch (error) {
        console.error('Error updating organization:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update organization',
            error: error.message
        });
    }
};

// @desc    Delete/Suspend organization
// @route   DELETE /api/superadmin/organizations/:id
// @access  Super Admin
exports.deleteOrganization = async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id);

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        // Soft delete - just change status
        organization.subscription.status = 'cancelled';
        await organization.save();

        res.json({
            success: true,
            message: 'Organization suspended successfully',
            data: organization
        });
    } catch (error) {
        console.error('Error deleting organization:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to suspend organization',
            error: error.message
        });
    }
};

// @desc    Get system-wide statistics
// @route   GET /api/superadmin/stats
// @access  Super Admin
exports.getSystemStats = async (req, res) => {
    try {
        const [
            totalOrganizations,
            activeOrganizations,
            trialOrganizations,
            totalStudents,
            totalAdmins,
            totalComplaints,
            pendingComplaints,
            totalHostels
        ] = await Promise.all([
            Organization.countDocuments(),
            Organization.countDocuments({ 'subscription.status': 'active' }),
            Organization.countDocuments({ 'subscription.status': 'trial' }),
            Student.countDocuments(),
            Admin.countDocuments(),
            Complaint.countDocuments(),
            Complaint.countDocuments({ status: 'pending' }),
            Hostel.countDocuments()
        ]);

        // Get subscription breakdown - using correct nested field
        const subscriptionBreakdown = await Organization.aggregate([
            {
                $group: {
                    _id: '$subscription.plan',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get recent organizations
        const recentOrganizations = await Organization.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name slug subscription.plan subscription.status createdAt');

        // Get complaint stats by organization
        const complaintsByOrg = await Complaint.aggregate([
            {
                $group: {
                    _id: '$organizationId',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            success: true,
            data: {
                overview: {
                    totalOrganizations,
                    activeOrganizations,
                    trialOrganizations,
                    totalStudents,
                    totalAdmins,
                    totalComplaints,
                    pendingComplaints,
                    totalHostels
                },
                subscriptionBreakdown,
                recentOrganizations,
                topComplaintOrgs: complaintsByOrg
            }
        });
    } catch (error) {
        console.error('Error fetching system stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system statistics',
            error: error.message
        });
    }
};

// @desc    Activate/Suspend organization
// @route   PATCH /api/superadmin/organizations/:id/status
// @access  Super Admin
exports.updateOrganizationStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['active', 'suspended', 'trial', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const organization = await Organization.findByIdAndUpdate(
            req.params.id,
            { 'subscription.status': status },
            { new: true }
        );

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        res.json({
            success: true,
            message: `Organization ${status} successfully`,
            data: organization
        });
    } catch (error) {
        console.error('Error updating organization status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update organization status',
            error: error.message
        });
    }
};

// @desc    Get all users across organizations
// @route   GET /api/superadmin/users
// @access  Super Admin
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .populate('organizationId', 'name subdomain')
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
};
