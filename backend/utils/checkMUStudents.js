const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const Student = require('../models/Student');
const Organization = require('../models/Organization');

async function checkMUStudents() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        // Find MU organization
        const muOrg = await Organization.findOne({ slug: 'mu' });
        if (!muOrg) {
            console.log('MU organization not found!');
            process.exit(1);
        }

        console.log(`Found MU Organization: ${muOrg.name}`);
        console.log(`Organization ID: ${muOrg._id}\n`);

        // Get first 10 students
        const students = await Student.find({ organizationId: muOrg._id })
            .sort({ cms_id: 1 })
            .limit(10);

        console.log(`Total MU students: ${await Student.countDocuments({ organizationId: muOrg._id })}`);
        console.log(`\nFirst 10 students:\n`);

        students.forEach((s, i) => {
            console.log(`${i + 1}. ${s.name}`);
            console.log(`   Email: ${s.email}`);
            console.log(`   CMS ID: ${s.cms_id}`);
            console.log(`   Room: ${s.room_no}\n`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

checkMUStudents();
