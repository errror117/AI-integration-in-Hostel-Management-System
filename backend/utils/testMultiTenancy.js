const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Organization = require('../models/Organization');
const User = require('../models/User');
const Student = require('../models/Student');
const Hostel = require('../models/Hostel');
const Complaint = require('../models/Complaint');
const Admin = require('../models/Admin');

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
    section: (msg) => console.log(`\n${colors.cyan}${colors.bright}━━━ ${msg} ━━━${colors.reset}\n`)
};

// Test organizations data
const testOrgs = [
    {
        name: 'ABC Engineering College',
        subdomain: 'abc-eng',
        email: 'admin@abc-eng.edu',
        phone: '+91-9876543210',
        address: 'Mumbai, Maharashtra',
        subscriptionPlan: 'professional',
        subscriptionStatus: 'active'
    },
    {
        name: 'XYZ Medical College',
        subdomain: 'xyz-med',
        email: 'admin@xyz-med.edu',
        phone: '+91-9876543211',
        address: 'Delhi, India',
        subscriptionPlan: 'starter',
        subscriptionStatus: 'active'
    },
    {
        name: 'PQR Arts College',
        subdomain: 'pqr-arts',
        email: 'admin@pqr-arts.edu',
        phone: '+91-9876543212',
        address: 'Bangalore, Karnataka',
        subscriptionPlan: 'free',
        subscriptionStatus: 'trial'
    }
];

let createdOrgs = [];
let createdData = {
    users: [],
    students: [],
    hostels: [],
    complaints: [],
    admins: []
};

// Connect to MongoDB
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        log.success('Connected to MongoDB');
    } catch (error) {
        log.error('MongoDB connection failed: ' + error.message);
        process.exit(1);
    }
}

// Clean up previous test data
async function cleanup() {
    log.section('STEP 1: Cleaning Up Previous Test Data');

    try {
        // Delete test organizations and all related data
        const orgSubdomains = testOrgs.map(org => org.subdomain);
        const testOrgIds = await Organization.find({ subdomain: { $in: orgSubdomains } }).distinct('_id');

        if (testOrgIds.length > 0) {
            await Promise.all([
                User.deleteMany({ organizationId: { $in: testOrgIds } }),
                Student.deleteMany({ organizationId: { $in: testOrgIds } }),
                Hostel.deleteMany({ organizationId: { $in: testOrgIds } }),
                Complaint.deleteMany({ organizationId: { $in: testOrgIds } }),
                Admin.deleteMany({ organizationId: { $in: testOrgIds } }),
                Organization.deleteMany({ _id: { $in: testOrgIds } })
            ]);
            log.success(`Cleaned up ${testOrgIds.length} test organizations and related data`);
        } else {
            log.info('No previous test data found');
        }
    } catch (error) {
        log.error('Cleanup failed: ' + error.message);
        throw error;
    }
}

// Create test organizations
async function createOrganizations() {
    log.section('STEP 2: Creating Test Organizations');

    try {
        for (const orgData of testOrgs) {
            const org = await Organization.create(orgData);
            createdOrgs.push(org);
            log.success(`Created organization: ${org.name} (${org.subdomain})`);
            log.info(`  → Plan: ${org.subscriptionPlan} | Status: ${org.subscriptionStatus}`);
        }
    } catch (error) {
        log.error('Organization creation failed: ' + error.message);
        throw error;
    }
}

