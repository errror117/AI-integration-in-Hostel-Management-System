/**
 * Production Data Seeding Script
 * Creates 3 Gujarat Universities with Admins and Students
 * 
 * Run: node utils/seedProductionData.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Organization = require('../models/Organization');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Hostel = require('../models/Hostel');
const Complaint = require('../models/Complaint');
const Invoice = require('../models/Invoice');

// Organization Configurations
const ORGANIZATIONS = [
    {
        name: 'Marwadi University',
        slug: 'marwadi-univ',
        type: 'university',
        contact: {
            email: 'hostel@marwadi.edu',
            phone: '+91-2816-123456',
            address: {
                city: 'Rajkot',
                state: 'Gujarat',
                country: 'India'
            }
        },
        admin: {
            name: 'Dr. Rajesh Patel',
            email: 'admin@marwadi.edu',
            password: 'Admin@MU2026',
            father_name: 'Haresh Patel',
            contact: '+91-9876543210',
            cnic: '12345-6789012-1'
        },
        hostels: [
            { name: 'Marwadi Boys Hostel', location: 'Main Campus', rooms: 100, capacity: 200 },
            { name: 'Marwadi Girls Hostel', location: 'Main Campus', rooms: 80, capacity: 160 }
        ],
        studentCount: 35
    },
    {
        name: 'DA-IICT',
        slug: 'da-iict',
        type: 'university',
        contact: {
            email: 'hostel@daiict.ac.in',
            phone: '+91-79-68261234',
            address: {
                city: 'Gandhinagar',
                state: 'Gujarat',
                country: 'India'
            }
        },
        admin: {
            name: 'Prof. Amit Shah',
            email: 'admin@daiict.ac.in',
            password: 'Admin@DAIICT2026',
            father_name: 'Suresh Shah',
            contact: '+91-9876543211',
            cnic: '12345-6789012-2'
        },
        hostels: [
            { name: 'DAIICT Hostel Block A', location: 'Campus', rooms: 120, capacity: 240 },
            { name: 'DAIICT Hostel Block B', location: 'Campus', rooms: 100, capacity: 200 }
        ],
        studentCount: 35
    },
    {
        name: 'PDEU',
        slug: 'pdeu',
        type: 'university',
        contact: {
            email: 'hostel@pdeu.ac.in',
            phone: '+91-79-68261567',
            address: {
                city: 'Gandhinagar',
                state: 'Gujarat',
                country: 'India'
            }
        },
        admin: {
            name: 'Dr. Priya Mehta',
            email: 'admin@pdeu.ac.in',
            password: 'Admin@PDEU2026',
            father_name: 'Kiran Mehta',
            contact: '+91-9876543212',
            cnic: '12345-6789012-3'
        },
        hostels: [
            { name: 'PDEU Boys Hostel', location: 'University Campus', rooms: 150, capacity: 300 },
            { name: 'PDEU Girls Hostel', location: 'University Campus', rooms: 100, capacity: 200 }
        ],
        studentCount: 35
    }
];

// Sample data for students
const FIRST_NAMES = [
    'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan',
    'Krishna', 'Ishaan', 'Shaurya', 'Atharva', 'Advait', 'Krishiv', 'Dhruv',
    'Ananya', 'Aanya', 'Aadhya', 'Saanvi', 'Myra', 'Diya', 'Kiara', 'Prisha',
    'Aaradhya', 'Anvi', 'Sara', 'Navya', 'Anika', 'Pari', 'Mahira', 'Ira'
];

const LAST_NAMES = [
    'Patel', 'Shah', 'Mehta', 'Desai', 'Trivedi', 'Joshi', 'Bhatt', 'Pandya',
    'Parikh', 'Modi', 'Gandhi', 'Thakkar', 'Rana', 'Raval', 'Solanki', 'Chauhan'
];

const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical'];
const COURSES = ['B.Tech', 'M.Tech', 'B.E.', 'MCA'];
const COMPLAINT_TYPES = ['WiFi/Internet', 'Mess/Food', 'Cleanliness', 'Electrical', 'Plumbing', 'Maintenance', 'Security', 'General'];
const COMPLAINT_STATUSES = ['pending', 'in-progress', 'resolved'];

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedDatabase() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     PRODUCTION DATA SEEDING - Gujarat Universities          ║');
    console.log('║     Marwadi University | DA-IICT | PDEU                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error('❌ MONGO_URI not found in environment variables');
            process.exit(1);
        }

        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        const salt = await bcrypt.genSalt(10);
        let totalStudentsCreated = 0;
        let cmsIdCounter = 20000;

        for (const orgConfig of ORGANIZATIONS) {
            console.log(`\n${'═'.repeat(60)}`);
            console.log(`🏛️  Processing: ${orgConfig.name}`);
            console.log('═'.repeat(60));

            // Check if organization already exists
            let organization = await Organization.findOne({ slug: orgConfig.slug });

            if (organization) {
                console.log(`   ⚠️  Organization already exists, updating...`);
            } else {
                // Create Organization
                organization = new Organization({
                    name: orgConfig.name,
                    slug: orgConfig.slug,
                    type: orgConfig.type,
                    contact: orgConfig.contact,
                    subscription: {
                        plan: 'professional',
                        status: 'active',
                        startDate: new Date()
                    },
                    limits: {
                        maxStudents: 1000,
                        maxAdmins: 10,
                        maxRooms: 500
                    },
                    features: {
                        aiChatbot: true,
                        analytics: true,
                        customBranding: true,
                        exportData: true
                    },
                    isActive: true,
                    isVerified: true
                });
                await organization.save();
                console.log(`   ✅ Organization created: ${organization.name}`);
            }

            // Create Hostels
            let hostels = [];
            for (const hostelConfig of orgConfig.hostels) {
                let hostel = await Hostel.findOne({
                    organizationId: organization._id,
                    name: hostelConfig.name
                });

                if (!hostel) {
                    hostel = new Hostel({
                        organizationId: organization._id,
                        name: hostelConfig.name,
                        location: hostelConfig.location,
                        rooms: hostelConfig.rooms,
                        capacity: hostelConfig.capacity,
                        vacant: hostelConfig.capacity
                    });
                    await hostel.save();
                    console.log(`   ✅ Hostel created: ${hostel.name}`);
                }
                hostels.push(hostel);
            }

            // Create Admin User
            const adminConfig = orgConfig.admin;
            let adminUser = await User.findOne({ email: adminConfig.email });

            if (!adminUser) {
                const hashedPassword = await bcrypt.hash(adminConfig.password, salt);
                adminUser = new User({
                    name: adminConfig.name,
                    email: adminConfig.email,
                    password: hashedPassword,
                    role: 'org_admin',
                    organizationId: organization._id,
                    isActive: true
                });
                await adminUser.save();
                console.log(`   ✅ Admin User created: ${adminConfig.email}`);

                // Create Admin profile
                const adminProfile = new Admin({
                    organizationId: organization._id,
                    name: adminConfig.name,
                    email: adminConfig.email,
                    father_name: adminConfig.father_name,
                    contact: adminConfig.contact,
                    address: `${orgConfig.contact.address.city}, ${orgConfig.contact.address.state}`,
                    dob: new Date('1980-01-15'),
                    cnic: adminConfig.cnic,
                    user: adminUser._id,
                    hostel: hostels[0]._id
                });
                await adminProfile.save();
                console.log(`   ✅ Admin profile created`);
            } else {
                console.log(`   ⚠️  Admin already exists: ${adminConfig.email}`);
            }

            // Create Students
            console.log(`\n   📝 Creating ${orgConfig.studentCount} students...`);
            const studentPassword = await bcrypt.hash('Student@123', salt);
            let studentsCreated = 0;

            for (let i = 1; i <= orgConfig.studentCount; i++) {
                const firstName = getRandomElement(FIRST_NAMES);
                const lastName = getRandomElement(LAST_NAMES);
                const fullName = `${firstName} ${lastName}`;
                const email = `student${i}@${orgConfig.slug.replace('-', '')}.edu`;

                // Check if student exists
                const existingUser = await User.findOne({ email });
                if (existingUser) continue;

                try {
                    // Create User
                    const studentUser = new User({
                        name: fullName,
                        email: email,
                        password: studentPassword,
                        role: 'student',
                        organizationId: organization._id,
                        isActive: true
                    });
                    await studentUser.save();

                    // Create Student profile
                    const hostel = getRandomElement(hostels);
                    const student = new Student({
                        organizationId: organization._id,
                        name: fullName,
                        email: email,
                        cms_id: cmsIdCounter++,
                        room_no: 100 + Math.floor(Math.random() * 300),
                        batch: 2021 + Math.floor(Math.random() * 4),
                        dept: getRandomElement(DEPARTMENTS),
                        course: getRandomElement(COURSES),
                        father_name: `${getRandomElement(FIRST_NAMES)} ${lastName}`,
                        contact: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
                        address: `${orgConfig.contact.address.city}, Gujarat, India`,
                        dob: getRandomDate(new Date(2000, 0, 1), new Date(2005, 11, 31)),
                        cnic: `${cmsIdCounter}-${Math.floor(Math.random() * 9000000) + 1000000}-${Math.floor(Math.random() * 9)}`,
                        hostel: hostel._id,
                        user: studentUser._id
                    });
                    await student.save();
                    studentsCreated++;
                    totalStudentsCreated++;

                    // Create some sample complaints (1 in 3 students)
                    if (Math.random() < 0.33) {
                        const complaint = new Complaint({
                            organizationId: organization._id,
                            student: student._id,
                            hostel: hostel._id,
                            type: getRandomElement(COMPLAINT_TYPES),
                            title: `${getRandomElement(COMPLAINT_TYPES)} Issue in Room ${student.room_no}`,
                            description: 'Sample complaint for demonstration purposes.',
                            status: getRandomElement(COMPLAINT_STATUSES),
                            priority: getRandomElement(['Low', 'Medium', 'High']),
                            category: getRandomElement(COMPLAINT_TYPES),
                            date: getRandomDate(new Date(2026, 0, 1), new Date())
                        });
                        await complaint.save();
                    }

                    // Create invoice for each student
                    const invoice = new Invoice({
                        organizationId: organization._id,
                        student: student._id,
                        amount: 15000 + Math.floor(Math.random() * 10000),
                        description: 'Monthly Hostel Fee - January 2026',
                        status: Math.random() > 0.3 ? 'pending' : 'paid',
                        dueDate: new Date(2026, 1, 28),
                        type: 'hostel_fee'
                    });
                    await invoice.save();

                } catch (err) {
                    if (!err.message.includes('duplicate')) {
                        console.error(`   ⚠️  Error creating student: ${err.message}`);
                    }
                }

                if (studentsCreated % 10 === 0) {
                    process.stdout.write(`   Progress: ${studentsCreated}/${orgConfig.studentCount}\r`);
                }
            }

            console.log(`   ✅ Created ${studentsCreated} students for ${orgConfig.name}`);

            // Update organization usage
            const studentCount = await Student.countDocuments({ organizationId: organization._id });
            const adminCount = await Admin.countDocuments({ organizationId: organization._id });
            organization.usage = {
                studentCount,
                adminCount,
                roomCount: hostels.reduce((sum, h) => sum + h.rooms, 0)
            };
            await organization.save();
        }

        // Print Summary
        console.log('\n\n' + '═'.repeat(60));
        console.log('📊 SEEDING COMPLETE - SUMMARY');
        console.log('═'.repeat(60) + '\n');

        for (const orgConfig of ORGANIZATIONS) {
            const org = await Organization.findOne({ slug: orgConfig.slug });
            const studentCount = await Student.countDocuments({ organizationId: org._id });
            const complaintCount = await Complaint.countDocuments({ organizationId: org._id });
            const invoiceCount = await Invoice.countDocuments({ organizationId: org._id });

            console.log(`🏛️  ${org.name}`);
            console.log(`   📧 Admin: ${orgConfig.admin.email}`);
            console.log(`   🔐 Password: ${orgConfig.admin.password}`);
            console.log(`   👥 Students: ${studentCount}`);
            console.log(`   📋 Complaints: ${complaintCount}`);
            console.log(`   💰 Invoices: ${invoiceCount}\n`);
        }

        console.log('═'.repeat(60));
        console.log('🎓 STUDENT LOGIN CREDENTIALS (Same for all students):');
        console.log('═'.repeat(60));
        console.log('   📧 Email: student1@marwadiuniv.edu (or student2, student3...)');
        console.log('   📧 Email: student1@daiict.edu');
        console.log('   📧 Email: student1@pdeu.edu');
        console.log('   🔐 Password: Student@123');
        console.log('═'.repeat(60) + '\n');

        console.log(`✅ Total Students Created: ${totalStudentsCreated}`);
        console.log('🎉 Production data seeding complete!\n');

    } catch (error) {
        console.error('❌ Error during seeding:', error);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Database connection closed\n');
        process.exit(0);
    }
}

seedDatabase();
