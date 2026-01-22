/**
 * Script to fetch all users from the database
 * Run with: node fetchUsers.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI;

async function fetchAllUsers() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB\n');

        // Define schemas (minimal for querying)
        const SuperAdminSchema = new mongoose.Schema({}, { strict: false });
        const AdminSchema = new mongoose.Schema({}, { strict: false });
        const StudentSchema = new mongoose.Schema({}, { strict: false });
        const OrganizationSchema = new mongoose.Schema({}, { strict: false });
        const HostelSchema = new mongoose.Schema({}, { strict: false });

        // Get models
        const SuperAdmin = mongoose.models.SuperAdmin || mongoose.model('SuperAdmin', SuperAdminSchema);
        const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
        const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);
        const Organization = mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);
        const Hostel = mongoose.models.Hostel || mongoose.model('Hostel', HostelSchema);

        // Fetch all data
        const superAdmins = await SuperAdmin.find({}).lean();
        const admins = await Admin.find({}).lean();
        const students = await Student.find({}).lean();
        const organizations = await Organization.find({}).lean();
        const hostels = await Hostel.find({}).lean();

        console.log('═══════════════════════════════════════════════════════════════');
        console.log('                    👑 SUPER ADMINS');
        console.log('═══════════════════════════════════════════════════════════════');
        if (superAdmins.length === 0) {
            console.log('No Super Admins found.');
        } else {
            superAdmins.forEach((sa, i) => {
                console.log(`\n${i + 1}. ${sa.name || sa.username || 'N/A'}`);
                console.log(`   📧 Email: ${sa.email || 'N/A'}`);
                console.log(`   🔑 Password: ${sa.password ? '[HASHED - Check below for plaintext if exists]' : 'N/A'}`);
                console.log(`   📱 Phone: ${sa.phone || sa.mobile || 'N/A'}`);
                console.log(`   🆔 ID: ${sa._id}`);
                console.log(`   📅 Created: ${sa.createdAt || sa.date || 'N/A'}`);
            });
        }
        console.log(`\n📊 Total Super Admins: ${superAdmins.length}`);

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('                    🏢 ORGANIZATIONS');
        console.log('═══════════════════════════════════════════════════════════════');
        if (organizations.length === 0) {
            console.log('No Organizations found.');
        } else {
            organizations.forEach((org, i) => {
                console.log(`\n${i + 1}. ${org.name || 'N/A'}`);
                console.log(`   🆔 ID: ${org._id}`);
                console.log(`   📧 Email: ${org.email || 'N/A'}`);
                console.log(`   📍 Address: ${org.address || 'N/A'}`);
                console.log(`   📅 Created: ${org.createdAt || 'N/A'}`);
            });
        }
        console.log(`\n📊 Total Organizations: ${organizations.length}`);

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('                    🏨 HOSTELS');
        console.log('═══════════════════════════════════════════════════════════════');
        if (hostels.length === 0) {
            console.log('No Hostels found.');
        } else {
            hostels.forEach((h, i) => {
                console.log(`\n${i + 1}. ${h.name || 'N/A'}`);
                console.log(`   🆔 ID: ${h._id}`);
                console.log(`   🏢 Organization: ${h.organizationId || 'N/A'}`);
                console.log(`   🛏️ Capacity: ${h.capacity || 'N/A'}`);
            });
        }
        console.log(`\n📊 Total Hostels: ${hostels.length}`);

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('                    👨‍💼 ADMINS');
        console.log('═══════════════════════════════════════════════════════════════');
        if (admins.length === 0) {
            console.log('No Admins found.');
        } else {
            admins.forEach((admin, i) => {
                console.log(`\n${i + 1}. ${admin.name || admin.username || 'N/A'}`);
                console.log(`   📧 Email: ${admin.email || 'N/A'}`);
                console.log(`   🔑 Password: ${admin.password ? '[HASHED]' : 'N/A'}`);
                console.log(`   📱 Phone: ${admin.phone || admin.mobile || 'N/A'}`);
                console.log(`   🏨 Hostel ID: ${admin.hostelId || admin.hostel || 'N/A'}`);
                console.log(`   🏢 Organization ID: ${admin.organizationId || 'N/A'}`);
                console.log(`   🆔 ID: ${admin._id}`);
            });
        }
        console.log(`\n📊 Total Admins: ${admins.length}`);

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('                    🎓 STUDENTS');
        console.log('═══════════════════════════════════════════════════════════════');
        if (students.length === 0) {
            console.log('No Students found.');
        } else {
            students.forEach((student, i) => {
                console.log(`\n${i + 1}. ${student.name || 'N/A'}`);
                console.log(`   📧 Email: ${student.email || 'N/A'}`);
                console.log(`   🔑 Password: ${student.password ? '[HASHED]' : 'N/A'}`);
                console.log(`   📱 Phone: ${student.phone || student.mobile || 'N/A'}`);
                console.log(`   🛏️ Room: ${student.room || student.roomNumber || 'N/A'}`);
                console.log(`   🏨 Hostel ID: ${student.hostelId || student.hostel || 'N/A'}`);
                console.log(`   🏢 Organization ID: ${student.organizationId || 'N/A'}`);
                console.log(`   🆔 ID: ${student._id}`);
            });
        }
        console.log(`\n📊 Total Students: ${students.length}`);

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('                    📊 SUMMARY');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`   👑 Super Admins: ${superAdmins.length}`);
        console.log(`   🏢 Organizations: ${organizations.length}`);
        console.log(`   🏨 Hostels: ${hostels.length}`);
        console.log(`   👨‍💼 Admins: ${admins.length}`);
        console.log(`   🎓 Students: ${students.length}`);
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Note about passwords
        console.log('⚠️  NOTE: Passwords are HASHED in the database (bcrypt).');
        console.log('   You cannot see the original plaintext passwords.');
        console.log('   To login, you need to know the password used during registration.');
        console.log('   Or you can reset passwords using the forgot password feature.');
        console.log('\n💡 COMMON DEFAULT PASSWORDS TO TRY:');
        console.log('   - admin123');
        console.log('   - password123');
        console.log('   - 12345678');
        console.log('   - student123');
        console.log('   - superadmin123\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed.');
    }
}

fetchAllUsers();
