// Get student credentials from database
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function getStudentCreds() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const Student = require('./backend/models/Student');
        const User = require('./backend/models/User');

        // Get a few students with their user credentials
        const students = await Student.find().limit(5).populate('user');

        console.log('📋 STUDENT LOGIN CREDENTIALS:\n');

        for (const student of students) {
            // Find corresponding user
            const user = await User.findById(student.user);

            if (user) {
                console.log(`Name: ${student.name}`);
                console.log(`Email: ${user.email}`);
                console.log(`Password: student123 (default password)`);
                console.log(`CMS ID: ${student.cms_id}`);
                console.log(`Room: ${student.room_no}`);
                console.log(`Organization: ${student.organizationId}`);
                console.log('---');
            }
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

getStudentCreds();
