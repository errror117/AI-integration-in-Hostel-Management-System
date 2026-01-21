/**
 * Setup Test Data for Multi-Tenancy Testing
 * Creates 2 test organizations with sample data
 * 
 * Usage: node backend/utils/setupTestData.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const Organization = require('../models/Organization');
const User = require('../models/User');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const Hostel = require('../models/Hostel');

// MongoDB connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hosteldb');
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};

// Create test organizations
async function setupTestData() {
    try {
        console.log('\n🚀 Starting Test Data Setup...\n');

        // ========== ORGANIZATION A ==========
        console.log('📋 Creating Organization A: ABC College Hostel');

        const orgA = new Organization({
            name: 'ABC College Hostel',
            slug: 'abc-college',
            type: 'college',
            contact: {
                email: 'contact@abc.edu',
                phone: '+91 98765 43210',
                address: {
                    street: '123 College Road',
                    city: 'Delhi',
                    state: 'Delhi',
                    country: 'India',
                    zipCode: '110001'
                }
            },
            subscription: {
                plan: 'professional',
                status: 'active'
            },
            limits: {
                maxStudents: 500,
                maxAdmins: 10,
                maxRooms: 250
            },
            features: {
                aiChatbot: true,
                analytics: true,
                customBranding: true,
                exportData: true
            },
            branding: {
                primaryColor: '#1976d2',
                tagline: 'ABC College Hostel Management',
                welcomeMessage: 'Welcome to ABC College Hostel'
            },
            isActive: true
        });
        await orgA.save();
        console.log(`✅ Organization A created: ${orgA._id}`);

        // Create Hostel for Org A
        const hostelA = new Hostel({
            organizationId: orgA._id,
            name: 'ABC Boys Hostel',
            capacity: 200,
            vacant: 50,
            rooms: 100,
            location: 'Block A, ABC College Campus'
        });
        await hostelA.save();
        console.log(`✅ Hostel A created: ${hostelA._id}`);

        // Create Org A Admin
        const hashedPasswordA = await bcrypt.hash('admin123', 10);
        const userAdminA = new User({
            organizationId: orgA._id,
            email: 'admin@abc.edu',
            password: hashedPasswordA,
            role: 'org_admin',
            isAdmin: true,
            isActive: true
        });
        await userAdminA.save();

        const adminA = new Admin({
            organizationId: orgA._id,
            user: userAdminA._id,
            hostel: hostelA._id,
            name: 'Admin ABC',
            email: 'admin@abc.edu',
            contact: '+91 98765 43210',
            cnic: '12345-1234567-1'
        });
        await adminA.save();
        console.log(`✅ Admin A created: ${adminA._id}`);

        // Create Org A Student
        const hashedPasswordStudentA = await bcrypt.hash('student123', 10);
        const userStudentA = new User({
            organizationId: orgA._id,
            email: 'student1@abc.edu',
            password: hashedPasswordStudentA,
            role: 'student',
            isAdmin: false,
            isActive: true
        });
        await userStudentA.save();

        const studentA = new Student({
            organizationId: orgA._id,
            user: userStudentA._id,
            hostel: hostelA._id,
            name: 'Student ABC 1',
            cms_id: 'ABC001',
            email: 'student1@abc.edu',
            room_no: '101',
            batch: '2024',
            dept: 'Computer Science',
            course: 'BS CS',
            contact: '+91 98765 00001',
            cnic: '12345-1234567-2'
        });
        await studentA.save();
        console.log(`✅ Student A created: ${studentA._id}\n`);

        // ========== ORGANIZATION B ==========
        console.log('📋 Creating Organization B: XYZ University Hostel');

        const orgB = new Organization({
            name: 'XYZ University Hostel',
            slug: 'xyz-university',
            type: 'university',
            contact: {
                email: 'contact@xyz.edu',
                phone: '+91 98765 43211',
                address: {
                    street: '456 University Avenue',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    country: 'India',
                    zipCode: '400001'
                }
            },
            subscription: {
                plan: 'professional',
                status: 'active'
            },
            limits: {
                maxStudents: 1000,
                maxAdmins: 20,
                maxRooms: 500
            },
            features: {
                aiChatbot: true,
                analytics: true,
                customBranding: true,
                exportData: true
            },
            branding: {
                primaryColor: '#f44336',
                tagline: 'XYZ University Hostel Management',
                welcomeMessage: 'Welcome to XYZ University Hostel'
            },
            isActive: true
        });
        await orgB.save();
        console.log(`✅ Organization B created: ${orgB._id}`);

        // Create Hostel for Org B
        const hostelB = new Hostel({
            organizationId: orgB._id,
            name: 'XYZ Boys Hostel',
            capacity: 400,
            vacant: 100,
            rooms: 200,
            location: 'North Wing, XYZ University Campus'
        });
        await hostelB.save();
        console.log(`✅ Hostel B created: ${hostelB._id}`);

        // Create Org B Admin
        const hashedPasswordB = await bcrypt.hash('admin123', 10);
        const userAdminB = new User({
            organizationId: orgB._id,
            email: 'admin@xyz.edu',
            password: hashedPasswordB,
            role: 'org_admin',
            isAdmin: true,
            isActive: true
        });
        await userAdminB.save();

        const adminB = new Admin({
            organizationId: orgB._id,
            user: userAdminB._id,
            hostel: hostelB._id,
            name: 'Admin XYZ',
            email: 'admin@xyz.edu',
            contact: '+91 98765 43211',
            cnic: '54321-7654321-1'
        });
        await adminB.save();
        console.log(`✅ Admin B created: ${adminB._id}`);

        // Create Org B Student
        const hashedPasswordStudentB = await bcrypt.hash('student123', 10);
        const userStudentB = new User({
            organizationId: orgB._id,
            email: 'student1@xyz.edu',
            password: hashedPasswordStudentB,
            role: 'student',
            isAdmin: false,
            isActive: true
        });
        await userStudentB.save();

        const studentB = new Student({
            organizationId: orgB._id,
            user: userStudentB._id,
            hostel: hostelB._id,
            name: 'Student XYZ 1',
            cms_id: 'XYZ001',
            email: 'student1@xyz.edu',
            room_no: '201',
            batch: '2024',
            dept: 'Electrical Engineering',
            course: 'BS EE',
            contact: '+91 98765 00002',
            cnic: '54321-7654321-2'
        });
        await studentB.save();
        console.log(`✅ Student B created: ${studentB._id}\n`);

        // ========== SUMMARY ==========
        console.log('🎉 Test Data Setup Complete!\n');
        console.log('📊 SUMMARY:');
        console.log('─'.repeat(50));
        console.log(`\n🏢 Organization A: ABC College Hostel`);
        console.log(`   ID: ${orgA._id}`);
        console.log(`   Admin Login: admin@abc.edu / admin123`);
        console.log(`   Student Login: student1@abc.edu / student123`);
        console.log(`   Hostel: ${hostelA.name} (${hostelA._id})`);

        console.log(`\n🏢 Organization B: XYZ University Hostel`);
        console.log(`   ID: ${orgB._id}`);
        console.log(`   Admin Login: admin@xyz.edu / admin123`);
        console.log(`   Student Login: student1@xyz.edu / student123`);
        console.log(`   Hostel: ${hostelB.name} (${hostelB._id})`);

        console.log('\n' + '─'.repeat(50));
        console.log('\n✅ You can now test multi-tenancy!');
        console.log('\n📝 Next Steps:');
        console.log('   1. Login as admin@abc.edu');
        console.log('   2. Create some data (students, complaints, etc.)');
        console.log('   3. Login as admin@xyz.edu');
        console.log('   4. Verify you CANNOT see ABC data');
        console.log('   5. Create some data in XYZ');
        console.log('   6. Verify complete data isolation!\n');

    } catch (error) {
        console.error('❌ Error setting up test data:', error);
    } finally {
        await mongoose.connection.close();
        console.log('📡 MongoDB connection closed');
    }
}

// Run setup
connectDB().then(() => {
    setupTestData();
});
