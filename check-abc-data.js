// Check database for ABC Engineering organization data
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function checkOrgData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const User = require('./backend/models/User');
        const Organization = require('./backend/models/Organization');
        const Student = require('./backend/models/Student');
        const Complaint = require('./backend/models/Complaint');
        const Suggestion = require('./backend/models/Suggestion');

        // Find ABC Admin user
        const abcAdmin = await User.findOne({ email: 'admin@abc-eng.edu' });
        console.log('📊 ABC Admin User:');
        console.log('  Email:', abcAdmin?.email);
        console.log('  Role:', abcAdmin?.role);
        console.log('  OrganizationId:', abcAdmin?.organizationId);
        console.log('  Active:', abcAdmin?.isActive);

        if (!abcAdmin || !abcAdmin.organizationId) {
            console.log('\n❌ ABC Admin has no organizationId!');
            await mongoose.disconnect();
            return;
        }

        const orgId = abcAdmin.organizationId;

        // Check organization
        const org = await Organization.findById(orgId);
        console.log('\n📊 Organization:');
        console.log('  Name:', org?.name);
        console.log('  ID:', org?._id);
        console.log('  Active:', org?.isActive);

        // Check students
        const students = await Student.find({ organizationId: orgId });
        console.log('\n📊 Students for this org:', students.length);
        students.slice(0, 3).forEach((s, i) => {
            console.log(`  ${i + 1}. ${s.name} (${s.email})`);
        });

        // Check complaints
        const complaints = await Complaint.find({ organizationId: orgId });
        console.log('\n📊 Complaints for this org:', complaints.length);

        // Check suggestions
        const suggestions = await Suggestion.find({ organizationId: orgId });
        console.log('\n📊 Suggestions for this org:', suggestions.length);

        await mongoose.disconnect();
        console.log('\n✅ Done');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkOrgData();
