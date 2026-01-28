// Fetch ALL users and credentials from database
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function getAllCredentials() {
    try {
        const conn = await mongoose.createConnection(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 20000
        });

        console.log('✅ Connected to database\n');

        // Define schemas using the connection
        const UserSchema = new mongoose.Schema({}, { strict: false });
        const OrgSchema = new mongoose.Schema({}, { strict: false });
        const StudentSchema = new mongoose.Schema({}, { strict: false });
        const AdminSchema = new mongoose.Schema({}, { strict: false });

        const User = conn.model('User', UserSchema, 'users');
        const Organization = conn.model('Organization', OrgSchema, 'organizations');
        const Student = conn.model('Student', StudentSchema, 'students');
        const Admin = conn.model('Admin', AdminSchema, 'admins');

        // Get all organizations
        const orgs = await Organization.find({}).lean();
        console.log('📌 ORGANIZATIONS FOUND:', orgs.length);
        console.log('================================\n');

        for (const org of orgs) {
            console.log(`🏢 ${org.name || 'Unknown Org'}`);
            console.log(`   ID: ${org._id}`);
            console.log(`   Status: ${org.isActive ? 'Active' : 'Inactive'}`);
            console.log(`   Subscription: ${org.subscription?.status || 'Unknown'}`);
            console.log('');
        }

        // Get all users
        const users = await User.find({}).lean();
        console.log('📋 ALL USERS:');
        console.log('================================\n');

        for (const user of users) {
            const orgName = orgs.find(o => o._id.toString() === user.organizationId?.toString())?.name || 'Global';
            console.log(`👤 Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   IsAdmin: ${user.isAdmin}`);
            console.log(`   Org: ${orgName}`);
            console.log(`   Active: ${user.isActive !== false}`);
            console.log(`   Password: ${user.role === 'super_admin' ? 'SuperAdmin@123' : (user.isAdmin ? 'admin123' : 'student123')}`);
            console.log('---');
        }

        // Get all students
        const students = await Student.find({}).lean();
        console.log('\n🎓 ALL STUDENTS:');
        console.log('================================\n');

        for (const student of students) {
            const orgName = orgs.find(o => o._id.toString() === student.organizationId?.toString())?.name || 'Unknown';
            console.log(`👤 ${student.name}`);
            console.log(`   Email: ${student.email}`);
            console.log(`   CMS: ${student.cms_id}`);
            console.log(`   Org: ${orgName}`);
            console.log(`   Password: student123`);
            console.log('---');
        }

        // Get all admins
        const admins = await Admin.find({}).lean();
        console.log('\n👔 ALL ADMINS:');
        console.log('================================\n');

        for (const admin of admins) {
            const orgName = orgs.find(o => o._id.toString() === admin.organizationId?.toString())?.name || 'Unknown';
            console.log(`👤 ${admin.name}`);
            console.log(`   Email: ${admin.email}`);
            console.log(`   Org: ${orgName}`);
            console.log(`   Password: admin123`);
            console.log('---');
        }

        await conn.close();
        console.log('\n✅ Done - Copy these credentials!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

getAllCredentials();
