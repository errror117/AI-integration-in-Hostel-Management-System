const mongoose = require('mongoose');
require('dotenv').config();
const Student = require('../models/Student');
const Organization = require('../models/Organization');

/**
 * Quick script to display student login credentials for testing
 */

async function showStudentLogins() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║                                                            ║');
        console.log('║     STUDENT LOGIN CREDENTIALS FOR TESTING                  ║');
        console.log('║                                                            ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        const organizations = await Organization.find();

        console.log('📋 Sample student logins from each organization:\n');
        console.log('Password for ALL students: student123\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        for (const org of organizations) {
            const students = await Student.find({ organizationId: org._id })
                .limit(5)
                .select('name email cms_id');

            console.log(`🏢 ${org.name} (${org.slug})`);
            console.log(`   Students: ${await Student.countDocuments({ organizationId: org._id })}\n`);

            if (students.length > 0) {
                students.forEach((student, index) => {
                    console.log(`   ${index + 1}. ${student.name}`);
                    console.log(`      Email: ${student.email}`);
                    console.log(`      CMS ID: ${student.cms_id}`);
                    console.log(`      Password: student123\n`);
                });
            } else {
                console.log('   No students found\n');
            }
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }

        console.log('🎯 QUICK TEST:');
        const anyStudent = await Student.findOne();
        if (anyStudent) {
            console.log(`   Login URL: http://localhost:5173/auth/student-login`);
            console.log(`   Email: ${anyStudent.email}`);
            console.log(`   Password: student123\n`);
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

showStudentLogins();
