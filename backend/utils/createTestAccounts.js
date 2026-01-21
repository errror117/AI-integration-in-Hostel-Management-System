const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const Organization = require('../models/Organization');
const Hostel = require('../models/Hostel');

async function createTestAccounts() {
    try {
        console.log('🔐 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected!\n');

        // Get ABC Engineering College
        const abcOrg = await Organization.findOne({ slug: 'abc-eng' });

        if (!abcOrg) {
            console.log('❌ ABC Engineering College not found!');
            console.log('Please run the multi-tenancy test script first.');
            process.exit(1);
        }

        console.log(`✅ Found organization: ${abcOrg.name}`);
        console.log(`   ID: ${abcOrg._id}\n`);

        // ===== CLEANUP EXISTING ACCOUNTS =====
        console.log('🧹 Cleaning up existing test accounts...');
        await User.deleteMany({ email: { $in: ['admin@abc-eng.edu', 'student@abc-eng.edu'] } });
        await Admin.deleteMany({ email: 'admin@abc-eng.edu', organizationId: abcOrg._id });
        await Student.deleteMany({ email: 'student@abc-eng.edu', organizationId: abcOrg._id });
        console.log('✅ Cleanup complete\n');

        // Get or create hostel
        let hostel = await Hostel.findOne({ organizationId: abcOrg._id });

        if (!hostel) {
            hostel = await Hostel.create({
                name: 'ABC Main Hostel',
                location: 'Main Campus',
                rooms: 100,
                capacity: 400,
                vacant: 400,
                organizationId: abcOrg._id
            });
            console.log('✅ Created hostel\n');
        }

        const salt = await bcrypt.genSalt(10);

        // ===== CREATE ADMIN =====
        console.log('👔 Creating Admin Account...');

        const hashedAdminPassword = await bcrypt.hash('admin123', salt);

        const adminUser = await User.create({
            name: 'ABC Admin',
            email: 'admin@abc-eng.edu',
            password: hashedAdminPassword,
            role: 'org_admin',
            organizationId: abcOrg._id
        });

        const admin = await Admin.create({
            name: 'ABC Admin',
            email: 'admin@abc-eng.edu',
            father_name: 'Admin Father',
            contact: '+91-9876543210',
            address: 'Mumbai, Maharashtra',
            dob: new Date('1990-01-01'),
            cnic: '12345-1234567-1',
            organizationId: abcOrg._id,
            user: adminUser._id,
            hostel: hostel._id
        });

        console.log('✅ Admin created successfully!');

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👔 ADMIN CREDENTIALS:');
        console.log('   Email: admin@abc-eng.edu');
        console.log('   Password: admin123');
        console.log('   Organization: ABC Engineering College');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // ===== CREATE STUDENT =====
        console.log('👨‍🎓 Creating Student Account...');

        const hashedStudentPassword = await bcrypt.hash('student123', salt);

        const studentUser = await User.create({
            name: 'Test Student',
            email: 'student@abc-eng.edu',
            password: hashedStudentPassword,
            role: 'student',
            organizationId: abcOrg._id
        });

        const student = await Student.create({
            name: 'Test Student',
            email: 'student@abc-eng.edu',
            cms_id: 12345,
            room_no: 101,
            batch: 2024,
            dept: 'Computer Science',
            course: 'B.Tech',
            father_name: 'Student Father',
            contact: '+91-9999999999',
            address: 'Mumbai, Maharashtra',
            dob: new Date('2005-01-01'),
            cnic: '54321-7654321-1',
            hostel: hostel._id,
            organizationId: abcOrg._id,
            user: studentUser._id
        });

        console.log('✅ Student created successfully!');

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👨‍🎓 STUDENT CREDENTIALS:');
        console.log('   Email: student@abc-eng.edu');
        console.log('   Password: student123');
        console.log('   Organization: ABC Engineering College');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('✅ ALL TEST ACCOUNTS READY!\n');
        console.log('🎯 You can now login with:');
        console.log('   Admin:   admin@abc-eng.edu / admin123');
        console.log('   Student: student@abc-eng.edu / student123\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Connection closed\n');
        process.exit(0);
    }
}

createTestAccounts();
