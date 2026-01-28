// Quick script to get student login credentials
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function getStudents() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const User = require('./backend/models/User');

        // Get students (role: student, not isAdmin)
        const students = await User.find({
            role: 'student',
            isAdmin: false
        }).limit(5);

        console.log('📋 STUDENT LOGIN CREDENTIALS:\n');
        console.log('Default password for all students: student123\n');

        for (const user of students) {
            console.log(`Email: ${user.email}`);
            console.log(`Role: ${user.role}`);
            console.log(`Organization: ${user.organizationId}`);
            console.log('---');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

getStudents();
