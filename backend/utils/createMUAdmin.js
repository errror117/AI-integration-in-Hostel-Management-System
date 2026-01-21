const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const User = require('../models/User');
const Admin = require('../models/Admin');
const Organization = require('../models/Organization');

async function createMUAdmin() {
    try {
        console.log('👔 CREATING MU ADMIN\n');

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const muOrg = await Organization.findOne({ slug: 'mu' });
        if (!muOrg) {
            console.log('❌ MU organization not found!');
            process.exit(1);
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: 'admin@mu.edu', organizationId: muOrg._id });
        if (existingAdmin) {
            console.log('ℹ️  Admin already exists, checking user...');

            const adminUser = await User.findOne({ email: 'admin@mu.edu', organizationId: muOrg._id });
            if (adminUser) {
                console.log('✅ Admin and User both exist!\n');
                console.log('🔐 LOGIN CREDENTIALS:');
                console.log('   Email: admin@mu.edu');
                console.log('   Password: admin123\n');
            } else {
                console.log('⚠️  Admin exists but User is missing. Creating user...');
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('admin123', salt);

                const newUser = await User.create({
                    name: 'MU Admin',
                    email: 'admin@mu.edu',
                    password: hashedPassword,
                    role: 'org_admin',
                    organizationId: muOrg._id,
                    isActive: true,
                    isAdmin: true
                });

                existingAdmin.user = newUser._id;
                await existingAdmin.save();

                console.log('✅ User created and linked!\n');
            }
        } else {
            console.log('Creating new admin...\n');

            // Check if User already exists
            let adminUser = await User.findOne({ email: 'admin@mu.edu', organizationId: muOrg._id });

            if (!adminUser) {
                // Create User first
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('admin123', salt);

                adminUser = await User.create({
                    name: 'MU Admin',
                    email: 'admin@mu.edu',
                    password: hashedPassword,
                    role: 'org_admin',
                    organizationId: muOrg._id,
                    isActive: true,
                    isAdmin: true
                });

                console.log('✅ Admin User created');
            } else {
                console.log('✅ Admin User already exists');
            }

            // Create Admin record
            const admin = await Admin.create({
                name: 'MU Admin',
                email: 'admin@mu.edu',
                contact: '+91-22-2652-6526',
                father_name: 'Admin Father',
                address: 'Mumbai University, Kalina Campus, Mumbai, Maharashtra, India',
                dob: new Date('1980-01-01'),
                cnic: '12345-1234567-1',
                organizationId: muOrg._id,
                user: adminUser._id
            });

            console.log('✅ Admin record created\n');
        }

        // Final verification
        console.log('='.repeat(60));
        console.log('📊 VERIFICATION\n');

        const adminCount = await Admin.countDocuments({ organizationId: muOrg._id });
        const adminUserCount = await User.countDocuments({
            organizationId: muOrg._id,
            role: { $in: ['org_admin', 'sub_admin'] }
        });

        console.log(`Total Admin records: ${adminCount}`);
        console.log(`Total Admin users: ${adminUserCount}\n`);

        console.log('🔐 ADMIN LOGIN CREDENTIALS:');
        console.log('   Email: admin@mu.edu');
        console.log('   Password: admin123\n');

        console.log('✅ ADMIN SETUP COMPLETE!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Connection closed\n');
        process.exit(0);
    }
}

createMUAdmin();
