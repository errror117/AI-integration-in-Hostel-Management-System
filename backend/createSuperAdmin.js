/**
 * Script to create a Super Admin account
 * Run with: node createSuperAdmin.js
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

        // Define SuperAdmin schema
        const SuperAdminSchema = new mongoose.Schema({
            name: String,
            email: { type: String, unique: true },
            password: String,
            phone: String,
            role: { type: String, default: 'superadmin' },
            createdAt: { type: Date, default: Date.now }
        }, { collection: 'superadmins' });

        const SuperAdmin = mongoose.models.SuperAdmin || mongoose.model('SuperAdmin', SuperAdminSchema);

        // Super Admin credentials
        const superAdminData = {
            name: 'Super Admin',
            email: 'superadmin@hostelease.com',
            password: 'SuperAdmin@123',
            phone: '9999999999',
            role: 'superadmin'
        };

        // Check if already exists
        const existing = await SuperAdmin.findOne({ email: superAdminData.email });
        if (existing) {
            console.log('⚠️  Super Admin with this email already exists!');
            console.log('   Email:', existing.email);
            console.log('   Name:', existing.name);
            console.log('\n🔑 Try logging in with:');
            console.log('   Email: superadmin@hostelease.com');
            console.log('   Password: SuperAdmin@123');
        } else {
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(superAdminData.password, salt);

            // Create Super Admin
            const newSuperAdmin = new SuperAdmin({
                ...superAdminData,
                password: hashedPassword
            });

            await newSuperAdmin.save();

            console.log('═══════════════════════════════════════════════════════════════');
            console.log('            ✅ SUPER ADMIN CREATED SUCCESSFULLY!');
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('\n📋 Super Admin Details:');
            console.log('   Name:     Super Admin');
            console.log('   Email:    superadmin@hostelease.com');
            console.log('   Password: SuperAdmin@123');
            console.log('   Phone:    9999999999');
            console.log('\n🔐 LOGIN URL: https://hostelease-pikq.onrender.com/super-admin/login');
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
