// Get ABC Engineering student credentials
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function getABCStudents() {
    try {
        // Close any existing connections first
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }

        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 10000
        });

        console.log('✅ Connected to database\n');

        const Student = require('./backend/models/Student');
        const User = require('./backend/models/User');
        const Organization = require('./backend/models/Organization');

        // First find ABC Engineering organization
        const abcAdmin = await User.findOne({ email: 'admin@abc-eng.edu' }).maxTimeMS(5000);

        if (!abcAdmin) {
            console.log('❌ ABC Admin not found');
            process.exit(1);
        }

        const orgId = abcAdmin.organizationId;
        console.log('🏢 ABC Engineering Org ID:', orgId);

        // Get organization name
        const org = await Organization.findById(orgId).maxTimeMS(5000);
        console.log('🏢 Organization:', org?.name || 'Unknown');
        console.log('📊 Subscription Status:', org?.subscription?.status);
        console.log('\n📋 STUDENT CREDENTIALS:\n');

        // Get students from this organization
        const students = await Student.find({ organizationId: orgId })
            .limit(5)
            .maxTimeMS(5000);

        if (students.length === 0) {
            console.log('⚠️  No students found for ABC Engineering');
            console.log('You may need to register students through the admin dashboard.\n');
        } else {
            console.log('Default Password for all students: student123\n');

            for (const student of students) {
                console.log(`👤 ${student.name}`);
                console.log(`   Email: ${student.email}`);
                console.log(`   CMS ID: ${student.cms_id}`);
                console.log(`   Room: ${student.room_no}`);
                console.log(`   Course: ${student.course}`);
                console.log('---');
            }
        }

        await mongoose.disconnect();
        console.log('\n✅ Done');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n💡 Try accessing students through admin dashboard instead:');
        console.log('   1. Login at http://localhost:5173/auth/admin-login');
        console.log('   2. Email: admin@abc-eng.edu');
        console.log('   3. Password: admin123');
        console.log('   4. Go to "All Students" page');
        process.exit(1);
    }
}

getABCStudents();
