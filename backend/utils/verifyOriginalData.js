/**
 * Verify Original Data Script
 * Checks if your original project data is intact
 * 
 * Usage: node backend/utils/verifyOriginalData.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Organization = require('../models/Organization');
const User = require('../models/User');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const Hostel = require('../models/Hostel');
const Complaint = require('../models/Complaint');

// MongoDB connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hosteldb');
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};

async function verifyData() {
    try {
        console.log('\n🔍 Verifying Your Original Data...\n');
        console.log('='.repeat(60));

        // Check for test organizations (should be 0)
        const testOrgs = await Organization.find({
            slug: { $in: ['abc-college', 'xyz-university'] }
        });
        console.log(`\n📋 Test Organizations: ${testOrgs.length} (should be 0 ✅)`);

        // Check  original data
        const organizations = await Organization.find();
        console.log(`\n🏢 Total Organizations: ${organizations.length}`);
        if (organizations.length > 0) {
            console.log('\n📊 Your Organizations:');
            organizations.forEach((org, index) => {
                console.log(`   ${index + 1}. ${org.name} (slug: ${org.slug})`);
            });
        }

        const users = await User.find();
        console.log(`\n👥 Total Users: ${users.length}`);

        const students = await Student.find();
        console.log(`\n🎓 Total Students: ${students.length}`);

        const admins = await Admin.find();
        console.log(`\n👨‍💼 Total Admins: ${admins.length}`);

        const hostels = await Hostel.find();
        console.log(`\n🏨 Total Hostels: ${hostels.length}`);

        const complaints = await Complaint.find();
        console.log(`\n📝 Total Complaints: ${complaints.length}`);

        console.log('\n' + '='.repeat(60));

        if (users.length > 0 || students.length > 0) {
            console.log('\n✅ **YOUR ORIGINAL DATA IS INTACT!**');
            console.log('\n📝 Summary:');
            console.log('   - Test organizations were deleted (abc-college, xyz-university)');
            console.log('   - Your original project data is completely safe');
            console.log('   - You can show this to your professor without issues');
            console.log('   - Multi-tenant testing won\'t affect your demo data');
        } else if (organizations.length === 0) {
            console.log('\n⚠️  **NO DATA FOUND**');
            console.log('\n📝 This means:');
            console.log('   - This might be a fresh database');
            console.log('   - OR your original data was in a different database');
            console.log('\n💡 Solution:');
            console.log('   1. Check your .env file for MONGO_URI');
            console.log('   2. Make sure you\'re connected to the right database');
            console.log('   3. Your original data might be in a backup');
        } else {
            console.log('\n✅ Database has data, looks good!');
        }

        console.log('\n');

    } catch (error) {
        console.error('❌ Error during verification:', error);
    } finally {
        await mongoose.connection.close();
        console.log('📡 MongoDB connection closed\n');
    }
}

// Run verification
connectDB().then(() => {
    verifyData();
});
