/**
 * Production Data Seeding Script
 * Seeds comprehensive demo data for all dashboards
 * Run with: node seedProductionData.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const Organization = require('./models/Organization');
const User = require('./models/User');
const Student = require('./models/Student');
const Admin = require('./models/Admin');
const Hostel = require('./models/Hostel');
const Complaint = require('./models/Complaint');
const Suggestion = require('./models/Suggestion');
const Invoice = require('./models/Invoice');
const Attendance = require('./models/Attendance');
const MessOff = require('./models/MessOff');

const colors = {
    reset: '\x1b[0m',
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
    section: (msg) => console.log(`\n${colors.cyan}━━━ ${msg} ━━━${colors.reset}\n`)
};

async function seedData() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         PRODUCTION DATA SEEDING SCRIPT                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        log.success('Connected to MongoDB');

        // ═══════════════════════════════════════════════════════════════
        // STEP 1: Create/Update Organization
        // ═══════════════════════════════════════════════════════════════
        log.section('STEP 1: Creating Organization');

        let org = await Organization.findOne({ slug: 'abc-eng' });
        if (!org) {
            org = await Organization.create({
                name: 'ABC Engineering College',
                slug: 'abc-eng',
                type: 'college',
                contact: {
                    email: 'admin@abc-eng.edu',
                    phone: '+91-9876543210',
                    address: { city: 'Mumbai', state: 'Maharashtra', country: 'India' }
                },
                subscription: { plan: 'professional', status: 'active' },
                limits: { maxStudents: 1000, maxAdmins: 10, maxRooms: 500 },
                features: { aiChatbot: true, analytics: true },
                isActive: true
            });
            log.success(`Created organization: ${org.name}`);
        } else {
            log.info(`Organization exists: ${org.name}`);
        }

        // ═══════════════════════════════════════════════════════════════
        // STEP 2: Create Hostel
        // ═══════════════════════════════════════════════════════════════
        log.section('STEP 2: Creating Hostel');

        let hostel = await Hostel.findOne({ organizationId: org._id });
        if (!hostel) {
            hostel = await Hostel.create({
                name: 'ABC Boys Hostel - Block A',
                type: 'Boys',
                totalRooms: 100,
                occupiedRooms: 75,
                address: 'Campus Road, Mumbai',
                organizationId: org._id
            });
            log.success(`Created hostel: ${hostel.name}`);
        } else {
            log.info(`Hostel exists: ${hostel.name}`);
        }

        // ═══════════════════════════════════════════════════════════════
        // STEP 3: Create Admin User
        // ══════════════════════════════════════════════════════════════
        log.section('STEP 3: Creating Admin');

        let adminUser = await User.findOne({ email: 'admin@abc-eng.edu' });
        if (!adminUser) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            adminUser = await User.create({
                name: 'Hostel Admin',
                email: 'admin@abc-eng.edu',
                password: hashedPassword,
                role: 'admin',
                organizationId: org._id
            });
            log.success('Created admin user');
        } else {
            log.info('Admin user exists');
        }

        let admin = await Admin.findOne({ email: 'admin@abc-eng.edu' });
        if (!admin) {
            admin = await Admin.create({
                user: adminUser._id,
                name: 'Hostel Admin',
                email: 'admin@abc-eng.edu',
                phone: '+91-9876543210',
                hostel: hostel._id,
                organizationId: org._id
            });
            log.success('Created admin profile');
        } else {
            log.info('Admin profile exists');
        }

        // ═══════════════════════════════════════════════════════════════
        // STEP 4: Create Students
        // ═══════════════════════════════════════════════════════════════
        log.section('STEP 4: Creating Students');

        const studentData = [
            { name: 'Rahul Sharma', email: 'rahul.s@abc-eng.edu', room_no: 101, contact: '+91-9876543211', cms_id: 2021001, batch: 2021, dept: 'Computer Science', course: 'B.Tech', father_name: 'Suresh Sharma', address: '123 Main Street, Mumbai', dob: new Date('2002-05-15'), cnic: 'ABC2021001' },
            { name: 'Priya Patel', email: 'priya.p@abc-eng.edu', room_no: 102, contact: '+91-9876543212', cms_id: 2021002, batch: 2021, dept: 'Electronics', course: 'B.Tech', father_name: 'Rajesh Patel', address: '456 Park Avenue, Mumbai', dob: new Date('2002-08-20'), cnic: 'ABC2021002' },
            { name: 'Amit Kumar', email: 'amit.k@abc-eng.edu', room_no: 103, contact: '+91-9876543213', cms_id: 2021003, batch: 2021, dept: 'Mechanical', course: 'B.Tech', father_name: 'Ramesh Kumar', address: '789 College Road, Mumbai', dob: new Date('2002-03-10'), cnic: 'ABC2021003' },
            { name: 'Sneha Reddy', email: 'sneha.r@abc-eng.edu', room_no: 104, contact: '+91-9876543214', cms_id: 2022001, batch: 2022, dept: 'IT', course: 'B.Tech', father_name: 'Venkat Reddy', address: '321 Tech Park, Mumbai', dob: new Date('2003-01-25'), cnic: 'ABC2022001' },
            { name: 'Vikram Singh', email: 'vikram.s@abc-eng.edu', room_no: 105, contact: '+91-9876543215', cms_id: 2022002, batch: 2022, dept: 'Civil', course: 'B.Tech', father_name: 'Harpreet Singh', address: '654 Engineering Lane, Mumbai', dob: new Date('2003-07-12'), cnic: 'ABC2022002' }
        ];

        const createdStudents = [];
        for (const data of studentData) {
            let studentUser = await User.findOne({ email: data.email });
            if (!studentUser) {
                const hashedPassword = await bcrypt.hash('student123', 10);
                studentUser = await User.create({
                    name: data.name,
                    email: data.email,
                    password: hashedPassword,
                    role: 'student',
                    organizationId: org._id
                });
            }

            let student = await Student.findOne({ email: data.email });
            if (!student) {
                student = await Student.create({
                    user: studentUser._id,
                    name: data.name,
                    email: data.email,
                    contact: data.contact,
                    room_no: data.room_no,
                    cms_id: data.cms_id,
                    batch: data.batch,
                    dept: data.dept,
                    course: data.course,
                    father_name: data.father_name,
                    address: data.address,
                    dob: data.dob,
                    cnic: data.cnic,
                    hostel: hostel._id,
                    organizationId: org._id
                });
                log.success(`Created student: ${data.name}`);
            } else {
                log.info(`Student exists: ${data.name}`);
            }
            createdStudents.push(student);
        }

        // ═══════════════════════════════════════════════════════════════
        // STEP 5: Create Complaints (with required 'type' field)
        // ═══════════════════════════════════════════════════════════════
        log.section('STEP 5: Creating Complaints');

        const complaintData = [
            { type: 'Technical', title: 'WiFi Not Working', description: 'Internet connection is very slow in Room 101', category: 'WiFi/Internet', status: 'pending', urgencyLevel: 'high' },
            { type: 'Infrastructure', title: 'Broken Fan', description: 'Ceiling fan in Room 102 is making noise', category: 'Maintenance', status: 'in_progress', urgencyLevel: 'medium' },
            { type: 'Infrastructure', title: 'Water Leakage', description: 'There is water leakage in the bathroom', category: 'Plumbing', status: 'resolved', urgencyLevel: 'high' },
            { type: 'Infrastructure', title: 'Light Not Working', description: 'Tube light in corridor B is not working', category: 'Electrical', status: 'pending', urgencyLevel: 'low' },
            { type: 'Technical', title: 'AC Issue', description: 'Air conditioner not cooling properly', category: 'Maintenance', status: 'pending', urgencyLevel: 'medium' }
        ];

        const existingComplaints = await Complaint.countDocuments({ organizationId: org._id });
        if (existingComplaints < 5) {
            for (let i = 0; i < complaintData.length; i++) {
                const data = complaintData[i];
                const student = createdStudents[i % createdStudents.length];

                await Complaint.create({
                    student: student.user || student._id,
                    hostel: hostel._id,
                    type: data.type,
                    title: data.title,
                    description: data.description,
                    category: data.category,
                    status: data.status,
                    urgencyLevel: data.urgencyLevel,
                    organizationId: org._id,
                    date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
                });
                log.success(`Created complaint: ${data.title}`);
            }
        } else {
            log.info(`${existingComplaints} complaints already exist`);
        }

        // ═══════════════════════════════════════════════════════════════
        // STEP 6: Create Suggestions
        // ═══════════════════════════════════════════════════════════════
        log.section('STEP 6: Creating Suggestions');

        const suggestionData = [
            { title: 'Better WiFi', description: 'Please upgrade the WiFi router for better connectivity', status: 'pending' },
            { title: 'Gym Equipment', description: 'Add more gym equipment to the hostel gym', status: 'pending' },
            { title: 'Study Room Hours', description: 'Extend study room hours till midnight', status: 'approved' }
        ];

        const existingSuggestions = await Suggestion.countDocuments({ hostel: hostel._id });
        if (existingSuggestions < 3) {
            for (let i = 0; i < suggestionData.length; i++) {
                const data = suggestionData[i];
                const student = createdStudents[i % createdStudents.length];

                await Suggestion.create({
                    student: student._id,
                    hostel: hostel._id,
                    title: data.title,
                    description: data.description,
                    status: data.status,
                    organizationId: org._id
                });
                log.success(`Created suggestion: ${data.title}`);
            }
        } else {
            log.info(`${existingSuggestions} suggestions already exist`);
        }

        // ═══════════════════════════════════════════════════════════════
        // STEP 7: Create Invoices
        // ═══════════════════════════════════════════════════════════════
        log.section('STEP 7: Creating Invoices');

        const existingInvoices = await Invoice.countDocuments({ organizationId: org._id });
        if (existingInvoices < 3) {
            for (let i = 0; i < 3; i++) {
                const student = createdStudents[i];
                await Invoice.create({
                    student: student._id,
                    title: ['January Mess Fee', 'February Mess Fee', 'March Mess Fee'][i],
                    amount: 15000 + Math.floor(Math.random() * 5000),
                    status: ['paid', 'pending', 'pending'][i],
                    organizationId: org._id
                });
                log.success(`Created invoice for: ${student.name}`);
            }
        } else {
            log.info(`${existingInvoices} invoices already exist`);
        }

        // ═══════════════════════════════════════════════════════════════
        // STEP 8: Create Mess Off Requests
        // ═══════════════════════════════════════════════════════════════
        log.section('STEP 8: Creating Mess Off Requests');

        const existingMessOff = await MessOff.countDocuments({ organizationId: org._id });
        if (existingMessOff < 2) {
            for (let i = 0; i < 2; i++) {
                const student = createdStudents[i];
                await MessOff.create({
                    student: student._id,
                    hostel: hostel._id,
                    leaving_date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
                    return_date: new Date(Date.now() + (i + 5) * 24 * 60 * 60 * 1000),
                    reason: ['Going home for festival', 'Medical appointment'][i],
                    status: 'pending',
                    organizationId: org._id
                });
                log.success(`Created mess-off request for: ${student.name}`);
            }
        } else {
            log.info(`${existingMessOff} mess-off requests already exist`);
        }

        // ═══════════════════════════════════════════════════════════════
        // STEP 9: Create Attendance Records (with 'status' not 'present')
        // ═══════════════════════════════════════════════════════════════
        log.section('STEP 9: Creating Attendance Records');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existingAttendance = await Attendance.countDocuments({ organizationId: org._id });
        if (existingAttendance < createdStudents.length) {
            for (const student of createdStudents) {
                const existing = await Attendance.findOne({
                    student: student._id,
                    date: { $gte: today }
                });

                if (!existing) {
                    await Attendance.create({
                        student: student._id,
                        date: today,
                        status: Math.random() > 0.2 ? 'present' : 'absent',
                        organizationId: org._id
                    });
                }
            }
            log.success(`Created attendance records for ${createdStudents.length} students`);
        } else {
            log.info('Attendance records already exist');
        }

        // ═══════════════════════════════════════════════════════════════
        // SUMMARY
        // ═══════════════════════════════════════════════════════════════
        log.section('SEEDING COMPLETE - SUMMARY');

        const finalCounts = {
            organizations: await Organization.countDocuments(),
            hostels: await Hostel.countDocuments(),
            students: await Student.countDocuments({ organizationId: org._id }),
            admins: await Admin.countDocuments({ organizationId: org._id }),
            complaints: await Complaint.countDocuments({ organizationId: org._id }),
            suggestions: await Suggestion.countDocuments({ hostel: hostel._id }),
            invoices: await Invoice.countDocuments({ organizationId: org._id }),
            messOffRequests: await MessOff.countDocuments({ organizationId: org._id })
        };

        log.info('📊 Database Statistics:');
        console.log(`   Organizations: ${finalCounts.organizations}`);
        console.log(`   Hostels: ${finalCounts.hostels}`);
        console.log(`   Students: ${finalCounts.students}`);
        console.log(`   Admins: ${finalCounts.admins}`);
        console.log(`   Complaints: ${finalCounts.complaints}`);
        console.log(`   Suggestions: ${finalCounts.suggestions}`);
        console.log(`   Invoices: ${finalCounts.invoices}`);
        console.log(`   Mess-Off Requests: ${finalCounts.messOffRequests}`);

        log.info('\n📝 Test Credentials:');
        console.log('   Admin:   admin@abc-eng.edu / admin123');
        console.log('   Student: rahul.s@abc-eng.edu / student123');

        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║         ✅ DATA SEEDING COMPLETED SUCCESSFULLY!            ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

    } catch (error) {
        log.error('Seeding failed: ' + error.message);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        log.info('Database connection closed');
        process.exit(0);
    }
}

seedData();
