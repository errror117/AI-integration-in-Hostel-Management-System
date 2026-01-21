const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('../models/User');

async function testPassword() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Test with the student account
        const email = 'kunal.pillai20000@mu.edu';
        const passwordToTest = 'student123';

        const user = await User.findOne({ email });

        if (!user) {
            console.log(`❌ User not found: ${email}`);
            process.exit(1);
        }

        console.log(`Found user: ${email}`);
        console.log(`User role: ${user.role}`);
        console.log(`User active: ${user.isActive}`);
        console.log(`Password hash in DB: ${user.password.substring(0, 20)}...`);
        console.log('');

        // Test password comparison
        const isMatch = await bcrypt.compare(passwordToTest, user.password);
        console.log(`Testing password: "${passwordToTest}"`);
        console.log(`Password match: ${isMatch ? '✅ YES' : '❌ NO'}`);
        console.log('');

        if (!isMatch) {
            console.log('⚠️  PASSWORD MISMATCH - Let me test if we need to hash it first...');

            // Create a new hash for student123
            const salt = await bcrypt.genSalt(10);
            const newHash = await bcrypt.hash('student123', salt);
            console.log(`New hash created: ${newHash.substring(0, 20)}...`);

            // Test the new hash
            const newMatch = await bcrypt.compare('student123', newHash);
            console.log(`New hash works: ${newMatch ? '✅ YES' : '❌ NO'}`);
            console.log('');
            console.log('RECOMMENDATION: Reseed the database or fix the password hashing');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testPassword();
