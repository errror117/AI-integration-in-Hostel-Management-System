const mongoose = require('mongoose');
const Organization = require('../models/Organization');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const Complaint = require('../models/Complaint');
const Hostel = require('../models/Hostel');

require('dotenv').config();

async function quickCheck() {
    try {
        console.log('🔍 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('✅ Connected!\n');

        // Check organizations
        const orgs = await Organization.find().select('name subdomain subscriptionPlan');
        console.log(`📊 Organizations in database: ${orgs.length}`);
        orgs.forEach((org, i) => {
            console.log(`  ${i + 1}. ${org.name} (${org.subdomain}) - ${org.subscriptionPlan}`);
        });

        // Check students with org
        const totalStudents = await Student.countDocuments();
        const studentsWithOrg = await Student.countDocuments({ organizationId: { $exists: true } });
        console.log(`\n👥 Students: ${totalStudents} total, ${studentsWithOrg} with organizationId`);

        // Check complaints with org
        const totalComplaints = await Complaint.countDocuments();
        const complaintsWithOrg = await Complaint.countDocuments({ organizationId: { $exists: true } });
        console.log(`📢 Complaints: ${totalComplaints} total, ${complaintsWithOrg} with organizationId`);

        // Check hostels
        const totalHostels = await Hostel.countDocuments();
        const hostelsWithOrg = await Hostel.countDocuments({ organizationId: { $exists: true } });
        console.log(`🏠 Hostels: ${totalHostels} total, ${hostelsWithOrg} with organizationId`);

        // Check admins
        const totalAdmins = await Admin.countDocuments();
        const adminsWithOrg = await Admin.countDocuments({ organizationId: { $exists: true } });
        console.log(`👔 Admins: ${totalAdmins} total, ${adminsWithOrg} with organizationId`);

        console.log('\n✅ Quick check complete!');

        if (orgs.length === 0) {
            console.log('\n⚠️  No organizations found. You may need to create one for multi-tenancy testing.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 Tip: Make sure MongoDB is running');
        } else if (error.message.includes('authentication')) {
            console.log('\n💡 Tip: Check your MongoDB credentials in .env');
        } else if (error.message.includes('timed out')) {
            console.log('\n💡 Tip: Check if your IP is whitelisted in MongoDB Atlas');
            console.log('   Go to: MongoDB Atlas → Network Access → Add IP Address');
        }
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

quickCheck();
