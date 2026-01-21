const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const User = require('../models/User');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const Organization = require('../models/Organization');

async function fixDataIntegrity() {
    try {
        console.log('🔧 DATA INTEGRITY CHECK & FIX\n');
        console.log('='.repeat(60));

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get MU organization
        const muOrg = await Organization.findOne({ slug: 'mu' });
        if (!muOrg) {
            console.log('❌ MU organization not found!');
            process.exit(1);
        }

        console.log(`\n📊 CHECKING MU ORGANIZATION: ${muOrg.name}`);
        console.log(`Organization ID: ${muOrg._id}\n`);

        // 1. Check Students
        console.log('1️⃣  CHECKING STUDENTS...');
        const students = await Student.find({ organizationId: muOrg._id });
        console.log(`   Found ${students.length} students`);

        let studentsWithoutUser = 0;
        let studentsWithInvalidUser = 0;
        let studentsFixed = 0;

        for (const student of students) {
            // Check if user reference exists
            if (!student.user) {
                studentsWithoutUser++;
                // Try to find user by email
                const user = await User.findOne({ email: student.email, organizationId: muOrg._id });
                if (user) {
                    student.user = user._id;
                    await student.save();
                    studentsFixed++;
                }
            } else {
                // Verify user exists
                const user = await User.findById(student.user);
                if (!user) {
                    studentsWithInvalidUser++;
                    // Try to find or create user
                    const existingUser = await User.findOne({ email: student.email, organizationId: muOrg._id });
                    if (existingUser) {
                        student.user = existingUser._id;
                        await student.save();
                        studentsFixed++;
                    }
                }
            }
        }

        console.log(`   ✅ Students without user reference: ${studentsWithoutUser}`);
        console.log(`   ✅ Students with invalid user: ${studentsWithInvalidUser}`);
        console.log(`   ✅ Students fixed: ${studentsFixed}\n`);

        // 2. Check Users
        console.log('2️⃣  CHECKING USERS...');
        const users = await User.find({ organizationId: muOrg._id, role: 'student' });
        console.log(`   Found ${users.length} student users`);

        let usersWithoutStudent = 0;
        let usersFixed = 0;

        for (const user of users) {
            // Check if corresponding student exists
            const student = await Student.findOne({ email: user.email, organizationId: muOrg._id });
            if (!student) {
                usersWithoutStudent++;
            }

            // Ensure user has correct fields
            let userUpdated = false;
            if (!user.organizationId) {
                user.organizationId = muOrg._id;
                userUpdated = true;
            }
            if (user.role !== 'student') {
                user.role = 'student';
                userUpdated = true;
            }
            if (user.isAdmin !== false) {
                user.isAdmin = false;
                userUpdated = true;
            }
            if (!user.isActive) {
                user.isActive = true;
                userUpdated = true;
            }

            if (userUpdated) {
                await user.save();
                usersFixed++;
            }
        }

        console.log(`   ✅ Users without student record: ${usersWithoutStudent}`);
        console.log(`   ✅ Users fixed: ${usersFixed}\n`);

        // 3. Cross-reference check
        console.log('3️⃣  CROSS-REFERENCE VALIDATION...');
        let mismatches = 0;

        for (const student of students) {
            if (student.user) {
                const user = await User.findById(student.user);
                if (user) {
                    if (user.email !== student.email) {
                        console.log(`   ⚠️  Email mismatch: Student(${student.email}) vs User(${user.email})`);
                        mismatches++;
                    }
                    if (user.organizationId.toString() !== student.organizationId.toString()) {
                        console.log(`   ⚠️  Org mismatch: Student(${student.organizationId}) vs User(${user.organizationId})`);
                        mismatches++;
                    }
                }
            }
        }

        console.log(`   ${mismatches === 0 ? '✅' : '⚠️'}  Found ${mismatches} mismatches\n`);

        // 4. Check Admin
        console.log('4️⃣  CHECKING ADMIN...');
        const admins = await Admin.find({ organizationId: muOrg._id });
        console.log(`   Found ${admins.length} admins`);

        for (const admin of admins) {
            if (admin.user) {
                const user = await User.findById(admin.user);
                if (user) {
                    console.log(`   ✅ Admin: ${admin.email} (User valid)`);
                } else {
                    console.log(`   ❌ Admin: ${admin.email} (User NOT found)`);
                }
            }
        }
        console.log();

        // 5. Final Report
        console.log('='.repeat(60));
        console.log('📋 FINAL REPORT\n');

        const finalStudentCount = await Student.countDocuments({ organizationId: muOrg._id });
        const finalUserCount = await User.countDocuments({ organizationId: muOrg._id, role: 'student' });
        const finalAdminCount = await Admin.countDocuments({ organizationId: muOrg._id });

        console.log(`Total Students: ${finalStudentCount}`);
        console.log(`Total Student Users: ${finalUserCount}`);
        console.log(`Total Admins: ${finalAdminCount}`);
        console.log();

        // Sample login credentials
        console.log('🔐 SAMPLE LOGIN CREDENTIALS:\n');
        const sampleStudents = await Student.find({ organizationId: muOrg._id })
            .sort({ cms_id: 1 })
            .limit(5);

        for (const s of sampleStudents) {
            console.log(`Email: ${s.email}`);
            console.log(`Password: student123`);
            console.log(`Name: ${s.name} (CMS: ${s.cms_id})\n`);
        }

        console.log('✅ DATA INTEGRITY CHECK COMPLETE!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Connection closed\n');
        process.exit(0);
    }
}

fixDataIntegrity();
