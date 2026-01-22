/**
 * Script to fetch all users and save to file
 * Run with: node fetchUsersToFile.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

const mongoURI = process.env.MONGO_URI;

async function fetchAllUsers() {
    let output = '';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    try {
        log('🔄 Connecting to MongoDB...');
        await mongoose.connect(mongoURI);
        log('✅ Connected to MongoDB\n');

        const SuperAdminSchema = new mongoose.Schema({}, { strict: false });
        const AdminSchema = new mongoose.Schema({}, { strict: false });
        const StudentSchema = new mongoose.Schema({}, { strict: false });
        const OrganizationSchema = new mongoose.Schema({}, { strict: false });
        const HostelSchema = new mongoose.Schema({}, { strict: false });

        const SuperAdmin = mongoose.models.SuperAdmin || mongoose.model('SuperAdmin', SuperAdminSchema);
        const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
        const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);
        const Organization = mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);
        const Hostel = mongoose.models.Hostel || mongoose.model('Hostel', HostelSchema);

        const superAdmins = await SuperAdmin.find({}).lean();
        const admins = await Admin.find({}).lean();
        const students = await Student.find({}).lean();
        const organizations = await Organization.find({}).lean();
        const hostels = await Hostel.find({}).lean();

        log('═══════════════════════════════════════════════════════════════');
        log('                    👑 SUPER ADMINS');
        log('═══════════════════════════════════════════════════════════════');
        if (superAdmins.length === 0) {
            log('No Super Admins found.');
        } else {
            superAdmins.forEach((sa, i) => {
                log(`\n${i + 1}. ${sa.name || sa.username || 'N/A'}`);
                log(`   Email: ${sa.email || 'N/A'}`);
                log(`   Password: [HASHED in DB]`);
                log(`   Phone: ${sa.phone || sa.mobile || 'N/A'}`);
                log(`   ID: ${sa._id}`);
            });
        }
        log(`\nTotal Super Admins: ${superAdmins.length}`);

        log('\n═══════════════════════════════════════════════════════════════');
        log('                    🏢 ORGANIZATIONS');
        log('═══════════════════════════════════════════════════════════════');
        if (organizations.length === 0) {
            log('No Organizations found.');
        } else {
            organizations.forEach((org, i) => {
                log(`\n${i + 1}. ${org.name || 'N/A'}`);
                log(`   ID: ${org._id}`);
                log(`   Email: ${org.email || 'N/A'}`);
            });
        }
        log(`\nTotal Organizations: ${organizations.length}`);

        log('\n═══════════════════════════════════════════════════════════════');
        log('                    🏨 HOSTELS');
        log('═══════════════════════════════════════════════════════════════');
        if (hostels.length === 0) {
            log('No Hostels found.');
        } else {
            hostels.forEach((h, i) => {
                log(`\n${i + 1}. ${h.name || 'N/A'}`);
                log(`   ID: ${h._id}`);
                log(`   Organization ID: ${h.organizationId || 'N/A'}`);
            });
        }
        log(`\nTotal Hostels: ${hostels.length}`);

        log('\n═══════════════════════════════════════════════════════════════');
        log('                    👨‍💼 ADMINS');
        log('═══════════════════════════════════════════════════════════════');
        if (admins.length === 0) {
            log('No Admins found.');
        } else {
            admins.forEach((admin, i) => {
                log(`\n${i + 1}. ${admin.name || admin.username || 'N/A'}`);
                log(`   Email: ${admin.email || 'N/A'}`);
                log(`   Password: [HASHED in DB]`);
                log(`   Hostel ID: ${admin.hostelId || admin.hostel || 'N/A'}`);
                log(`   Organization ID: ${admin.organizationId || 'N/A'}`);
                log(`   ID: ${admin._id}`);
            });
        }
        log(`\nTotal Admins: ${admins.length}`);

        log('\n═══════════════════════════════════════════════════════════════');
        log('                    🎓 STUDENTS');
        log('═══════════════════════════════════════════════════════════════');
        if (students.length === 0) {
            log('No Students found.');
        } else {
            students.forEach((student, i) => {
                log(`\n${i + 1}. ${student.name || 'N/A'}`);
                log(`   Email: ${student.email || 'N/A'}`);
                log(`   Password: [HASHED in DB]`);
                log(`   Phone: ${student.phone || student.mobile || 'N/A'}`);
                log(`   Room: ${student.room || student.roomNumber || 'N/A'}`);
                log(`   Hostel ID: ${student.hostelId || student.hostel || 'N/A'}`);
                log(`   Organization ID: ${student.organizationId || 'N/A'}`);
                log(`   ID: ${student._id}`);
            });
        }
        log(`\nTotal Students: ${students.length}`);

        log('\n═══════════════════════════════════════════════════════════════');
        log('                    📊 SUMMARY');
        log('═══════════════════════════════════════════════════════════════');
        log(`   Super Admins: ${superAdmins.length}`);
        log(`   Organizations: ${organizations.length}`);
        log(`   Hostels: ${hostels.length}`);
        log(`   Admins: ${admins.length}`);
        log(`   Students: ${students.length}`);
        log('═══════════════════════════════════════════════════════════════\n');

        log('\nNOTE: Passwords are HASHED (bcrypt) in the database.');
        log('You need to know the original password or reset it.');
        log('\nCOMMON DEFAULT PASSWORDS TO TRY:');
        log('   - password123');
        log('   - admin123');
        log('   - 12345678');
        log('   - student123');

        // Save to file
        fs.writeFileSync('../ALL_USERS_LIST.md', `# All Users in Database\n\nGenerated: ${new Date().toISOString()}\n\n\`\`\`\n${output}\`\`\`\n`);
        log('\n✅ Report saved to ALL_USERS_LIST.md');

    } catch (error) {
        log('❌ Error: ' + error.message);
    } finally {
        await mongoose.connection.close();
        log('🔌 Database connection closed.');
    }
}

fetchAllUsers();
