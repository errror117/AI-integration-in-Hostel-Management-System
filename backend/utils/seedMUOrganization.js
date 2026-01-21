const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const Organization = require('../models/Organization');
const User = require('../models/User');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const Hostel = require('../models/Hostel');
const Complaint = require('../models/Complaint');
const Suggestion = require('../models/Suggestion');

// Enhanced Indian names for more variety
const firstNames = [
    'Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Arjun', 'Riya',
    'Karan', 'Pooja', 'Rohan', 'Divya', 'Sanjay', 'Meera', 'Aditya', 'Kavya',
    'Rajesh', 'Shreya', 'Nikhil', 'Ananya', 'Suresh', 'Ishita', 'Manish', 'Neha',
    'Varun', 'Priyanka', 'Arun', 'Shalini', 'Deepak', 'Tanvi', 'Harsh', 'Swati',
    'Vishal', 'Kriti', 'Gaurav', 'Sakshi', 'Abhishek', 'Simran', 'Mohit', 'Aarti',
    'Ashish', 'Nidhi', 'Praveen', 'Ritu', 'Sandeep', 'Megha', 'Naveen', 'Preeti',
    'Akash', 'Shweta', 'Dev', 'Pallavi', 'Yash', 'Ankita', 'Kunal', 'Isha',
    'Siddharth', 'Aditi', 'Ankit', 'Shruti', 'Kartik', 'Nisha', 'Nitin', 'Tanya'
];

const lastNames = [
    'Sharma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Gupta', 'Mehta', 'Desai',
    'Joshi', 'Verma', 'Rao', 'Nair', 'Pillai', 'Iyer', 'Menon', 'Kulkarni',
    'Agarwal', 'Bansal', 'Chopra', 'Malhotra', 'Kapoor', 'Bhatia', 'Saxena', 'Pandey',
    'Shah', 'Jain', 'Sinha', 'Mishra', 'Khan', 'Ali', 'Das', 'Sen'
];

const departments = [
    'Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical',
    'Information Technology', 'Chemical', 'Biotechnology', 'Automobile', 'Instrumentation'
];

const courses = ['B.Tech', 'B.E.', 'M.Tech', 'MCA', 'M.E.'];

const complaintTypes = [
    'Maintenance', 'Food', 'Cleanliness', 'WiFi/Internet', 'Facility',
    'Security', 'Electrical', 'Plumbing', 'Furniture', 'Noise'
];

const cities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad',
    'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Bhopal'
];

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getRandomName() {
    return `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`;
}

function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateCNIC() {
    return `${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 9000000) + 1000000}-${Math.floor(Math.random() * 9) + 1}`;
}

function generateContact() {
    return `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`;
}

