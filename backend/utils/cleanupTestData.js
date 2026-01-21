/**
 * Cleanup Test Data Script
 * Removes all test organizations and related data
 * 
 * Usage: node backend/utils/cleanupTestData.js
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
const Suggestion = require('../models/Suggestion');
const Invoice = require('../models/Invoice');
const ChatLog = require('../models/ChatLog');
const ConversationState = require('../models/ConversationState');

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

async function cleanupTestData() {
    try {
        console.log('\n🧹 Starting Cleanup...\n');

        const testSlugs = ['abc-college', 'xyz-university'];
        const testEmails = [
            'admin@abc.edu',
            'admin@xyz.edu',
            'student1@abc.edu',
            'student1@xyz.edu',
            'contact@abc.edu',
            'contact@xyz.edu'
        ];

        // Find test organizations
        const testOrgs = await Organization.find({ slug: { $in: testSlugs } });
        const orgIds = testOrgs.map(org => org._id);

        console.log(`📋 Found ${testOrgs.length} test organizations`);

        if (orgIds.length === 0) {
            console.log('✅ No test data found. Database is clean!');
            return;
        }

        // Delete in correct order (to handle dependencies)
        console.log('\n🗑️  Deleting related data...');

        const results = await Promise.all([
            ConversationState.deleteMany({ organizationId: { $in: orgIds } }),
            ChatLog.deleteMany({ organizationId: { $in: orgIds } }),
            Complaint.deleteMany({ organizationId: { $in: orgIds } }),
            Suggestion.deleteMany({ organizationId: { $in: orgIds } }),
            Invoice.deleteMany({ organizationId: { $in: orgIds } }),
            Student.deleteMany({ organizationId: { $in: orgIds } }),
            Admin.deleteMany({ organizationId: { $in: orgIds } }),
            Hostel.deleteMany({ organizationId: { $in: orgIds } }),
            User.deleteMany({ organizationId: { $in: orgIds } }),
            Organization.deleteMany({ _id: { $in: orgIds } })
        ]);

        console.log(`✅ Deleted ${results[0].deletedCount} conversation states`);
        console.log(`✅ Deleted ${results[1].deletedCount} chat logs`);
        console.log(`✅ Deleted ${results[2].deletedCount} complaints`);
        console.log(`✅ Deleted ${results[3].deletedCount} suggestions`);
        console.log(`✅ Deleted ${results[4].deletedCount} invoices`);
        console.log(`✅ Deleted ${results[5].deletedCount} students`);
        console.log(`✅ Deleted ${results[6].deletedCount} admins`);
        console.log(`✅ Deleted ${results[7].deletedCount} hostels`);
        console.log(`✅ Deleted ${results[8].deletedCount} users`);
        console.log(`✅ Deleted ${results[9].deletedCount} organizations`);

        console.log('\n🎉 Cleanup Complete!');
        console.log('\n📝 Next Step:');
        console.log('   Run: node backend\\utils\\setupTestData.js\n');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        await mongoose.connection.close();
        console.log('📡 MongoDB connection closed');
    }
}

// Run cleanup
connectDB().then(() => {
    cleanupTestData();
});
