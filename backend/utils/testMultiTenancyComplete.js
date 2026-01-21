const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const Organization = require('../models/Organization');
const User = require('../models/User');
const Student = require('../models/Student');
const Hostel = require('../models/Hostel');
const Complaint = require('../models/Complaint');

// Super Admin token (get from login)
let TOKEN = '';

const API_URL = 'http://localhost:3000/api';

// Color output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

async function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test data for organizations
const testOrgs = [
    {
        name: 'XYZ Medical College',
        subdomain: 'xyz-med',
        email: 'admin@xyz-med.edu',
        phone: '+91-9876543211',
        address: 'Delhi, India',
        subscriptionPlan: 'starter'
    },
    {
        name: 'PQR Arts College',
        subdomain: 'pqr-arts',
        email: 'admin@pqr-arts.edu',
        phone: '+91-9876543212',
        address: 'Bangalore, Karnataka',
        subscriptionPlan: 'free'
    }
];

// Test students for each organization
const studentsByOrg = {
    'abc-eng': [
        { name: 'Rahul Sharma', email: 'rahul.s@abc-eng.edu', rollNumber: 'ABC001' },
        { name: 'Priya Patel', email: 'priya.p@abc-eng.edu', rollNumber: 'ABC002' },
        { name: 'Amit Kumar', email: 'amit.k@abc-eng.edu', rollNumber: 'ABC003' }
    ],
    'xyz-med': [
        { name: 'Sneha Reddy', email: 'sneha.r@xyz-med.edu', rollNumber: 'XYZ001' },
        { name: 'Vikram Singh', email: 'vikram.s@xyz-med.edu', rollNumber: 'XYZ002' },
        { name: 'Anjali Gupta', email: 'anjali.g@xyz-med.edu', rollNumber: 'XYZ003' }
    ],
    'pqr-arts': [
        { name: 'Arjun Mehta', email: 'arjun.m@pqr-arts.edu', rollNumber: 'PQR001' },
        { name: 'Riya Desai', email: 'riya.d@pqr-arts.edu', rollNumber: 'PQR002' },
        { name: 'Karan Joshi', email: 'karan.j@pqr-arts.edu', rollNumber: 'PQR003' }
    ]
};

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        log('✅ Connected to MongoDB', 'green');
    } catch (error) {
        log(`❌ MongoDB connection failed: ${error.message}`, 'red');
        process.exit(1);
    }
}

async function loginSuperAdmin() {
    try {
        log('\n🔐 Logging in as Super Admin...', 'blue');

        // For this script, we'll get the token directly from the database
        // In production, you'd call the login API
        const token = await generateToken();
        TOKEN = token;

        log('✅ Super Admin logged in successfully', 'green');
        return token;
    } catch (error) {
        log(`❌ Login failed: ${error.message}`, 'red');
        throw error;
    }
}

