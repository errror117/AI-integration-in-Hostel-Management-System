require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function checkDatabase() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!\n');

        const UserSchema = new mongoose.Schema({
            email: String,
            password: String,
            role: String,
            isActive: Boolean,
            organizationId: mongoose.Schema.Types.ObjectId
        });
        const User = mongoose.model('User', UserSchema);

        // Find all admin-type users
        console.log('=== ALL ADMIN/SUPER ADMIN USERS ===');
        const admins = await User.find({
            role: { $in: ['super_admin', 'org_admin', 'sub_admin'] }
        }).select('email role isActive');

        if (admins.length === 0) {
            console.log('No admin users found!');
        } else {
            admins.forEach(u => {
                console.log(`${u.email} | Role: ${u.role} | Active: ${u.isActive}`);
            });
        }

        // Check Super Admin specifically
        console.log('\n=== SUPER ADMIN VERIFICATION ===');
        const superAdmin = await User.findOne({ email: 'superadmin@hostelease.com' });

        if (superAdmin) {
            console.log('Email:', superAdmin.email);
            console.log('Role:', superAdmin.role);
            console.log('Active:', superAdmin.isActive);

            const passwordMatch = await bcrypt.compare('SuperAdmin@123', superAdmin.password);
            console.log('Password "SuperAdmin@123" matches:', passwordMatch);

            if (!passwordMatch) {
                console.log('\n⚠️ Password mismatch! Resetting password...');
                const salt = await bcrypt.genSalt(10);
                const newHash = await bcrypt.hash('SuperAdmin@123', salt);
                await User.updateOne({ email: 'superadmin@hostelease.com' }, { password: newHash });
                console.log('✅ Password reset to: SuperAdmin@123');
            }
        } else {
            console.log('❌ Super Admin not found! Creating one...');
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash('SuperAdmin@123', salt);
            await User.create({
                email: 'superadmin@hostelease.com',
                password: hash,
                role: 'super_admin',
                isActive: true
            });
            console.log('✅ Super Admin created!');
        }

        // Count total users
        const totalUsers = await User.countDocuments();
        console.log('\n=== STATS ===');
        console.log('Total users in database:', totalUsers);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\nDatabase disconnected.');
    }
}

checkDatabase();
