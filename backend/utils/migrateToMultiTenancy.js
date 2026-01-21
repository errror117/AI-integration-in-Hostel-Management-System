/**
 * Migration Script: Convert Single-Tenant to Multi-Tenant
 * This script creates a default organization and migrates all existing data
 * 
 * Run with: node backend/utils/migrateToMultiTenancy.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Organization = require('../models/Organization');
const User = require('../models/User');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const Complaint = require('../models/Complaint');
const Suggestion = require('../models/Suggestion');
const MessOff = require('../models/MessOff');
const Attendance = require('../models/Attendance');
const Invoice = require('../models/Invoice');
const Request = require('../models/Request');
const ChatLog = require('../models/ChatLog');

async function migrateToMultiTenancy() {
    try {
        console.log('🚀 Starting Multi-Tenancy Migration...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Step 1: Check if default organization already exists
        let defaultOrg = await Organization.findOne({ slug: 'demo' });

        if (defaultOrg) {
            console.log('ℹ️  Default organization already exists:', defaultOrg.name);
            console.log('   Using existing organization ID:', defaultOrg._id, '\n');
        } else {
            // Step 2: Create default organization
            console.log('📝 Creating default organization...');
            defaultOrg = new Organization({
                name: 'Demo Organization',
                slug: 'demo',
                type: 'hostel',
                contact: {
                    email: 'admin@demo.hostelease.com',
                    phone: '+1234567890',
                    address: {
                        city: 'Demo City',
                        country: 'Demo Country'
                    }
                },
                subscription: {
                    plan: 'professional', // Give them professional plan initially
                    status: 'active',
                    startDate: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
                },
                limits: {
                    maxStudents: 1000,
                    maxAdmins: 10,
                    maxRooms: 500,
                    maxStorageMB: 5000
                },
                features: {
                    aiChatbot: true,
                    analytics: true,
                    customBranding: true,
                    exportData: true,
                    apiAccess: true
                },
                branding: {
                    primaryColor: '#4F46E5',
                    secondaryColor: '#10B981',
                    tagline: 'Your First Hostel on Hostel Ease'
                },
                isActive: true,
                isVerified: true,
                verifiedAt: new Date()
            });

            await defaultOrg.save();
            console.log('✅ Default organization created:', defaultOrg.name);
            console.log('   Organization ID:', defaultOrg._id);
            console.log('   Subdomain:', defaultOrg.fullSubdomain, '\n');
        }

        const orgId = defaultOrg._id;

        // Step 3: Migrate Users
        console.log('👥 Migrating users...');
        const usersWithoutOrg = await User.find({ organizationId: { $exists: false } });

        for (const user of usersWithoutOrg) {
            // Determine role based on isAdmin
            if (!user.role) {
                user.role = user.isAdmin ? 'org_admin' : 'student';
            }
            user.organizationId = orgId;
            await user.save();
        }
        console.log(`✅ Migrated ${usersWithoutOrg.length} users\n`);

        // Step 4: Migrate Students
        console.log('🎓 Migrating students...');
        const studentsResult = await Student.updateMany(
            { organizationId: { $exists: false } },
            { $set: { organizationId: orgId } }
        );
        console.log(`✅ Migrated ${studentsResult.modifiedCount} students\n`);

        // Step 5: Migrate Admins
        console.log('👔 Migrating admins...');
        const adminsResult = await Admin.updateMany(
            { organizationId: { $exists: false } },
            { $set: { organizationId: orgId } }
        );
        console.log(`✅ Migrated ${adminsResult.modifiedCount} admins\n`);

        // Step 6: Migrate Complaints
        console.log('📋 Migrating complaints...');
        const complaintsResult = await Complaint.updateMany(
            { organizationId: { $exists: false } },
            { $set: { organizationId: orgId } }
        );
        console.log(`✅ Migrated ${complaintsResult.modifiedCount} complaints\n`);

        // Step 7: Migrate Suggestions
        console.log('💡 Migrating suggestions...');
        const suggestionsResult = await Suggestion.updateMany(
            { organizationId: { $exists: false } },
            { $set: { organizationId: orgId } }
        );
        console.log(`✅ Migrated ${suggestionsResult.modifiedCount} suggestions\n`);

        // Step 8: Migrate Mess-Off Requests
        console.log('🍽️  Migrating mess-off requests...');
        const messOffResult = await MessOff.updateMany(
            { organizationId: { $exists: false } },
            { $set: { organizationId: orgId } }
        );
        console.log(`✅ Migrated ${messOffResult.modifiedCount} mess-off requests\n`);

        // Step 9: Migrate Attendance
        console.log('📊 Migrating attendance records...');
        const attendanceResult = await Attendance.updateMany(
            { organizationId: { $exists: false } },
            { $set: { organizationId: orgId } }
        );
        console.log(`✅ Migrated ${attendanceResult.modifiedCount} attendance records\n`);

        // Step 10: Migrate Invoices
        console.log('💰 Migrating invoices...');
        const invoicesResult = await Invoice.updateMany(
            { organizationId: { $exists: false } },
            { $set: { organizationId: orgId } }
        );
        console.log(`✅ Migrated ${invoicesResult.modifiedCount} invoices\n`);

        // Step 11: Migrate Leave/Permission Requests
        console.log('📝 Migrating requests...');
        const requestsResult = await Request.updateMany(
            { organizationId: { $exists: false } },
            { $set: { organizationId: orgId } }
        );
        console.log(`✅ Migrated ${requestsResult.modifiedCount} requests\n`);

        // Step 12: Migrate Chat Logs
        console.log('💬 Migrating chat logs...');
        const chatLogsResult = await ChatLog.updateMany(
            { organizationId: { $exists: false } },
            { $set: { organizationId: orgId } }
        );
        console.log(`✅ Migrated ${chatLogsResult.modifiedCount} chat logs\n`);

        // Step 13: Update organization usage stats
        console.log('📈 Updating organization usage statistics...');
        const studentCount = await Student.countDocuments({ organizationId: orgId });
        const adminCount = await Admin.countDocuments({ organizationId: orgId });

        defaultOrg.usage.studentCount = studentCount;
        defaultOrg.usage.adminCount = adminCount;
        await defaultOrg.save();

        console.log(`✅ Usage updated: ${studentCount} students, ${adminCount} admins\n`);

        // Summary
        console.log('='.repeat(60));
        console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(60));
        console.log('\n📊 Migration Summary:');
        console.log(`  Organization: ${defaultOrg.name}`);
        console.log(`  Slug: ${defaultOrg.slug}`);
        console.log(`  Subdomain: ${defaultOrg.fullSubdomain}`);
        console.log(`  Users: ${usersWithoutOrg.length}`);
        console.log(`  Students: ${studentsResult.modifiedCount}`);
        console.log(`  Admins: ${adminsResult.modifiedCount}`);
        console.log(`  Complaints: ${complaintsResult.modifiedCount}`);
        console.log(`  Suggestions: ${suggestionsResult.modifiedCount}`);
        console.log(`  Mess-Off: ${messOffResult.modifiedCount}`);
        console.log(`  Attendance: ${attendanceResult.modifiedCount}`);
        console.log(`  Invoices: ${invoicesResult.modifiedCount}`);
        console.log(`  Requests: ${requestsResult.modifiedCount}`);
        console.log(`  Chat Logs: ${chatLogsResult.modifiedCount}`);
        console.log('\n✅ All existing data has been migrated to multi-tenant structure!');
        console.log('💡 You can now start using the multi-tenant features.\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration Error:', error);
        process.exit(1);
    }
}

// Run migration
migrateToMultiTenancy();