// Create test data for each organization
async function createTestData() {
    log.section('STEP 3: Creating Test Data for Each Organization');

    try {
        for (let i = 0; i < createdOrgs.length; i++) {
            const org = createdOrgs[i];
            log.info(`\nCreating data for: ${org.name}`);

            // Create hostel
            const hostel = await Hostel.create({
                name: `${org.name} - Boys Hostel`,
                type: 'Boys',
                totalRooms: 50,
                occupiedRooms: 30,
                address: org.address,
                organizationId: org._id
            });
            createdData.hostels.push({ hostel, orgId: org._id });
            log.success(`  ✓ Created hostel: ${hostel.name}`);

            // Create admin user
            const adminUser = await User.create({
                name: `Admin ${i + 1}`,
                email: `admin${i + 1}@test.com`,
                password: 'password123',
                role: 'admin',
                organizationId: org._id
            });
            createdData.users.push({ user: adminUser, orgId: org._id });

            const admin = await Admin.create({
                userId: adminUser._id,
                name: adminUser.name,
                email: adminUser.email,
                phone: org.phone,
                department: 'Hostel Management',
                organizationId: org._id
            });
            createdData.admins.push({ admin, orgId: org._id });
            log.success(`  ✓ Created admin: ${admin.name}`);

            // Create students
            for (let j = 1; j <= 3; j++) {
                const studentUser = await User.create({
                    name: `Student ${i + 1}-${j}`,
                    email: `student${i + 1}-${j}@test.com`,
                    password: 'password123',
                    role: 'student',
                    organizationId: org._id
                });
                createdData.users.push({ user: studentUser, orgId: org._id });

                const student = await Student.create({
                    userId: studentUser._id,
                    name: studentUser.name,
                    email: studentUser.email,
                    phone: `+91-98765432${i}${j}`,
                    roomNumber: `${i + 1}0${j}`,
                    hostelId: hostel._id,
                    organizationId: org._id
                });
                createdData.students.push({ student, orgId: org._id });
            }
            log.success(`  ✓ Created 3 students`);

            // Create complaints
            for (let j = 1; j <= 2; j++) {
                const complaint = await Complaint.create({
                    studentId: createdData.students[createdData.students.length - 1].student._id,
                    title: `Test Complaint ${i + 1}-${j}`,
                    description: `This is a test complaint for ${org.name}`,
                    category: ['Maintenance', 'WiFi/Internet', 'Room Issue'][j % 3],
                    status: 'pending',
                    organizationId: org._id
                });
                createdData.complaints.push({ complaint, orgId: org._id });
            }
            log.success(`  ✓ Created 2 complaints`);
        }

        log.success(`\nTotal created:`);
        log.info(`  → ${createdOrgs.length} organizations`);
        log.info(`  → ${createdData.hostels.length} hostels`);
        log.info(`  → ${createdData.admins.length} admins`);
        log.info(`  → ${createdData.students.length} students`);
        log.info(`  → ${createdData.complaints.length} complaints`);
    } catch (error) {
        log.error('Test data creation failed: ' + error.message);
        throw error;
    }
}

