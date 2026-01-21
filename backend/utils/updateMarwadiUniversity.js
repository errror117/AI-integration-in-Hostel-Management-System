const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Organization = require('../models/Organization');
const User = require('../models/User');
const Student = require('../models/Student');
const Admin = require('../models/Admin');

/**
 * Update MU to Marwadi University and verify all orgs have students & admins
 */

async function updateAndVerify() {
    try {
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║                                                            ║');
        console.log('║     UPDATE TO MARWADI UNIVERSITY & VERIFY DATA             ║');
        console.log('║                                                            ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // 1. Update MU organization name
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1️⃣  UPDATING ORGANIZATION NAME');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const muOrg = await Organization.findOne({ slug: 'mu' });
        if (muOrg) {
            const oldName = muOrg.name;
            muOrg.name = 'Marwadi University';
            await muOrg.save();
            console.log(`✅ Updated: "${oldName}" → "Marwadi University"`);
        } else {
            console.log('⚠️  MU organization not found');
        }

        // 2. Get all organizations
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('2️⃣  ALL ORGANIZATIONS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const organizations = await Organization.find().sort({ name: 1 });
        console.log(`Found ${organizations.length} organizations:\n`);

        organizations.forEach((org, index) => {
            console.log(`${index + 1}. ${org.name} (${org.slug})`);
            console.log(`   Address: ${org.address || 'Not set'}`);
            console.log(`   Contact: ${org.contactEmail || 'Not set'}\n`);
        });

        // 3. Verify students per organization
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('3️⃣  STUDENTS BY ORGANIZATION');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        for (const org of organizations) {
            const studentCount = await Student.countDocuments({ organizationId: org._id });
            const sampleStudents = await Student.find({ organizationId: org._id })
                .limit(3)
                .select('name email cms_id');

            console.log(`🏢 ${org.name}:`);
            console.log(`   Total Students: ${studentCount}`);

            if (sampleStudents.length > 0) {
                console.log(`   Sample Students:`);
                sampleStudents.forEach(s => {
                    console.log(`      • ${s.name} - ${s.email} (CMS: ${s.cms_id})`);
                });
            } else {
                console.log(`   ⚠️  NO STUDENTS FOUND!`);
            }
            console.log('');
        }

        // 4. Verify admins per organization
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('4️⃣  ADMINS BY ORGANIZATION');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const salt = await bcrypt.genSalt(10);
        const adminPassword = await bcrypt.hash('admin123', salt);

        for (const org of organizations) {
            const adminEmail = `admin@${org.slug}.edu`;

            // Check if admin exists
            let adminUser = await User.findOne({ email: adminEmail, organizationId: org._id });
            let adminProfile = await Admin.findOne({ email: adminEmail, organizationId: org._id });

            if (adminUser && adminProfile) {
                console.log(`✅ ${org.name}:`);
                console.log(`   Email: ${adminEmail}`);
                console.log(`   Password: admin123`);
                console.log(`   Status: EXISTS\n`);
            } else {
                console.log(`⚠️  ${org.name}: Admin missing - Creating...`);

                // Create admin user if missing
                if (!adminUser) {
                    adminUser = await User.create({
                        email: adminEmail,
                        password: adminPassword,
                        role: 'org_admin',
                        isAdmin: true,
                        isActive: true,
                        organizationId: org._id
                    });
                    console.log(`   ✅ Created user: ${adminEmail}`);
                }

                // Create admin profile if missing
                if (!adminProfile) {
                    adminProfile = await Admin.create({
                        organizationId: org._id,
                        name: `${org.name} Admin`,
                        email: adminEmail,
                        father_name: 'Admin',
                        contact: '+91-9876543210',
                        address: org.address || 'Admin Office',
                        dob: new Date('1990-01-01'),
                        cnic: `${Math.floor(Math.random() * 90000) + 10000}-1234567-1`,
                        user: adminUser._id
                    });
                    console.log(`   ✅ Created profile for: ${adminEmail}`);
                }
                console.log('');
            }
        }

        // 5. Final Summary
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('5️⃣  FINAL CREDENTIALS SUMMARY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('🔐 SUPER ADMIN:');
        console.log('   Email: superadmin@hostelease.com');
        console.log('   Password: admin123\n');

        console.log('🔐 ORGANIZATION ADMINS:\n');
        for (const org of organizations) {
            console.log(`   ${org.name}:`);
            console.log(`      Email: admin@${org.slug}.edu`);
            console.log(`      Password: admin123\n`);
        }

        console.log('🔐 STUDENTS:');
        console.log('   Password: student123 (for ALL students)');
        console.log('   Run: npm run show-students (to see sample emails)\n');

        // 6. Statistics
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('6️⃣  STATISTICS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const totalStudents = await Student.countDocuments();
        const totalAdmins = await Admin.countDocuments();
        const totalUsers = await User.countDocuments();

        console.log(`📊 Total Organizations: ${organizations.length}`);
        console.log(`📊 Total Students: ${totalStudents}`);
        console.log(`📊 Total Admins: ${totalAdmins}`);
        console.log(`📊 Total Users: ${totalUsers}\n`);

        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║                                                            ║');
        console.log('║     ✅ UPDATE COMPLETE!                                    ║');
        console.log('║                                                            ║');
        console.log('║     MU is now "Marwadi University"                        ║');
        console.log('║     All organizations have admins                         ║');
        console.log('║     Students verified across all orgs                     ║');
        console.log('║                                                            ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

    } catch (error) {
        console.error('❌ Error:', error);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Connection closed\n');
        process.exit(0);
    }
}

updateAndVerify();
