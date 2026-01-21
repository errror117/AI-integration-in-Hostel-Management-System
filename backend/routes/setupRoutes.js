// Simple route to create super admin using the existing server connection
// Add this temporarily to test

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// @route   GET /api/setup/create-superadmin
// @desc    Create super admin (simplified version)
// @access  Public (REMOVE IN PRODUCTION!)
router.get('/create-superadmin', async (req, res) => {
    try {
        console.log('🔐 Attempting to create super admin...');

        // Check if super admin exists
        const existing = await User.findOne({ role: 'super_admin' });

        if (existing) {
            return res.json({
                success: false,
                message: 'Super admin already exists!',
                email: existing.email
            });
        }

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

        res.json({
            success: true,
            message: 'Super admin created successfully! 🎉',
            credentials: {
                email: 'superadmin@hostelease.com',
                password: 'SuperAdmin@123'
            },
            data: {
                id: superAdmin._id,
                name: superAdmin.name,
                email: superAdmin.email,
                role: superAdmin.role
            }
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
