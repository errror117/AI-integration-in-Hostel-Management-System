const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createSuperAdmin = async () => {
    try {
        console.log('🔐 Creating Super Admin User...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Check if super admin already exists
        const existingSuperAdmin = await User.findOne({ role: 'super_admin' });

        if (existingSuperAdmin) {
            console.log('⚠️  Super Admin already exists!');
            console.log(`   Email: ${existingSuperAdmin.email}`);
            console.log(`   Name: ${existingSuperAdmin.name}\n`);

            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });

            readline.question('Do you want to create another super admin? (yes/no): ', async (answer) => {
                readline.close();

                if (answer.toLowerCase() !== 'yes') {
                    console.log('\n👋 Exiting...');
                    await mongoose.connection.close();
                    process.exit(0);
                }

                await createNewSuperAdmin();
            });
        } else {
            await createNewSuperAdmin();
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

async function createNewSuperAdmin() {
    try {
        // Super Admin details
        const superAdminData = {
            name: 'Super Admin',
            email: 'superadmin@hostelease.com',
            password: 'SuperAdmin@123', // Change this in production!
            role: 'super_admin',
            organizationId: null // Super admins don't belong to any organization
        };

        console.log('📝 Creating super admin with the following details:');
        console.log(`   Name: ${superAdminData.name}`);
        console.log(`   Email: ${superAdminData.email}`);
        console.log(`   Password: ${superAdminData.password}`);
        console.log(`   Role: ${superAdminData.role}\n`);

        // Hash password
        const salt = await bcrypt.genSalt(10);
        superAdminData.password = await bcrypt.hash(superAdminData.password, salt);

        // Create super admin
        const superAdmin = await User.create(superAdminData);

        console.log('✅ Super Admin created successfully!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 SUPER ADMIN CREDENTIALS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Email:    superadmin@hostelease.com`);
        console.log(`Password: SuperAdmin@123`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('⚠️  IMPORTANT: Change this password immediately in production!\n');
        console.log('🚀 You can now login and access:');
        console.log('   • /api/superadmin/stats - System statistics');
        console.log('   • /api/superadmin/organizations - Manage organizations');
        console.log('   • /api/superadmin/users - View all users\n');

        await mongoose.connection.close();
        console.log('👋 Done! Database connection closed.\n');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error creating super admin:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run the script
createSuperAdmin();
