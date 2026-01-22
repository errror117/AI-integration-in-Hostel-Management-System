/**
 * Script to create a Super Admin in the User collection
 * Run with: node createSuperAdminUser.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const mongoURI = process.env.MONGO_URI;

async function createSuperAdmin() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB\n');

        // Define User schema (same as the model)
        const UserSchema = new mongoose.Schema({
            organizationId: mongoose.Schema.Types.ObjectId,
            email: { type: String, required: true, unique: true },
            password: { type: String, required: true },
            role: { type: String, enum: ['super_admin', 'org_admin', 'sub_admin', 'student'], default: 'student' },
            isAdmin: { type: Boolean, default: false },
            isActive: { type: Boolean, default: true },
            isVerified: { type: Boolean, default: true },
            lastLogin: Date,
            date: { type: Date, default: Date.now }
        }, { collection: 'users' });

        const User = mongoose.models.User || mongoose.model('User', UserSchema);

        // Super Admin credentials
        const superAdminEmail = 'superadmin@hostelease.com';
        const superAdminPassword = 'SuperAdmin@123';

        // Check if Super Admin already exists
        const existing = await User.findOne({ email: superAdminEmail });

        if (existing) {
            console.log('⚠️  Super Admin already exists in users collection!');
            console.log('   Email:', existing.email);
            console.log('   Role:', existing.role);
            console.log('\n🔑 Login Credentials:');
            console.log('   Email: superadmin@hostelease.com');
            console.log('   Password: SuperAdmin@123');
        } else {
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(superAdminPassword, salt);

            // Create Super Admin
            const newSuperAdmin = new User({
                email: superAdminEmail,
                password: hashedPassword,
                role: 'super_admin',
                isAdmin: true,
                isActive: true,
                isVerified: true
            });

            await newSuperAdmin.save();

            console.log('═══════════════════════════════════════════════════════════════');
            console.log('            ✅ SUPER ADMIN CREATED SUCCESSFULLY!');
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('\n📋 Super Admin Details:');
            console.log('   Email:    superadmin@hostelease.com');
            console.log('   Password: SuperAdmin@123');
            console.log('   Role:     super_admin');
            console.log('\n🔐 Login at: https://hostelease-pikq.onrender.com/auth/admin-login');
            console.log('\n⚠️  IMPORTANT: Change the password after first login!');
            console.log('═══════════════════════════════════════════════════════════════\n');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed.');
    }
}

createSuperAdmin();
