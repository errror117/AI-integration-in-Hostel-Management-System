// Quick script to find Marwadi University credentials
require('dotenv').config();
const mongoose = require('mongoose');

async function findMarwadi() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('\n=== FINDING MARWADI UNIVERSITY ===\n');

    const Organization = require('./models/Organization');
    const User = require('./models/User');
    const Student = require('./models/Student');

    // Find Marwadi organizations
    const orgs = await Organization.find({ name: /marwadi/i }).select('name slug _id');

    for (const org of orgs) {
        console.log('📦 Organization:', org.name);
        console.log('   Slug:', org.slug);
        console.log('   ID:', org._id);

        // Find admins
        const admins = await User.find({
            organizationId: org._id,
            role: { $in: ['org_admin', 'admin'] }
        }).select('email role');

        console.log('   👔 Admins:');
        admins.forEach(a => console.log('      Email:', a.email, '| Password: admin123'));

        // Find students (limit 3)
        const students = await Student.find({ organizationId: org._id }).limit(3).select('email name');
        console.log('   👨‍🎓 Students (first 3):');
        students.forEach(s => console.log('      Email:', s.email, '| Password: student123'));

        console.log('');
    }

    await mongoose.connection.close();
    console.log('Done!');
}

findMarwadi().catch(console.error);
