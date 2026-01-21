const mongoose = require('mongoose');
require('dotenv').config();

const Organization = require('../models/Organization');
const Student = require('../models/Student');
const Hostel = require('../models/Hostel');
const Complaint = require('../models/Complaint');
const Admin = require('../models/Admin');

async function checkStats() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const organizations = await Organization.find();

        console.log('\n📊 CURRENT DATABASE STATISTICS:\n');
        console.log('═'.repeat(70));

        for (const org of organizations) {
            const studentCount = await Student.countDocuments({ organizationId: org._id });
            const hostelCount = await Hostel.countDocuments({ organizationId: org._id });
            const complaintCount = await Complaint.countDocuments({ organizationId: org._id });
            const adminCount = await Admin.countDocuments({ organizationId: org._id });

            console.log(`\n🏢 ${org.name.toUpperCase()}`);
            console.log(`   Slug: ${org.slug}`);
            console.log(`   Plan: ${org.subscription.plan}`);
            console.log(`   ─────────────────────────`);
            console.log(`   👥 Students: ${studentCount}`);
            console.log(`   👔 Admins: ${adminCount}`);
            console.log(`   🏠 Hostels: ${hostelCount}`);
            console.log(`   📝 Complaints: ${complaintCount}`);
        }

        console.log('\n' + '═'.repeat(70));

        const totalStudents = await Student.countDocuments();
        const totalHostels = await Hostel.countDocuments();
        const totalComplaints = await Complaint.countDocuments();
        const totalAdmins = await Admin.countDocuments();

        console.log('\n🌍 SYSTEM-WIDE TOTALS:');
        console.log(`   Organizations: ${organizations.length}`);
        console.log(`   Total Students: ${totalStudents}`);
        console.log(`   Total Admins: ${totalAdmins}`);
        console.log(`   Total Hostels: ${totalHostels}`);
        console.log(`   Total Complaints: ${totalComplaints}`);
        console.log(`   Average Students/Org: ${Math.floor(totalStudents / organizations.length)}`);

        console.log('\n✅ DATABASE CHECK COMPLETE!\n');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

checkStats();
