// Quick diagnostic script to check database users
const mongoose = require('mongoose');
require('dotenv').config();

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const User = require('./backend/models/User');
        const Student = require('./backend/models/Student');

        // Check super admin
        const superAdmin = await User.findOne({ email: 'superadmin@hostelease.com' });
        console.log('\n📊 Super Admin Check:');
        console.log('  Exists:', !!superAdmin);
        if (superAdmin) {
            console.log('  Active:', superAdmin.isActive);
            console.log('  Role:', superAdmin.role);
        }

        // Check students
        const students = await Student.find().limit(3);
        console.log('\n📊 Student Count:', students.length);

        students.forEach((s, i) => {
            console.log(`\nStudent ${i + 1}:`);
            console.log('  Email:', s.email);
            console.log('  Name:', s.name);
            console.log('  User ID exists:', !!s.user);
        });

        await mongoose.disconnect();
        console.log('\n✅ Done');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkUsers();
