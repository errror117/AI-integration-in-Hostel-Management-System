const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Create initial super admin (for setup only)
// @route   POST /api/auth/setup-superadmin
// @access  Public (should be disabled in production)
exports.createInitialSuperAdmin = async (req, res) => {
    console.log('🔐 Create Super Admin endpoint called');

    try {
        console.log('Checking for existing super admin...');

        // Check if any super admin exists
        const existingSuperAdmin = await User.findOne({ role: 'super_admin' }).maxTimeMS(5000);

        if (existingSuperAdmin) {
            console.log('⚠️  Super admin already exists');
            return res.status(400).json({
                success: false,
                message: 'Super admin already exists. This endpoint is disabled.',
                existing: {
                    email: existingSuperAdmin.email,
                    name: existingSuperAdmin.name
                }
            });
        }

        console.log('No super admin found, creating new one...');

        // Create super admin
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('SuperAdmin@123', salt);

        const superAdmin = await User.create({
            name: 'Super Admin',
            email: 'superadmin@hostelease.com',
            password: hashedPassword,
            role: 'super_admin',
            organizationId: null
        });

        console.log('✅ Super admin created successfully!');

        res.status(201).json({
            success: true,
            message: 'Super admin created successfully',
            credentials: {
                email: 'superadmin@hostelease.com',
                password: 'SuperAdmin@123',
                warning: 'Please change this password immediately!'
            },
            data: {
                id: superAdmin._id,
                name: superAdmin.name,
                email: superAdmin.email,
                role: superAdmin.role
            }
        });
    } catch (error) {
        console.error('❌ Error creating super admin:', error.message);
        console.error('Stack trace:', error.stack);

        res.status(500).json({
            success: false,
            message: 'Failed to create super admin',
            error: error.message,
            details: error.name === 'MongooseError' ? 'Database connection issue - check if MongoDB is connected' : error.message
        });
    }
};
