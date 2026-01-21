const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Organization = require('../models/Organization');

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get MU organization
        const muOrg = await Organization.findOne({ slug: 'mu' });
        if (!muOrg) {
            console.log('❌ MU organization not found!');
            process.exit(1);
        }

        console.log(`Found organization: ${muOrg.name} (${muOrg.slug})\n`);

        // Get users from MU organization
        const muUsers = await User.find({ organizationId: muOrg._id }).select('name email role').limit(5);

        console.log('=== MU ORGANIZATION USERS (First 5) ===');
        console.log('');
        muUsers.forEach((u, index) => {
            console.log(`${index + 1}. Email: ${u.email}`);
            console.log(`   Name: ${u.name}`);
            console.log(`   Role: ${u.role}`);
            console.log(`   Password: ${u.role === 'student' ? 'student123' : 'admin123'}`);
            console.log('');
        });

        // Also check if admin exists
        const adminUser = await User.findOne({ email: 'admin@mu.edu' });
        if (adminUser) {
            console.log('=== ADMIN USER ===');
            console.log(`Email: ${adminUser.email}`);
            console.log(`Name: ${adminUser.name}`);
            console.log(`Role: ${adminUser.role}`);
            console.log(`Password: admin123`);
        } else {
            console.log('⚠️  Admin user (admin@mu.edu) NOT found in database!');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkUsers();
