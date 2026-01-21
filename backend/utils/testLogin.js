const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const User = require('../models/User');
const Student = require('../models/Student');

async function testLogin() {
    try {
        console.log('🧪 Testing login credentials...\n');

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Test student email
        const testEmail = 'rahul.sharma20000@mu.edu';
        console.log(`📧 Looking for user with email: ${testEmail}`);

        // Find user
        const user = await User.findOne({ email: testEmail });

        if (!user) {
            console.log('❌ User not found in database!');
            console.log('\nLet me check if any users exist with @mu.edu:');
            const muUsers = await User.find({ email: /mu\.edu$/ }).limit(5);
            console.log(`Found ${muUsers.length} users:`);
            muUsers.forEach(u => console.log(`  - ${u.email} (Role: ${u.role})`));
        } else {
            console.log('✅ User found!');
            console.log(`   ID: ${user._id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   IsAdmin: ${user.isAdmin}`);
            console.log(`   IsActive: ${user.isActive}`);
            console.log(`   OrganizationID: ${user.organizationId}`);
            console.log(`   Password Hash: ${user.password.substring(0, 20)}...`);

            // Check if student record exists
            const student = await Student.findOne({ email: testEmail });
            if (student) {
                console.log('\n✅ Student record found!');
                console.log(`   Name: ${student.name}`);
                console.log(`   CMS ID: ${student.cms_id}`);
                console.log(`   Room: ${student.room_no}`);
            } else {
                console.log('\n❌ Student record NOT found!');
            }

            // Test password
            const bcrypt = require('bcryptjs');
            const isMatch = await bcrypt.compare('student123', user.password);
            console.log(`\n🔐 Password test (student123): ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Connection closed');
        process.exit(0);
    }
}

testLogin();