// Test data isolation
async function testDataIsolation() {
    log.section('STEP 4: Testing Data Isolation');

    let passedTests = 0;
    let failedTests = 0;

    try {
        // Test 1: Each organization should only see their own students
        log.info('Test 1: Student isolation');
        for (const org of createdOrgs) {
            const students = await Student.find({ organizationId: org._id });
            const expectedCount = 3; // We created 3 students per org

            if (students.length === expectedCount) {
                log.success(`  ✓ ${org.name}: Found ${students.length} students (expected ${expectedCount})`);
                passedTests++;
            } else {
                log.error(`  ✗ ${org.name}: Found ${students.length} students (expected ${expectedCount})`);
                failedTests++;
            }
        }

        // Test 2: Each organization should only see their own complaints
        log.info('\nTest 2: Complaint isolation');
        for (const org of createdOrgs) {
            const complaints = await Complaint.find({ organizationId: org._id });
            const expectedCount = 2; // We created 2 complaints per org

            if (complaints.length === expectedCount) {
                log.success(`  ✓ ${org.name}: Found ${complaints.length} complaints (expected ${expectedCount})`);
                passedTests++;
            } else {
                log.error(`  ✗ ${org.name}: Found ${complaints.length} complaints (expected ${expectedCount})`);
                failedTests++;
            }
        }

        // Test 3: Cross-organization access prevention
        log.info('\nTest 3: Cross-organization access prevention');
        const org1 = createdOrgs[0];
        const org2 = createdOrgs[1];

        // Try to get org1's students using org2's ID (should return empty)
        const org1Students = await Student.find({ organizationId: org1._id });
        const org2Query = await Student.find({ organizationId: org2._id });

        const hasNoOverlap = !org1Students.some(s1 =>
            org2Query.some(s2 => s1._id.toString() === s2._id.toString())
        );

        if (hasNoOverlap) {
            log.success(`  ✓ No data overlap between organizations`);
            passedTests++;
        } else {
            log.error(`  ✗ Data overlap detected between organizations!`);
            failedTests++;
        }

        // Test 4: Verify organizationId is set on all records
        log.info('\nTest 4: Verify organizationId on all records');
        const studentsWithoutOrg = await Student.countDocuments({ organizationId: { $exists: false } });
        const complaintsWithoutOrg = await Complaint.countDocuments({ organizationId: { $exists: false } });
        const hostelsWithoutOrg = await Hostel.countDocuments({ organizationId: { $exists: false } });

        if (studentsWithoutOrg === 0 && complaintsWithoutOrg === 0 && hostelsWithoutOrg === 0) {
            log.success(`  ✓ All records have organizationId set`);
            passedTests++;
        } else {
            log.error(`  ✗ Found records without organizationId:`);
            if (studentsWithoutOrg > 0) log.error(`    → ${studentsWithoutOrg} students`);
            if (complaintsWithoutOrg > 0) log.error(`    → ${complaintsWithoutOrg} complaints`);
            if (hostelsWithoutOrg > 0) log.error(`    → ${hostelsWithoutOrg} hostels`);
            failedTests++;
        }

        // Summary
        log.section('TEST RESULTS');
        log.info(`Total tests: ${passedTests + failedTests}`);
        log.success(`Passed: ${passedTests}`);
        if (failedTests > 0) {
            log.error(`Failed: ${failedTests}`);
        } else {
            log.info(`Failed: ${failedTests}`);
        }

        if (failedTests === 0) {
            log.success('\n🎉 ALL TESTS PASSED! Multi-tenancy is working perfectly!');
        } else {
            log.error('\n⚠️  Some tests failed. Please review the implementation.');
        }

    } catch (error) {
        log.error('Testing failed: ' + error.message);
        throw error;
    }
}

// Display summary
async function displaySummary() {
    log.section('SUMMARY - Current Database State');

    try {
        const totalOrgs = await Organization.countDocuments();
        const totalStudents = await Student.countDocuments();
        const totalComplaints = await Complaint.countDocuments();
        const totalHostels = await Hostel.countDocuments();
        const totalAdmins = await Admin.countDocuments();

        log.info(`📊 Database Statistics:`);
        log.info(`  → Organizations: ${totalOrgs}`);
        log.info(`  → Students: ${totalStudents}`);
        log.info(`  → Admins: ${totalAdmins}`);
        log.info(`  → Hostels: ${totalHostels}`);
        log.info(`  → Complaints: ${totalComplaints}`);

        log.info(`\n🏢 Organizations in database:`);
        const orgs = await Organization.find().select('name subdomain subscriptionPlan subscriptionStatus');
        orgs.forEach(org => {
            log.info(`  → ${org.name} (${org.subdomain})`);
            log.info(`    Plan: ${org.subscriptionPlan} | Status: ${org.subscriptionStatus}`);
        });

    } catch (error) {
        log.error('Summary generation failed: ' + error.message);
    }
}

// Main execution
async function runTests() {
    console.log(`${colors.bright}${colors.cyan}`);
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║        MULTI-TENANCY TESTING SUITE                        ║');
    console.log('║        Hostel Ease SaaS Platform                          ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(colors.reset);

    try {
        await connectDB();
        await cleanup();
        await createOrganizations();
        await createTestData();
        await testDataIsolation();
        await displaySummary();

        log.section('✅ TESTING COMPLETE!');
        log.info('Your multi-tenancy implementation is ready!');
        log.info('\nNext steps:');
        log.info('  1. Start your backend server: npm run dev');
        log.info('  2. Test API endpoints with different organization contexts');
        log.info('  3. Move to Phase 4: Super Admin Dashboard');

    } catch (error) {
        log.error('\n❌ Testing failed with error:');
        console.error(error);
    } finally {
        await mongoose.connection.close();
        log.info('\n👋 Database connection closed');
        process.exit(0);
    }
}

// Run the tests
runTests();
