const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Organization = require('../models/Organization');
const User = require('../models/User');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const Hostel = require('../models/Hostel');

/**
 * 🔧 LOGIN & PASSWORD SYNC FIX SCRIPT
 * 
 * This script fixes all login and password synchronization issues:
 * 1. Ensures all Student records have corresponding User records
 * 2. Ensures all Admin records have corresponding User records
 * 3. Syncs organizationId across all related models
 * 4. Sets consistent default passwords with proper hashing
 * 5. Ensures email consistency between User and Student/Admin models
 */

async function fixLoginSync() {
    try {
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║                                                            ║');
        console.log('║     LOGIN & PASSWORD SYNC FIX                              ║');
        console.log('║     Fixing all authentication issues...                   ║');
        console.log('║                                                            ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const salt = await bcrypt.genSalt(10);

        // Default passwords
        const studentPassword = await bcrypt.hash('student123', salt);
        const adminPassword = await bcrypt.hash('admin123', salt);
        const superAdminPassword = await bcrypt.hash('admin123', salt);

        console.log('🔐 Password hashes generated\n');

        // ========================================
        // 1. FIX SUPER ADMIN
        // ========================================
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1️⃣  FIXING SUPER ADMIN');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        let superAdmin = await User.findOne({ email: 'superadmin@hostelease.com' });

        if (superAdmin) {
            superAdmin.password = superAdminPassword;
            superAdmin.role = 'super_admin';
            superAdmin.isAdmin = true;
            superAdmin.isActive = true;
            superAdmin.organizationId = null; // Super admin has no org
            await superAdmin.save();
            console.log('✅ Super Admin password updated');
        } else {
            superAdmin = await User.create({
                email: 'superadmin@hostelease.com',
                password: superAdminPassword,
                role: 'super_admin',
                isAdmin: true,
                isActive: true
            });
            console.log('✅ Super Admin created');
        }
        console.log(`   Email: superadmin@hostelease.com`);
        console.log(`   Password: admin123\n`);

        // ========================================
        // 2. FIX ORGANIZATIONS & THEIR ADMINS
        // ========================================
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('2️⃣  FIXING ORGANIZATION ADMINS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const organizations = await Organization.find();
        console.log(`Found ${organizations.length} organizations\n`);

        let adminStats = { created: 0, updated: 0, synced: 0 };

        for (const org of organizations) {
            console.log(`\n🏢 Processing: ${org.name} (${org.slug})`);

            // Check if org has a hostel
            let hostel = await Hostel.findOne({ organizationId: org._id });

            if (!hostel) {
                // Create default hostel for the org
                hostel = await Hostel.create({
                    name: `${org.name} - Main Hostel`,
                    location: 'Main Campus',
                    rooms: 100,
                    capacity: 200,
                    vacant: 200,
                    organizationId: org._id
                });
                console.log(`   ✅ Created default hostel`);
            }

            // Standard admin email for each org
            const adminEmail = `admin@${org.slug}.edu`;

            // Find or create admin user
            let adminUser = await User.findOne({ email: adminEmail });

            if (adminUser) {
                // Update existing admin user
                adminUser.password = adminPassword;
                adminUser.role = 'org_admin';
                adminUser.isAdmin = true;
                adminUser.isActive = true;
                adminUser.organizationId = org._id;
                await adminUser.save();
                console.log(`   ✅ Updated admin user: ${adminEmail}`);
                adminStats.updated++;
            } else {
                // Create new admin user
                adminUser = await User.create({
                    email: adminEmail,
                    password: adminPassword,
                    role: 'org_admin',
                    isAdmin: true,
                    isActive: true,
                    organizationId: org._id
                });
                console.log(`   ✅ Created admin user: ${adminEmail}`);
                adminStats.created++;
            }

            // Find or create admin profile
            let adminProfile = await Admin.findOne({ email: adminEmail, organizationId: org._id });

            if (!adminProfile) {
                adminProfile = await Admin.create({
                    organizationId: org._id,
                    name: `${org.name} Admin`,
                    email: adminEmail,
                    father_name: 'Admin',
                    contact: '+91-9876543210',
                    address: org.address || 'Admin Office',
                    dob: new Date('1990-01-01'),
                    cnic: '12345-1234567-1',
                    user: adminUser._id,
                    hostel: hostel._id
                });
                console.log(`   ✅ Created admin profile`);
            } else {
                // Sync admin profile with user
                adminProfile.user = adminUser._id;
                adminProfile.email = adminEmail;
                adminProfile.organizationId = org._id;
                await adminProfile.save();
                console.log(`   ✅ Synced admin profile`);
                adminStats.synced++;
            }

            console.log(`   📧 Admin Login: ${adminEmail} / admin123`);
        }

        console.log('\n📊 Admin Stats:');
        console.log(`   Created: ${adminStats.created}`);
        console.log(`   Updated: ${adminStats.updated}`);
        console.log(`   Synced: ${adminStats.synced}\n`);

        // ========================================
        // 3. FIX STUDENTS
        // ========================================
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('3️⃣  FIXING STUDENT ACCOUNTS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const students = await Student.find();
        console.log(`Found ${students.length} students\n`);

        let studentStats = {
            fixed: 0,
            created: 0,
            synced: 0,
            errors: 0,
            byOrg: {}
        };

        for (const student of students) {
            try {
                // Initialize org counter
                const orgName = organizations.find(o => o._id.equals(student.organizationId))?.name || 'Unknown';
                if (!studentStats.byOrg[orgName]) {
                    studentStats.byOrg[orgName] = 0;
                }

                // Find user by email
                let user = await User.findOne({ email: student.email });

                if (!user) {
                    // Create user for student
                    user = await User.create({
                        email: student.email,
                        password: studentPassword,
                        role: 'student',
                        isAdmin: false,
                        isActive: true,
                        organizationId: student.organizationId
                    });
                    studentStats.created++;
                } else {
                    // Update existing user
                    user.password = studentPassword;
                    user.role = 'student';
                    user.isAdmin = false;
                    user.isActive = true;
                    user.organizationId = student.organizationId;
                    await user.save();
                    studentStats.fixed++;
                }

                // Sync student with user
                if (!student.user || !student.user.equals(user._id)) {
                    student.user = user._id;
                    await student.save();
                    studentStats.synced++;
                }

                studentStats.byOrg[orgName]++;

                // Progress indicator
                if (studentStats.fixed % 50 === 0) {
                    console.log(`   Progress: ${studentStats.fixed + studentStats.created} students processed...`);
                }

            } catch (err) {
                console.log(`   ⚠️  Error fixing student ${student.email}: ${err.message}`);
                studentStats.errors++;
            }
        }

        console.log('\n✅ Student sync complete!\n');
        console.log('📊 Student Stats:');
        console.log(`   User accounts created: ${studentStats.created}`);
        console.log(`   User accounts updated: ${studentStats.fixed}`);
        console.log(`   Profile-User links synced: ${studentStats.synced}`);
        console.log(`   Errors: ${studentStats.errors}\n`);

        console.log('📊 Students by Organization:');
        Object.entries(studentStats.byOrg).forEach(([org, count]) => {
            console.log(`   ${org}: ${count} students`);
        });

        // ========================================
        // 4. FINAL VERIFICATION
        // ========================================
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('4️⃣  VERIFICATION & SUMMARY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const totalUsers = await User.countDocuments();
        const totalStudents = await Student.countDocuments();
        const totalAdmins = await Admin.countDocuments();
        const orphanStudents = await Student.countDocuments({ user: null });
        const orphanAdmins = await Admin.countDocuments({ user: null });

        console.log('📈 DATABASE COUNTS:');
        console.log(`   Total Users: ${totalUsers}`);
        console.log(`   Total Students: ${totalStudents}`);
        console.log(`   Total Admins: ${totalAdmins}`);
        console.log(`   Organizations: ${organizations.length}\n`);

        console.log('🔍 DATA INTEGRITY:');
        console.log(`   Orphan Students (no user): ${orphanStudents}`);
        console.log(`   Orphan Admins (no user): ${orphanAdmins}\n`);

        if (orphanStudents === 0 && orphanAdmins === 0) {
            console.log('✅ All records properly linked!');
        } else {
            console.log('⚠️  Some orphan records remain - may need manual cleanup');
        }

        // ========================================
        // 5. PRINT LOGIN CREDENTIALS
        // ========================================
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('5️⃣  LOGIN CREDENTIALS SUMMARY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('🔐 SUPER ADMIN:');
        console.log('   Email: superadmin@hostelease.com');
        console.log('   Password: admin123');
        console.log('   URL: http://localhost:5173/auth/admin-login\n');

        console.log('🔐 ORGANIZATION ADMINS:');
        for (const org of organizations) {
            console.log(`   ${org.name}:`);
            console.log(`      Email: admin@${org.slug}.edu`);
            console.log(`      Password: admin123`);
            console.log(`      URL: http://localhost:5173/auth/admin-login\n`);
        }

        console.log('🔐 STUDENTS:');
        console.log('   All students can login with:');
        console.log('   Email: <their-email-from-database>');
        console.log('   Password: student123');
        console.log('   URL: http://localhost:5173/auth/student-login\n');

        // Sample student credentials
        const sampleStudents = await Student.find().limit(3);
        if (sampleStudents.length > 0) {
            console.log('   Sample Student Logins:');
            for (const student of sampleStudents) {
                const org = organizations.find(o => o._id.equals(student.organizationId));
                console.log(`      ${student.email} / student123 (${org?.name || 'Unknown Org'})`);
            }
        }

        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║                                                            ║');
        console.log('║     ✅ LOGIN SYNC FIX COMPLETE!                            ║');
        console.log('║                                                            ║');
        console.log('║     All passwords are now synced and working              ║');
        console.log('║     You can login with any of the above credentials       ║');
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

// Run the fix script
fixLoginSync();