async function seedMUOrganization() {
    try {
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║                                                            ║');
        console.log('║          SEEDING MU ORGANIZATION                           ║');
        console.log('║          Target: 200+ Students                             ║');
        console.log('║                                                            ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        if (!process.env.MONGO_URI) {
            console.log('❌ ERROR: MONGO_URI not found in environment variables!');
            console.log('Please create a .env file in the backend folder with MONGO_URI\n');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Check if MU organization already exists
        let muOrg = await Organization.findOne({ slug: 'mu' });

        if (muOrg) {
            console.log('⚠️  MU organization already exists. Would you like to:');
            console.log('   1. Add more students to existing MU');
            console.log('   2. Delete and recreate MU\n');
            console.log('➡️  Currently adding to existing organization...\n');
        } else {
            // Create MU organization
            console.log('🏢 Creating MU Organization...');
            muOrg = await Organization.create({
                name: 'Mumbai University',
                slug: 'mu',
                type: 'university',
                contact: {
                    email: 'admin@mu.edu',
                    phone: '+91-22-2652-6526',
                    address: {
                        street: 'Kalina Campus, Santacruz East',
                        city: 'Mumbai',
                        state: 'Maharashtra',
                        country: 'India',
                        zipCode: '400098'
                    },
                    website: 'https://mu.ac.in'
                },
                subscription: {
                    plan: 'professional',
                    status: 'active',
                    startDate: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
                },
                limits: {
                    maxStudents: 1000,
                    maxAdmins: 10,
                    maxRooms: 500,
                    maxStorageMB: 5000
                },
                features: {
                    aiChatbot: true,
                    analytics: true,
                    customBranding: true,
                    exportData: true,
                    apiAccess: true,
                    whiteLabel: false
                },
                branding: {
                    primaryColor: '#1E3A8A', // Blue
                    secondaryColor: '#FCD34D', // Gold
                    tagline: 'Excellence in Education Since 1857',
                    welcomeMessage: 'Welcome to Mumbai University Hostel Management System'
                },
                settings: {
                    timezone: 'Asia/Kolkata',
                    currency: 'INR',
                    dateFormat: 'DD/MM/YYYY',
                    language: 'en',
                    messTimings: {
                        breakfast: { start: '07:00', end: '09:00' },
                        lunch: { start: '12:00', end: '14:00' },
                        snacks: { start: '16:00', end: '17:30' },
                        dinner: { start: '19:30', end: '21:30' }
                    },
                    checkInTime: '09:00',
                    checkOutTime: '22:00'
                },
                isActive: true,
                isVerified: true,
                verifiedAt: new Date()
            });
            console.log('✅ MU Organization created\n');

            // Create Admin for MU
            console.log('👔 Creating Admin for MU...');
            const salt = await bcrypt.genSalt(10);
            const adminPassword = await bcrypt.hash('admin123', salt);

            const adminUser = await User.create({
                name: 'MU Admin',
                email: 'admin@mu.edu',
                password: adminPassword,
                role: 'org_admin',
                organizationId: muOrg._id,
                isActive: true,
                isAdmin: true
            });

            await Admin.create({
                name: 'MU Admin',
                email: 'admin@mu.edu',
                contact: '+91-22-2652-6526',
                father_name: 'Admin Father',
                address: 'Mumbai University, Kalina Campus, Mumbai, Maharashtra, India',
                dob: new Date('1980-01-01'),
                cnic: '12345-1234567-1',
                organizationId: muOrg._id,
                user: adminUser._id
            });

            console.log('✅ Admin created (Email: admin@mu.edu, Password: admin123)\n');
        }

        // Create hostels for MU
        console.log('🏠 Creating Hostels...');
        let hostels = await Hostel.find({ organizationId: muOrg._id });

        if (hostels.length === 0) {
            hostels = await Hostel.create([
                {
                    name: 'MU Boys Hostel - Block A',
                    location: 'Kalina Campus',
                    rooms: 150,
                    capacity: 300,
                    vacant: 300,
                    organizationId: muOrg._id
                },
                {
                    name: 'MU Boys Hostel - Block B',
                    location: 'Kalina Campus',
                    rooms: 100,
                    capacity: 200,
                    vacant: 200,
                    organizationId: muOrg._id
                },
                {
                    name: 'MU Girls Hostel - Block A',
                    location: 'Kalina Campus',
                    rooms: 120,
                    capacity: 240,
                    vacant: 240,
                    organizationId: muOrg._id
                },
                {
                    name: 'MU Girls Hostel - Block B',
                    location: 'Vidyanagari Campus',
                    rooms: 80,
                    capacity: 160,
                    vacant: 160,
                    organizationId: muOrg._id
                }
            ]);
            console.log(`✅ Created ${hostels.length} hostels\n`);
        } else {
            console.log(`✅ Using existing ${hostels.length} hostels\n`);
        }

        // Create 200+ students
        const targetStudents = 210; // Slightly over 200
        const existingStudentCount = await Student.countDocuments({ organizationId: muOrg._id });
        const studentsToCreate = targetStudents - existingStudentCount;

        console.log(`📊 Current students: ${existingStudentCount}`);
        console.log(`📝 Creating ${studentsToCreate} new students...\n`);

        const salt = await bcrypt.genSalt(10);
        const defaultPassword = await bcrypt.hash('student123', salt);

        let cmsIdCounter = 20000 + existingStudentCount; // Start from 20000
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < studentsToCreate; i++) {
            try {
                const name = getRandomName();
                const firstName = name.split(' ')[0].toLowerCase();
                const lastName = name.split(' ')[1].toLowerCase();
                const email = `${firstName}.${lastName}${cmsIdCounter}@mu.edu`;
                const hostel = getRandomElement(hostels);
                const dept = getRandomElement(departments);
                const course = getRandomElement(courses);
                const batch = 2021 + Math.floor(Math.random() * 4); // 2021-2024
                const roomNo = Math.floor(Math.random() * 500) + 100;

                // Create User
                const user = await User.create({
                    name,
                    email,
                    password: defaultPassword,
                    role: 'student',
                    organizationId: muOrg._id,
                    isActive: true
                });

                // Create Student
                await Student.create({
                    name,
                    email,
                    cms_id: cmsIdCounter,
                    room_no: roomNo,
                    batch,
                    dept,
                    course,
                    father_name: `${getRandomElement(firstNames)} ${lastName}`,
                    contact: generateContact(),
                    address: `${Math.floor(Math.random() * 999) + 1}, ${getRandomElement(cities)}, India`,
                    dob: getRandomDate(new Date(2000, 0, 1), new Date(2006, 11, 31)),
                    cnic: generateCNIC(),
                    hostel: hostel._id,
                    organizationId: muOrg._id,
                    user: user._id
                });

                cmsIdCounter++;
                successCount++;

                // Progress indicator
                if ((successCount) % 20 === 0) {
                    console.log(`   ✅ Progress: ${successCount}/${studentsToCreate} students created`);
                }

            } catch (err) {
                errorCount++;
                if (!err.message.includes('duplicate')) {
                    console.log(`   ⚠️  Error: ${err.message}`);
                }
            }
        }

        console.log(`\n✅ Created ${successCount} students successfully`);
        if (errorCount > 0) {
            console.log(`⚠️  ${errorCount} students skipped (duplicates or errors)\n`);
        }

        // Create sample complaints
        console.log('\n📝 Creating sample complaints...');
        const students = await Student.find({ organizationId: muOrg._id }).limit(30);
        const complaintsToCreate = 15;

        for (let i = 0; i < complaintsToCreate && i < students.length; i++) {
            try {
                await Complaint.create({
                    studentId: students[i]._id,
                    category: getRandomElement(complaintTypes),
                    title: `${getRandomElement(complaintTypes)} Issue in Room ${students[i].room_no}`,
                    description: `Sample complaint for demonstration. This is a ${getRandomElement(complaintTypes).toLowerCase()} issue that needs attention.`,
                    status: getRandomElement(['Pending', 'In Progress', 'Resolved']),
                    priority: getRandomElement(['Low', 'Medium', 'High', 'Critical']),
                    organizationId: muOrg._id
                });
            } catch (err) {
                // Continue on error
            }
        }
        console.log(`✅ Created ${complaintsToCreate} sample complaints\n`);

        // Create sample suggestions
        console.log('💡 Creating sample suggestions...');
        const suggestionsToCreate = 8;

        for (let i = 0; i < suggestionsToCreate && i < students.length; i++) {
            try {
                await Suggestion.create({
                    student: students[i]._id,
                    title: `Suggestion ${i + 1}: Improve ${getRandomElement(['Mess Food', 'WiFi Speed', 'Study Room', 'Recreation', 'Facilities'])}`,
                    description: `This is a sample suggestion to improve hostel facilities and student experience.`,
                    status: getRandomElement(['Pending', 'Under Review', 'Approved', 'Implemented']),
                    organizationId: muOrg._id
                });
            } catch (err) {
                // Continue
            }
        }
        console.log(`✅ Created ${suggestionsToCreate} sample suggestions\n`);

        // Create sample mess-off requests
        // console.log('🍽️  Creating sample mess-off requests...');
        // const messOffToCreate = 10;

        // for (let i = 0; i < messOffToCreate && i < students.length; i++) {
        //     try {
        //         const leavingDate = new Date();
        //         leavingDate.setDate(leavingDate.getDate() + Math.floor(Math.random() * 30));
        //         const returnDate = new Date(leavingDate);
        //         returnDate.setDate(returnDate.getDate() + Math.floor(Math.random() * 5) + 1);

        //         await MessOff.create({
        //             student: students[i]._id,
        //             leaving_date: leavingDate,
        //             return_date: returnDate,
        //             status: getRandomElement(['Pending', 'Approved', 'Rejected']),
        //             organizationId: muOrg._id
        //         });
        //     } catch (err) {
        //         // Continue
        //     }
        // }
        // console.log(`✅ Created ${messOffToCreate} sample mess-off requests\n`);

        // Final statistics
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ MU ORGANIZATION SETUP COMPLETE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const finalStudentCount = await Student.countDocuments({ organizationId: muOrg._id });
        const finalHostelCount = await Hostel.countDocuments({ organizationId: muOrg._id });
        const finalComplaintCount = await Complaint.countDocuments({ organizationId: muOrg._id });
        const finalSuggestionCount = await Suggestion.countDocuments({ organizationId: muOrg._id });

        console.log('📊 FINAL STATISTICS FOR MU:\n');
        console.log(`🏢 Organization: ${muOrg.name}`);
        console.log(`🔖 Slug: ${muOrg.slug}`);
        console.log(`📋 Plan: ${muOrg.subscription.plan.toUpperCase()}`);
        console.log(`👥 Total Students: ${finalStudentCount}`);
        console.log(`🏠 Total Hostels: ${finalHostelCount}`);
        console.log(`📝 Sample Complaints: ${finalComplaintCount}`);
        console.log(`💡 Sample Suggestions: ${finalSuggestionCount}\n`);

        console.log('🔐 LOGIN CREDENTIALS:\n');
        console.log('👔 ADMIN:');
        console.log('   Email: admin@mu.edu');
        console.log('   Password: admin123\n');
        console.log('👨‍🎓 STUDENTS:');
        console.log('   Email: firstname.lastname[cms_id]@mu.edu');
        console.log('   Password: student123');
        console.log('   Example: rahul.sharma20000@mu.edu / student123\n');

        console.log('🎉 Ready for demo with 200+ students!\n');

    } catch (error) {
        console.error('❌ Error:', error);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Database connection closed\n');
        process.exit(0);
    }
}

seedMUOrganization();