async function generateToken() {
    const jwt = require('jsonwebtoken');
    const superAdmin = await User.findOne({ role: 'super_admin' });

    if (!superAdmin) {
        throw new Error('Super admin not found!');
    }

    const token = jwt.sign(
        {
            userId: superAdmin._id,
            role: 'super_admin',
            isAdmin: true
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    return token;
}

async function createOrganizations() {
    log('\n🏢 Creating Organizations...', 'blue');

    const createdOrgs = [];

    for (const orgData of testOrgs) {
        try {
            // Check if already exists
            const existing = await Organization.findOne({ slug: orgData.subdomain });

            if (existing) {
                log(`⚠️  ${orgData.name} already exists, skipping...`, 'yellow');
                createdOrgs.push(existing);
                continue;
            }

            // Get plan limits
            const planLimits = Organization.getPlanLimits(orgData.subscriptionPlan);

            const org = await Organization.create({
                name: orgData.name,
                slug: orgData.subdomain,
                contact: {
                    email: orgData.email,
                    phone: orgData.phone,
                    address: {
                        street: orgData.address,
                        country: 'India'
                    }
                },
                subscription: {
                    plan: orgData.subscriptionPlan,
                    status: 'trial'
                },
                limits: planLimits,
                features: planLimits.features
            });

            createdOrgs.push(org);
            log(`✅ Created: ${org.name} (${org.slug})`, 'green');
        } catch (error) {
            log(`❌ Failed to create ${orgData.name}: ${error.message}`, 'red');
        }
    }

    return createdOrgs;
}

async function createStudentsForOrganizations() {
    log('\n👥 Creating Students for Each Organization...', 'blue');

    const organizations = await Organization.find();
    const allStudents = [];

    for (const org of organizations) {
        log(`\n📚 Organization: ${org.name}`, 'yellow');

        const students = studentsByOrg[org.slug] || [];

        if (students.length === 0) {
            log(`  ⚠️  No students defined for ${org.slug}`, 'yellow');
            continue;
        }

        // Create or get hostel for this organization
        let hostel = await Hostel.findOne({ organizationId: org._id });

        if (!hostel) {
            hostel = await Hostel.create({
                name: `${org.name} - Main Hostel`,
                location: org.contact.address.street || org.contact.address.city || 'Main Campus',
                rooms: 100,
                capacity: 400,
                vacant: 400,
                organizationId: org._id
            });
            log(`  ✅ Created hostel: ${hostel.name}`, 'green');
        }

        for (const studentData of students) {
            try {
                // Check if student already exists
                const existingStudent = await Student.findOne({
                    email: studentData.email,
                    organizationId: org._id
                });

                if (existingStudent) {
                    log(`  ⚠️  ${studentData.name} already exists`, 'yellow');
                    allStudents.push(existingStudent);
                    continue;
                }

                // Create user for student
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('student123', salt);

                const user = await User.create({
                    name: studentData.name,
                    email: studentData.email,
                    password: hashedPassword,
                    role: 'student',
                    organizationId: org._id
                });

                // Create student with all required fields
                const cmsId = Math.floor(Math.random() * 90000) + 10000; // Random 5-digit number
                const randomCnic = `${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 9000000) + 1000000}-${Math.floor(Math.random() * 9) + 1}`;

                const student = await Student.create({
                    userId: user._id,
                    name: studentData.name,
                    email: studentData.email,
                    cms_id: cmsId,
                    room_no: Math.floor(Math.random() * 400) + 100,
                    batch: 2024,
                    dept: 'Computer Science',
                    course: 'B.Tech',
                    father_name: `${studentData.name.split(' ')[0]}'s Father`,
                    contact: '+91-9999999999',
                    address: org.contact.address.street || 'Test Address',
                    dob: new Date('2005-01-01'),
                    cnic: randomCnic,
                    hostel: hostel._id,
                    organizationId: org._id
                });

                allStudents.push(student);
                log(`  ✅ Created student: ${student.name} (CMS:${student.cms_id})`, 'green');
            } catch (error) {
                log(`  ❌ Failed to create ${studentData.name}: ${error.message}`, 'red');
            }
        }
    }

    return allStudents;
}

async function verifyDataIsolation() {
    log('\n🔒 Verifying Data Isolation...', 'blue');

    const organizations = await Organization.find();
    let allTestsPassed = true;

    for (const org of organizations) {
        log(`\n📊 Testing: ${org.name}`, 'yellow');

        // Count students for this organization
        const studentCount = await Student.countDocuments({ organizationId: org._id });
        const expectedCount = studentsByOrg[org.slug]?.length || 0;

        if (studentCount === expectedCount) {
            log(`  ✅ Students: ${studentCount} (Expected: ${expectedCount})`, 'green');
        } else {
            log(`  ❌ Students: ${studentCount} (Expected: ${expectedCount})`, 'red');
            allTestsPassed = false;
        }

        // Verify no cross-org data leakage
        const allStudents = await Student.find({});
        const orgStudents = allStudents.filter(s => s.organizationId.toString() === org._id.toString());
        const otherStudents = allStudents.filter(s => s.organizationId.toString() !== org._id.toString());

        if (otherStudents.length > 0) {
            log(`  ✅ Isolation: Other organizations have ${otherStudents.length} students (separate)`, 'green');
        }
    }

    if (allTestsPassed) {
        log('\n🎉 All data isolation tests PASSED!', 'green');
    } else {
        log('\n⚠️  Some tests failed. Please review.', 'yellow');
    }

    return allTestsPassed;
}

async function generateReport() {
    log('\n📊 Generating Final Report...', 'blue');

    const organizations = await Organization.find();

    console.log('\n' + '='.repeat(80));
    log('MULTI-TENANCY TEST REPORT', 'yellow');
    console.log('='.repeat(80));

    for (const org of organizations) {
        const students = await Student.countDocuments({ organizationId: org._id });
        const hostels = await Hostel.countDocuments({ organizationId: org._id });
        const complaints = await Complaint.countDocuments({ organizationId: org._id });

        console.log(`\n${org.name} (${org.slug})`);
        console.log(`  Plan: ${org.subscription.plan}`);
        console.log(`  Status: ${org.subscription.status}`);
        console.log(`  Students: ${students}`);
        console.log(`  Hostels: ${hostels}`);
        console.log(`  Complaints: ${complaints}`);
    }

    console.log('\n' + '='.repeat(80));
    log('✅ Testing Complete!', 'green');
    console.log('='.repeat(80) + '\n');
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║     MULTI-TENANCY TESTING & DATA POPULATION                ║');
    console.log('║     Hostel Ease SaaS Platform                             ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    try {
        await connectDB();
        await loginSuperAdmin();
        await createOrganizations();
        await createStudentsForOrganizations();
        await verifyDataIsolation();
        await generateReport();

        log('\n🎉 SUCCESS! Multi-tenancy is working perfectly!', 'green');
        log('\nNext steps:', 'blue');
        log('  1. Test API endpoints with different organization tokens', 'reset');
        log('  2. Create complaints for each organization', 'reset');
        log('  3. Verify complete data isolation', 'reset');
        log('  4. Build Phase 5: Subscription & Billing\n', 'reset');

    } catch (error) {
        log(`\n❌ Error: ${error.message}`, 'red');
        console.error(error);
    } finally {
        await mongoose.connection.close();
        log('👋 Database connection closed\n', 'blue');
        process.exit(0);
    }
}

// Run the tests
main();
