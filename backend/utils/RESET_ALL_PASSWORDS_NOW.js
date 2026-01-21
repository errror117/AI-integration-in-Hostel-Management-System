const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const User = require('../models/User');

async function resetAllPasswords() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected. Resetting ALL passwords...\n');

    const salt = await bcrypt.genSalt(10);

    // Reset ALL student passwords to student123
    const studentPassword = await bcrypt.hash('student123', salt);
    const studentsUpdated = await User.updateMany(
        { role: 'student' },
        { $set: { password: studentPassword } }
    );
    console.log(`✅ Reset ${studentsUpdated.modifiedCount} STUDENT passwords to: student123`);

    // Reset ALL admin passwords to admin123
    const adminPassword = await bcrypt.hash('admin123', salt);
    const adminsUpdated = await User.updateMany(
        { role: { $in: ['org_admin', 'sub_admin', 'super_admin'] } },
        { $set: { password: adminPassword } }
    );
    console.log(`✅ Reset ${adminsUpdated.modifiedCount} ADMIN passwords to: admin123`);

    console.log('\n✅ ALL PASSWORDS RESET!');
    console.log('\nLogin with:');
    console.log('Students: ANY @mu.edu email / student123');
    console.log('Admins: admin@mu.edu / admin123\n');

    await mongoose.connection.close();
    process.exit(0);
}

resetAllPasswords().catch(console.error);
