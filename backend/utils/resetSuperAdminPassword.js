const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function resetSuperAdminPassword() {
    try {
        console.log('🔐 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected!');

        console.log('\n🔍 Finding super admin...');
        const superAdmin = await User.findOne({ role: 'super_admin' });

        if (!superAdmin) {
            console.log('❌ Super admin not found!');
            console.log('\n📝 Creating new super admin...');

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            const newSuperAdmin = await User.create({
                name: 'Super Admin',
                email: 'superadmin@hostelease.com',
                password: hashedPassword,
                role: 'super_admin',
                organizationId: null
            });

            console.log('\n✅ Super Admin Created!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📧 Email:    superadmin@hostelease.com');
            console.log('🔐 Password: admin123');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        } else {
            console.log('✅ Super admin found!');
            console.log(`   ID: ${superAdmin._id}`);
            console.log(`   Email: ${superAdmin.email}`);
            console.log(`   Name: ${superAdmin.name}`);

            console.log('\n🔄 Resetting password...');

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            superAdmin.password = hashedPassword;
            await superAdmin.save();

            console.log('✅ Password Reset Successfully!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📧 Email:    superadmin@hostelease.com');
            console.log('🔐 Password: admin123');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }

        console.log('✅ All done! You can now login with the new password.\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Connection closed\n');
        process.exit(0);
    }
}

resetSuperAdminPassword();
