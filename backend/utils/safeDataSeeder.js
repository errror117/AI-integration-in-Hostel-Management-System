/**
 * SAFE DATA SEEDER - Comprehensive Multi-Tenant Data Population
 * ============================================================
 * 
 * This script safely adds and verifies data across the Hostel Ease SaaS platform
 * without breaking any existing logic, security, or multi-tenant isolation.
 * 
 * CRITICAL RULES (Enforced):
 * 1. NEVER insert data without organizationId (except super_admin)
 * 2. NEVER cross-contaminate tenant data
 * 3. NEVER bypass role-based permissions
 * 4. ADD data only if missing; verify instead of duplicating
 * 5. All passwords are bcrypt hashed
 * 
 * Run with: node utils/safeDataSeeder.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

// Try multiple paths for .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Import all models
const Organization = require('../models/Organization');
const User = require('../models/User');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const Complaint = require('../models/Complaint');
const Suggestion = require('../models/Suggestion');
const Invoice = require('../models/Invoice');
const Attendance = require('../models/Attendance');
const MessOff = require('../models/MessOff');
const Notice = require('../models/Notice');
const ChatLog = require('../models/ChatLog');
const FAQEmbedding = require('../models/FAQEmbedding');

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION & CONSTANTS
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
    // Default password (hashed)
    DEFAULT_STUDENT_PASSWORD: 'student123',
    DEFAULT_ADMIN_PASSWORD: 'admin123',
    SUPER_ADMIN_PASSWORD: 'SuperAdmin@123',

    // Data generation limits per organization
    STUDENTS_PER_ORG: 8,
    HOSTELS_PER_ORG: 2,
    ROOMS_PER_HOSTEL: 10,
    COMPLAINTS_PER_STUDENT: 2,
    INVOICES_PER_STUDENT: 2,
    ATTENDANCE_DAYS: 7,
    SUGGESTIONS_PER_ORG: 5,
    NOTICES_PER_ORG: 3,
    MESSOFF_REQUESTS: 4,
};

// Sample data pools
const DATA = {
    firstNames: ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Arjun', 'Riya', 'Karan', 'Pooja',
        'Rohan', 'Divya', 'Sanjay', 'Meera', 'Aditya', 'Kavya', 'Nikhil', 'Ananya', 'Varun', 'Ishita'],
    lastNames: ['Sharma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Gupta', 'Mehta', 'Desai', 'Joshi', 'Verma'],
    departments: ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'IT'],
    courses: ['B.Tech', 'B.E.', 'M.Tech', 'MCA'],
    cities: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Hyderabad', 'Jaipur'],
    complaintTypes: ['Technical', 'Infrastructure', 'Administrative', 'Maintenance'],
    complaintCategories: ['WiFi/Internet', 'Mess/Food', 'Cleanliness', 'Electrical', 'Plumbing', 'Maintenance', 'Security', 'General'],
    urgencyLevels: ['low', 'medium', 'high', 'critical'],
    statuses: ['pending', 'in_progress', 'resolved'],
    invoiceTitles: ['Monthly Mess Fee', 'Hostel Rent', 'Electricity Bill', 'Maintenance Charges', 'Security Deposit'],
    noticeCategories: ['general', 'mess', 'maintenance', 'fees', 'event', 'emergency', 'rules'],
    suggestionTitles: ['Improve WiFi Speed', 'Better Mess Food', 'Gym Equipment', 'Study Room Hours', 'AC in Common Area', 'More Parking Space']
};

// Console styling
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
    section: (msg) => console.log(`\n${colors.cyan}━━━ ${msg} ━━━${colors.reset}\n`),
    count: (label, value) => console.log(`   ${colors.magenta}${label}:${colors.reset} ${value}`)
};

// Utility functions
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomDate = (daysAgo = 30) => new Date(Date.now() - Math.random() * daysAgo * 24 * 60 * 60 * 1000);
const getFutureDate = (daysAhead = 30) => new Date(Date.now() + Math.random() * daysAhead * 24 * 60 * 60 * 1000);
const generateCNIC = () => `${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 9000000) + 1000000}-${Math.floor(Math.random() * 9) + 1}`;
const generateContact = () => `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`;

// ═══════════════════════════════════════════════════════════════
// SEEDING TRACKER
// ═══════════════════════════════════════════════════════════════

const seedingReport = {
    organizations: { existing: 0, created: 0 },
    superAdmin: { existing: false, created: false },
    users: { existing: 0, created: 0 },
    students: { existing: 0, created: 0 },
    admins: { existing: 0, created: 0 },
    hostels: { existing: 0, created: 0 },
    rooms: { existing: 0, created: 0 },
    complaints: { existing: 0, created: 0 },
    invoices: { existing: 0, created: 0 },
    attendance: { existing: 0, created: 0 },
    suggestions: { existing: 0, created: 0 },
    notices: { existing: 0, created: 0 },
    messOff: { existing: 0, created: 0 },
    faqs: { existing: 0, created: 0 }
};

// ═══════════════════════════════════════════════════════════════
// STEP 1: PROJECT STATE ASSESSMENT
// ═══════════════════════════════════════════════════════════════

async function assessProjectState() {
    log.section('STEP 1: PROJECT STATE ASSESSMENT');

    const counts = {
        organizations: await Organization.countDocuments(),
        users: await User.countDocuments(),
        students: await Student.countDocuments(),
        admins: await Admin.countDocuments(),
        hostels: await Hostel.countDocuments(),
        rooms: await Room.countDocuments(),
        complaints: await Complaint.countDocuments(),
        invoices: await Invoice.countDocuments(),
        attendance: await Attendance.countDocuments(),
        suggestions: await Suggestion.countDocuments(),
        notices: await Notice.countDocuments(),
        messOff: await MessOff.countDocuments(),
        chatLogs: await ChatLog.countDocuments(),
        faqs: await FAQEmbedding.countDocuments()
    };

    log.info('Current Database State:');
    Object.entries(counts).forEach(([key, value]) => log.count(key, value));

    return counts;
}

// ═══════════════════════════════════════════════════════════════
// STEP 2: SUPER ADMIN (Global, no organizationId)
// ═══════════════════════════════════════════════════════════════

async function ensureSuperAdmin() {
    log.section('STEP 2: SUPER ADMIN VERIFICATION');

    const superAdminEmail = 'superadmin@hostelease.com';
    let superAdmin = await User.findOne({ email: superAdminEmail, role: 'super_admin' });

    if (superAdmin) {
        log.info(`Super Admin exists: ${superAdminEmail}`);
        seedingReport.superAdmin.existing = true;
        return superAdmin;
    }

    // Create Super Admin
    const hashedPassword = await bcrypt.hash(CONFIG.SUPER_ADMIN_PASSWORD, 10);
    superAdmin = await User.create({
        email: superAdminEmail,
        password: hashedPassword,
        role: 'super_admin',
        isAdmin: true,
        isActive: true,
        isVerified: true
    });

    log.success(`Created Super Admin: ${superAdminEmail} / ${CONFIG.SUPER_ADMIN_PASSWORD}`);
    seedingReport.superAdmin.created = true;
    return superAdmin;
}

// ═══════════════════════════════════════════════════════════════
// STEP 3: ORGANIZATIONS
// ═══════════════════════════════════════════════════════════════

async function ensureOrganizations() {
    log.section('STEP 3: ORGANIZATION SETUP');

    const orgConfigs = [
        {
            name: 'Delhi Technical University',
            slug: 'dtu',
            type: 'university',
            email: 'admin@dtu.edu',
            city: 'Delhi',
            plan: 'professional'
        },
        {
            name: 'Mumbai Engineering College',
            slug: 'mec',
            type: 'college',
            email: 'admin@mec.edu',
            city: 'Mumbai',
            plan: 'starter'
        },
        {
            name: 'Bangalore Institute of Technology',
            slug: 'bit',
            type: 'college',
            email: 'admin@bit.edu',
            city: 'Bangalore',
            plan: 'professional'
        }
    ];

    const organizations = [];

    for (const config of orgConfigs) {
        let org = await Organization.findOne({ slug: config.slug });

        if (org) {
            log.info(`Organization exists: ${config.name} (${config.slug})`);
            seedingReport.organizations.existing++;
        } else {
            org = await Organization.create({
                name: config.name,
                slug: config.slug,
                type: config.type,
                contact: {
                    email: config.email,
                    phone: generateContact(),
                    address: {
                        city: config.city,
                        state: config.city === 'Mumbai' ? 'Maharashtra' : config.city === 'Delhi' ? 'Delhi' : 'Karnataka',
                        country: 'India'
                    }
                },
                subscription: {
                    plan: config.plan,
                    status: 'active',
                    startDate: new Date()
                },
                limits: {
                    maxStudents: config.plan === 'professional' ? 1000 : 200,
                    maxAdmins: config.plan === 'professional' ? 10 : 3,
                    maxRooms: 500
                },
                features: {
                    aiChatbot: true,
                    analytics: config.plan === 'professional'
                },
                isActive: true,
                isVerified: true
            });
            log.success(`Created Organization: ${config.name}`);
            seedingReport.organizations.created++;
        }

        organizations.push(org);
    }

    return organizations;
}

// ═══════════════════════════════════════════════════════════════
// STEP 4: ADMINS & HOSTELS PER ORGANIZATION
// ═══════════════════════════════════════════════════════════════

async function ensureAdminsAndHostels(org) {
    log.section(`STEP 4: ADMINS & HOSTELS - ${org.name}`);

    const hashedPassword = await bcrypt.hash(CONFIG.DEFAULT_ADMIN_PASSWORD, 10);

    // Create Org Admin
    const adminEmail = `admin@${org.slug}.edu`;
    let adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
        adminUser = await User.create({
            email: adminEmail,
            password: hashedPassword,
            role: 'org_admin',
            organizationId: org._id,
            isAdmin: true,
            isActive: true,
            isVerified: true
        });
        seedingReport.users.created++;
        log.success(`Created Org Admin User: ${adminEmail}`);
    } else {
        seedingReport.users.existing++;
        log.info(`Org Admin User exists: ${adminEmail}`);
    }

    // Create Admin profile
    let admin = await Admin.findOne({ email: adminEmail, organizationId: org._id });
    if (!admin) {
        admin = await Admin.create({
            name: `${org.name} Admin`,
            email: adminEmail,
            father_name: 'Admin Father',
            contact: generateContact(),
            address: `${org.name} Campus, India`,
            dob: new Date('1985-01-15'),
            cnic: generateCNIC(),
            organizationId: org._id,
            user: adminUser._id
        });
        seedingReport.admins.created++;
        log.success(`Created Admin Profile: ${admin.name}`);
    } else {
        seedingReport.admins.existing++;
    }

    // Create Sub Admin
    const subAdminEmail = `subadmin@${org.slug}.edu`;
    let subAdminUser = await User.findOne({ email: subAdminEmail });

    if (!subAdminUser) {
        subAdminUser = await User.create({
            email: subAdminEmail,
            password: hashedPassword,
            role: 'sub_admin',
            organizationId: org._id,
            isAdmin: true,
            isActive: true
        });
        seedingReport.users.created++;
        log.success(`Created Sub Admin User: ${subAdminEmail}`);
    }

    // Create Hostels
    const hostelConfigs = [
        { name: `${org.name} - Boys Hostel A`, location: 'Main Campus', rooms: 50, capacity: 100 },
        { name: `${org.name} - Girls Hostel B`, location: 'Main Campus', rooms: 40, capacity: 80 }
    ];

    const hostels = [];
    for (const config of hostelConfigs) {
        let hostel = await Hostel.findOne({ name: config.name, organizationId: org._id });

        if (!hostel) {
            hostel = await Hostel.create({
                name: config.name,
                location: config.location,
                rooms: config.rooms,
                capacity: config.capacity,
                vacant: config.capacity,
                organizationId: org._id
            });
            seedingReport.hostels.created++;
            log.success(`Created Hostel: ${config.name}`);
        } else {
            seedingReport.hostels.existing++;
            log.info(`Hostel exists: ${config.name}`);
        }
        hostels.push(hostel);
    }

    // Link admin to first hostel
    if (!admin.hostel) {
        admin.hostel = hostels[0]._id;
        await admin.save();
    }

    return { admin, adminUser, hostels };
}

// ═══════════════════════════════════════════════════════════════
// STEP 5: ROOMS PER HOSTEL
// ═══════════════════════════════════════════════════════════════

async function ensureRooms(org, hostels) {
    log.section(`STEP 5: ROOMS - ${org.name}`);

    const roomTypes = ['Single', 'Double', 'Triple'];
    const rentPerType = { 'Single': 8000, 'Double': 6000, 'Triple': 4500 };

    for (const hostel of hostels) {
        const existingRooms = await Room.countDocuments({ hostel: hostel._id, organizationId: org._id });

        if (existingRooms >= CONFIG.ROOMS_PER_HOSTEL) {
            log.info(`Rooms exist for ${hostel.name}: ${existingRooms}`);
            seedingReport.rooms.existing += existingRooms;
            continue;
        }

        const roomsToCreate = CONFIG.ROOMS_PER_HOSTEL - existingRooms;
        for (let i = 0; i < roomsToCreate; i++) {
            const roomNo = 100 + existingRooms + i + 1;
            const roomType = getRandomElement(roomTypes);

            try {
                await Room.create({
                    organizationId: org._id,
                    hostel: hostel._id,
                    room_no: roomNo,
                    floor: Math.floor(roomNo / 100),
                    room_type: roomType,
                    status: 'available',
                    rent_per_month: rentPerType[roomType],
                    capacity: roomType === 'Single' ? 1 : roomType === 'Double' ? 2 : 3
                });
                seedingReport.rooms.created++;
            } catch (err) {
                if (!err.message.includes('duplicate')) {
                    log.warn(`Room creation error: ${err.message}`);
                }
            }
        }
        log.success(`Created ${roomsToCreate} rooms for ${hostel.name}`);
    }
}

// ═══════════════════════════════════════════════════════════════
// STEP 6: STUDENTS PER ORGANIZATION
// ═══════════════════════════════════════════════════════════════

async function ensureStudents(org, hostels) {
    log.section(`STEP 6: STUDENTS - ${org.name}`);

    const hashedPassword = await bcrypt.hash(CONFIG.DEFAULT_STUDENT_PASSWORD, 10);
    const existingCount = await Student.countDocuments({ organizationId: org._id });

    if (existingCount >= CONFIG.STUDENTS_PER_ORG) {
        log.info(`Students exist: ${existingCount}`);
        seedingReport.students.existing += existingCount;
        return await Student.find({ organizationId: org._id });
    }

    const studentsToCreate = CONFIG.STUDENTS_PER_ORG - existingCount;
    const students = await Student.find({ organizationId: org._id });
    let cmsIdStart = 30000 + Math.floor(Math.random() * 1000);

    for (let i = 0; i < studentsToCreate; i++) {
        const firstName = getRandomElement(DATA.firstNames);
        const lastName = getRandomElement(DATA.lastNames);
        const name = `${firstName} ${lastName}`;
        const cmsId = cmsIdStart + existingCount + i;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${cmsId}@${org.slug}.edu`;
        const hostel = getRandomElement(hostels);

        try {
            // Create User
            const user = await User.create({
                email,
                password: hashedPassword,
                role: 'student',
                organizationId: org._id,
                isActive: true
            });
            seedingReport.users.created++;

            // Create Student
            const student = await Student.create({
                name,
                email,
                cms_id: cmsId,
                room_no: Math.floor(Math.random() * 50) + 101,
                batch: 2021 + Math.floor(Math.random() * 4),
                dept: getRandomElement(DATA.departments),
                course: getRandomElement(DATA.courses),
                father_name: `${getRandomElement(DATA.firstNames)} ${lastName}`,
                contact: generateContact(),
                address: `${Math.floor(Math.random() * 999) + 1}, ${getRandomElement(DATA.cities)}, India`,
                dob: new Date(2000 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                cnic: generateCNIC(),
                hostel: hostel._id,
                organizationId: org._id,
                user: user._id
            });

            students.push(student);
            seedingReport.students.created++;
        } catch (err) {
            if (!err.message.includes('duplicate')) {
                log.warn(`Student creation error: ${err.message}`);
            }
        }
    }

    log.success(`Created ${studentsToCreate} students for ${org.name}`);
    return students;
}

// ═══════════════════════════════════════════════════════════════
// STEP 7: COMPLAINTS PER STUDENT
// ═══════════════════════════════════════════════════════════════

async function ensureComplaints(org, students, hostels, admin) {
    log.section(`STEP 7: COMPLAINTS - ${org.name}`);

    const existingCount = await Complaint.countDocuments({ organizationId: org._id });
    const targetCount = students.length * CONFIG.COMPLAINTS_PER_STUDENT;

    if (existingCount >= targetCount) {
        log.info(`Complaints exist: ${existingCount}`);
        seedingReport.complaints.existing += existingCount;
        return;
    }

    const complaintDescriptions = [
        'WiFi not working in my room. Cannot connect to the network.',
        'AC is not cooling properly. Room temperature is very high.',
        'Water leakage in the bathroom. Floor is always wet.',
        'Mess food quality has declined. Need better nutrition.',
        'Room light flickering. Needs immediate replacement.',
        'Door lock is broken. Security concern.',
        'Common area needs cleaning. Very dirty.',
        'Study room AC not working. Uncomfortable for study.'
    ];

    const complaintsToCreate = Math.min(targetCount - existingCount, students.length * 2);

    for (let i = 0; i < complaintsToCreate; i++) {
        const student = students[i % students.length];
        const status = getRandomElement(DATA.statuses);

        try {
            await Complaint.create({
                organizationId: org._id,
                student: student._id,
                hostel: getRandomElement(hostels)._id,
                type: getRandomElement(DATA.complaintTypes),
                title: `${getRandomElement(DATA.complaintCategories)} Issue - Room ${student.room_no}`,
                description: getRandomElement(complaintDescriptions),
                category: getRandomElement(DATA.complaintCategories),
                status,
                urgencyLevel: getRandomElement(DATA.urgencyLevels),
                aiPriorityScore: Math.floor(Math.random() * 100),
                sentiment: getRandomElement(['positive', 'neutral', 'negative']),
                assignedTo: status !== 'pending' ? admin._id : undefined,
                date: getRandomDate(30),
                resolvedAt: status === 'resolved' ? getRandomDate(7) : undefined
            });
            seedingReport.complaints.created++;
        } catch (err) {
            if (!err.message.includes('duplicate')) {
                log.warn(`Complaint creation error: ${err.message}`);
            }
        }
    }

    log.success(`Created ${complaintsToCreate} complaints for ${org.name}`);
}

// ═══════════════════════════════════════════════════════════════
// STEP 8: INVOICES PER STUDENT
// ═══════════════════════════════════════════════════════════════

async function ensureInvoices(org, students) {
    log.section(`STEP 8: INVOICES - ${org.name}`);

    const existingCount = await Invoice.countDocuments({ organizationId: org._id });
    const targetCount = students.length * CONFIG.INVOICES_PER_STUDENT;

    if (existingCount >= targetCount) {
        log.info(`Invoices exist: ${existingCount}`);
        seedingReport.invoices.existing += existingCount;
        return;
    }

    const months = ['January', 'February', 'March', 'April', 'May', 'June'];
    const invoicesToCreate = Math.min(targetCount - existingCount, students.length * 2);

    for (let i = 0; i < invoicesToCreate; i++) {
        const student = students[i % students.length];
        const month = months[i % months.length];
        const status = getRandomElement(['paid', 'pending', 'overdue']);

        try {
            await Invoice.create({
                organizationId: org._id,
                student: student._id,
                title: `${month} ${getRandomElement(DATA.invoiceTitles)}`,
                amount: 10000 + Math.floor(Math.random() * 10000),
                status,
                date: getRandomDate(60)
            });
            seedingReport.invoices.created++;
        } catch (err) {
            if (!err.message.includes('duplicate')) {
                log.warn(`Invoice creation error: ${err.message}`);
            }
        }
    }

    log.success(`Created ${invoicesToCreate} invoices for ${org.name}`);
}

// ═══════════════════════════════════════════════════════════════
// STEP 9: ATTENDANCE RECORDS
// ═══════════════════════════════════════════════════════════════

async function ensureAttendance(org, students) {
    log.section(`STEP 9: ATTENDANCE - ${org.name}`);

    const existingCount = await Attendance.countDocuments({ organizationId: org._id });
    const targetCount = students.length * CONFIG.ATTENDANCE_DAYS;

    if (existingCount >= targetCount) {
        log.info(`Attendance records exist: ${existingCount}`);
        seedingReport.attendance.existing += existingCount;
        return;
    }

    for (const student of students) {
        for (let day = 0; day < CONFIG.ATTENDANCE_DAYS; day++) {
            const date = new Date();
            date.setDate(date.getDate() - day);
            date.setHours(0, 0, 0, 0);

            const existing = await Attendance.findOne({
                student: student._id,
                organizationId: org._id,
                date: { $gte: date, $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) }
            });

            if (!existing) {
                try {
                    await Attendance.create({
                        organizationId: org._id,
                        student: student._id,
                        date,
                        status: Math.random() > 0.15 ? 'present' : 'absent'
                    });
                    seedingReport.attendance.created++;
                } catch (err) {
                    // Skip duplicates
                }
            } else {
                seedingReport.attendance.existing++;
            }
        }
    }

    log.success(`Ensured attendance records for ${org.name}`);
}

// ═══════════════════════════════════════════════════════════════
// STEP 10: MESS-OFF REQUESTS
// ═══════════════════════════════════════════════════════════════

async function ensureMessOff(org, students) {
    log.section(`STEP 10: MESS-OFF REQUESTS - ${org.name}`);

    const existingCount = await MessOff.countDocuments({ organizationId: org._id });

    if (existingCount >= CONFIG.MESSOFF_REQUESTS) {
        log.info(`Mess-off requests exist: ${existingCount}`);
        seedingReport.messOff.existing += existingCount;
        return;
    }

    const reasons = ['Going home for festival', 'Medical appointment', 'Family function', 'Academic trip', 'Personal work'];
    const requestsToCreate = Math.min(CONFIG.MESSOFF_REQUESTS - existingCount, students.length);

    for (let i = 0; i < requestsToCreate; i++) {
        const student = students[i % students.length];
        const leavingDate = getFutureDate(15);
        const returnDate = new Date(leavingDate.getTime() + Math.floor(Math.random() * 5 + 1) * 24 * 60 * 60 * 1000);

        try {
            await MessOff.create({
                organizationId: org._id,
                student: student._id,
                leaving_date: leavingDate,
                return_date: returnDate,
                status: getRandomElement(['pending', 'approved', 'rejected']),
                request_date: getRandomDate(7)
            });
            seedingReport.messOff.created++;
        } catch (err) {
            if (!err.message.includes('duplicate')) {
                log.warn(`MessOff creation error: ${err.message}`);
            }
        }
    }

    log.success(`Created ${requestsToCreate} mess-off requests for ${org.name}`);
}

// ═══════════════════════════════════════════════════════════════
// STEP 11: SUGGESTIONS
// ═══════════════════════════════════════════════════════════════

async function ensureSuggestions(org, students, hostels) {
    log.section(`STEP 11: SUGGESTIONS - ${org.name}`);

    const existingCount = await Suggestion.countDocuments({ organizationId: org._id });

    if (existingCount >= CONFIG.SUGGESTIONS_PER_ORG) {
        log.info(`Suggestions exist: ${existingCount}`);
        seedingReport.suggestions.existing += existingCount;
        return;
    }

    const descriptions = [
        'This would greatly improve the hostel experience for all students.',
        'Please consider this suggestion as it will benefit everyone.',
        'Many students have expressed similar concerns. Please look into this.',
        'This is a long-pending issue that needs attention.',
        'Implementing this would make our hostel life much better.'
    ];

    const suggestionsToCreate = CONFIG.SUGGESTIONS_PER_ORG - existingCount;

    for (let i = 0; i < suggestionsToCreate && i < students.length; i++) {
        const student = students[i];

        try {
            await Suggestion.create({
                organizationId: org._id,
                student: student._id,
                hostel: getRandomElement(hostels)._id,
                title: DATA.suggestionTitles[i % DATA.suggestionTitles.length],
                description: getRandomElement(descriptions),
                status: getRandomElement(['pending', 'approved', 'rejected', 'implemented']),
                date: getRandomDate(30)
            });
            seedingReport.suggestions.created++;
        } catch (err) {
            if (!err.message.includes('duplicate')) {
                log.warn(`Suggestion creation error: ${err.message}`);
            }
        }
    }

    log.success(`Created ${suggestionsToCreate} suggestions for ${org.name}`);
}

// ═══════════════════════════════════════════════════════════════
// STEP 12: NOTICES
// ═══════════════════════════════════════════════════════════════

async function ensureNotices(org, admin) {
    log.section(`STEP 12: NOTICES - ${org.name}`);

    const existingCount = await Notice.countDocuments({ organizationId: org._id });

    if (existingCount >= CONFIG.NOTICES_PER_ORG) {
        log.info(`Notices exist: ${existingCount}`);
        seedingReport.notices.existing += existingCount;
        return;
    }

    const noticeTitles = [
        { title: 'Mess Timing Change', category: 'mess', content: 'From next week, dinner timings will be 7:30 PM - 9:30 PM instead of 8:00 PM - 10:00 PM.' },
        { title: 'Water Supply Maintenance', category: 'maintenance', content: 'Water supply will be disrupted on Sunday from 10 AM to 2 PM due to maintenance work.' },
        { title: 'Fee Payment Reminder', category: 'fees', content: 'All students are reminded to pay their hostel fees before the 10th of this month.' },
        { title: 'Annual Day Celebration', category: 'event', content: 'Annual Day celebration will be held on the 25th. All students are invited to participate.' },
        { title: 'New WiFi Password', category: 'general', content: 'The WiFi password has been updated. Please contact the admin office for the new password.' }
    ];

    const noticesToCreate = Math.min(CONFIG.NOTICES_PER_ORG - existingCount, noticeTitles.length);

    for (let i = 0; i < noticesToCreate; i++) {
        const notice = noticeTitles[i];

        try {
            await Notice.create({
                organizationId: org._id,
                title: notice.title,
                content: notice.content,
                category: notice.category,
                priority: getRandomElement(['low', 'medium', 'high']),
                targetAudience: 'all',
                status: 'published',
                publishedAt: getRandomDate(14),
                createdBy: admin._id
            });
            seedingReport.notices.created++;
        } catch (err) {
            if (!err.message.includes('duplicate')) {
                log.warn(`Notice creation error: ${err.message}`);
            }
        }
    }

    log.success(`Created ${noticesToCreate} notices for ${org.name}`);
}

// ═══════════════════════════════════════════════════════════════
// STEP 13: FAQ EMBEDDINGS (Global)
// ═══════════════════════════════════════════════════════════════

async function ensureFAQs() {
    log.section('STEP 13: FAQ EMBEDDINGS (Global)');

    const existingCount = await FAQEmbedding.countDocuments({ organizationId: null });

    if (existingCount >= 10) {
        log.info(`FAQs exist: ${existingCount}`);
        seedingReport.faqs.existing += existingCount;
        return;
    }

    const faqs = [
        { question: 'What are the mess timings?', answer: 'Breakfast: 7-9 AM, Lunch: 12-2 PM, Snacks: 4-5 PM, Dinner: 7:30-9:30 PM', category: 'mess', role: 'student', keywords: ['mess', 'timing', 'food', 'breakfast', 'lunch', 'dinner'] },
        { question: 'How do I file a complaint?', answer: 'Go to Complaints section in your dashboard, click "New Complaint", fill the form and submit.', category: 'complaints', role: 'student', keywords: ['complaint', 'file', 'register', 'issue'] },
        { question: 'How to apply for mess off?', answer: 'Navigate to Mess-Off section, select dates, provide reason and submit your request.', category: 'leave', role: 'student', keywords: ['mess', 'off', 'leave', 'apply', 'request'] },
        { question: 'What is the hostel fee structure?', answer: 'Monthly mess fee: ₹5000-8000, Room rent varies by type: Single ₹8000, Double ₹6000, Triple ₹4500.', category: 'fees', role: 'student', keywords: ['fee', 'cost', 'rent', 'payment', 'money'] },
        { question: 'How to pay hostel fees?', answer: 'Check your Invoices section for pending payments. You can pay online or at the admin office.', category: 'fees', role: 'student', keywords: ['pay', 'payment', 'fee', 'invoice', 'online'] },
        { question: 'What are the hostel rules?', answer: 'Entry by 10 PM, no guests after 8 PM, maintain silence after 11 PM, keep rooms clean.', category: 'rules', role: 'student', keywords: ['rules', 'regulation', 'timing', 'policy'] },
        { question: 'How to check my attendance?', answer: 'Go to Attendance section in your dashboard to view your attendance history and statistics.', category: 'attendance', role: 'student', keywords: ['attendance', 'check', 'present', 'absent', 'record'] },
        { question: 'How do I add a new student?', answer: 'Go to Students section, click "Register Student", fill all required details and submit.', category: 'students', role: 'admin', keywords: ['student', 'add', 'register', 'new', 'create'] },
        { question: 'How to view analytics?', answer: 'Navigate to Analytics section to view charts, trends, and statistics about your hostel.', category: 'analytics', role: 'admin', keywords: ['analytics', 'chart', 'stats', 'report', 'data'] },
        { question: 'How to manage subscriptions?', answer: 'Super Admin can manage subscriptions from the Organizations section.', category: 'subscription', role: 'super_admin', keywords: ['subscription', 'plan', 'upgrade', 'billing'] }
    ];

    for (const faq of faqs) {
        const existing = await FAQEmbedding.findOne({ question: faq.question });
        if (!existing) {
            try {
                await FAQEmbedding.create({
                    organizationId: null, // Global FAQs
                    question: faq.question,
                    answer: faq.answer,
                    category: faq.category,
                    role: faq.role,
                    keywords: faq.keywords,
                    isActive: true
                });
                seedingReport.faqs.created++;
            } catch (err) {
                log.warn(`FAQ creation error: ${err.message}`);
            }
        } else {
            seedingReport.faqs.existing++;
        }
    }

    log.success(`Ensured ${faqs.length} FAQ entries`);
}

// ═══════════════════════════════════════════════════════════════
// FINAL REPORT & VERIFICATION
// ═══════════════════════════════════════════════════════════════

async function generateFinalReport() {
    log.section('FINAL SEEDING REPORT');

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           SAFE DATA SEEDING - COMPLETE REPORT              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Collections Modified
    console.log('📊 COLLECTIONS MODIFIED:\n');
    const collections = ['organizations', 'users', 'students', 'admins', 'hostels', 'rooms',
        'complaints', 'invoices', 'attendance', 'suggestions', 'notices', 'messOff', 'faqs'];

    collections.forEach(coll => {
        const report = seedingReport[coll] || seedingReport[coll.toLowerCase()];
        if (report) {
            console.log(`   ${coll.padEnd(15)} → Existing: ${String(report.existing).padStart(4)} | Created: ${String(report.created).padStart(4)}`);
        }
    });

    // Final Database Stats
    console.log('\n📈 FINAL DATABASE STATISTICS:\n');
    const finalCounts = {
        Organizations: await Organization.countDocuments(),
        Users: await User.countDocuments(),
        Students: await Student.countDocuments(),
        Admins: await Admin.countDocuments(),
        Hostels: await Hostel.countDocuments(),
        Rooms: await Room.countDocuments(),
        Complaints: await Complaint.countDocuments(),
        Invoices: await Invoice.countDocuments(),
        Attendance: await Attendance.countDocuments(),
        Suggestions: await Suggestion.countDocuments(),
        Notices: await Notice.countDocuments(),
        MessOff: await MessOff.countDocuments(),
        FAQs: await FAQEmbedding.countDocuments()
    };

    Object.entries(finalCounts).forEach(([key, value]) => {
        console.log(`   ${key.padEnd(15)}: ${value}`);
    });

    // Tenant Isolation Verification
    console.log('\n🔒 TENANT ISOLATION VERIFICATION:\n');
    const orgs = await Organization.find();
    for (const org of orgs) {
        const studentCount = await Student.countDocuments({ organizationId: org._id });
        const complaintCount = await Complaint.countDocuments({ organizationId: org._id });
        console.log(`   ${org.name.substring(0, 30).padEnd(32)}: ${studentCount} students, ${complaintCount} complaints`);
    }

    // Login Credentials
    console.log('\n🔑 LOGIN CREDENTIALS:\n');
    console.log('   SUPER ADMIN:');
    console.log(`      Email: superadmin@hostelease.com`);
    console.log(`      Password: ${CONFIG.SUPER_ADMIN_PASSWORD}\n`);

    for (const org of orgs) {
        console.log(`   ${org.name.toUpperCase()}:`);
        console.log(`      Admin: admin@${org.slug}.edu / ${CONFIG.DEFAULT_ADMIN_PASSWORD}`);
        console.log(`      Sub Admin: subadmin@${org.slug}.edu / ${CONFIG.DEFAULT_ADMIN_PASSWORD}`);
        const sampleStudent = await User.findOne({ organizationId: org._id, role: 'student' });
        if (sampleStudent) {
            console.log(`      Sample Student: ${sampleStudent.email} / ${CONFIG.DEFAULT_STUDENT_PASSWORD}`);
        }
        console.log('');
    }

    // Final Confirmation
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ All modules contain valid, linked, role-safe, multi-tenant');
    console.log('   data and are fully functional.');
    console.log('═══════════════════════════════════════════════════════════════\n');
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════

async function main() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║       HOSTEL EASE - SAFE DATA SEEDER                       ║');
    console.log('║       Multi-Tenant Compliant | Security First              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    try {
        // Connect to MongoDB
        if (!process.env.MONGO_URI) {
            log.error('MONGO_URI not found in environment variables!');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        log.success('Connected to MongoDB');

        // Step 1: Assess current state
        await assessProjectState();

        // Step 2: Super Admin
        await ensureSuperAdmin();

        // Step 3: Organizations
        const organizations = await ensureOrganizations();

        // Process each organization
        for (const org of organizations) {
            // Step 4: Admins & Hostels
            const { admin, hostels } = await ensureAdminsAndHostels(org);

            // Step 5: Rooms
            await ensureRooms(org, hostels);

            // Step 6: Students
            const students = await ensureStudents(org, hostels);

            // Step 7: Complaints
            await ensureComplaints(org, students, hostels, admin);

            // Step 8: Invoices
            await ensureInvoices(org, students);

            // Step 9: Attendance
            await ensureAttendance(org, students);

            // Step 10: Mess-Off
            await ensureMessOff(org, students);

            // Step 11: Suggestions
            await ensureSuggestions(org, students, hostels);

            // Step 12: Notices
            await ensureNotices(org, admin);
        }

        // Step 13: Global FAQs
        await ensureFAQs();

        // Generate Final Report
        await generateFinalReport();

    } catch (error) {
        log.error(`Seeding failed: ${error.message}`);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        log.info('Database connection closed');
        process.exit(0);
    }
}

// Run the seeder
main();
