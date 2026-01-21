const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Organization = require('../models/Organization');
const User = require('../models/User');
const Student = require('../models/Student');
const Hostel = require('../models/Hostel');
const Complaint = require('../models/Complaint');

// Sample Indian names
const firstNames = [
    'Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Arjun', 'Riya',
    'Karan', 'Pooja', 'Rohan', 'Divya', 'Sanjay', 'Meera', 'Aditya', 'Kavya',
    'Rajesh', 'Shreya', 'Nikhil', 'Ananya', 'Suresh', 'Ishita', 'Manish', 'Neha',
    'Varun', 'Priyanka', 'Arun', 'Shalini', 'Deepak', 'Tanvi', 'Harsh', 'Swati',
    'Vishal', 'Kriti', 'Gaurav', 'Sakshi', 'Abhishek', 'Simran', 'Mohit', 'Aarti',
    'Ashish', 'Nidhi', 'Praveen', 'Ritu', 'Sandeep', 'Megha', 'Naveen', 'Preeti'
];

const lastNames = [
    'Sharma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Gupta', 'Mehta', 'Desai',
    'Joshi', 'Verma', 'Rao', 'Nair', 'Pillai', 'Iyer', 'Menon', 'Kulkarni',
    'Agarwal', 'Bansal', 'Chopra', 'Malhotra', 'Kapoor', 'Bhatia', 'Saxena', 'Pandey'
];

const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical'];
const courses = ['B.Tech', 'B.E.', 'M.Tech', 'MCA'];
const complaintTypes = ['Maintenance', 'Food', 'Cleanliness', 'Facility', 'Security'];

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getRandomName() {
    return `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`;
}

function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...\n');

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all organizations
        const organizations = await Organization.find();

        if (organizations.length === 0) {
            console.log('❌ No organizations found. Please run multi-tenancy test first.');
            process.exit(1);
        }

        console.log(`✅ Found ${organizations.length} organizations:\n`);
        organizations.forEach(org => {
            console.log(`   - ${org.name} (${org.slug})`);
        });

        const totalStudents = 180; // Middle of 150-200 range
        const studentsPerOrg = Math.floor(totalStudents / organizations.length);
        const salt = await bcrypt.genSalt(10);
        const defaultPassword = await bcrypt.hash('student123', salt);

        let totalCreated = 0;
        let cmsIdCounter = 10000;

        for (const org of organizations) {
            console.log(`\n🏢 Processing ${org.name}...`);

            // Get or create hostels for this organization
            let hostels = await Hostel.find({ organizationId: org._id });

            if (hostels.length === 0) {
                // Create 2 hostels per organization
                hostels = await Hostel.create([
                    {
                        name: `${org.name} - Boys Hostel`,
                        location: 'Main Campus',
                        rooms: 100,
                        capacity: 200,
                        vacant: 200,
                        organizationId: org._id
                    },
                    {
                        name: `${org.name} - Girls Hostel`,
                        location: 'Main Campus',
                        rooms: 100,
                        capacity: 200,
                        vacant: 200,
                        organizationId: org._id
                    }
                ]);
                console.log(`   ✅ Created 2 hostels`);
            }

            // Create students for this organization
            const studentsToCreate = studentsPerOrg + (totalCreated + studentsPerOrg > totalStudents ? totalStudents - totalCreated - studentsPerOrg : 0);

            console.log(`   📝 Creating ${studentsToCreate} students...`);

            for (let i = 0; i < studentsToCreate; i++) {
                try {
                    const name = getRandomName();
                    const email = `${name.toLowerCase().replace(/ /g, '.')}${cmsIdCounter}@${org.slug}.edu`;
                    const hostel = getRandomElement(hostels);
                    const dept = getRandomElement(departments);
                    const course = getRandomElement(courses);
                    const batch = 2021 + Math.floor(Math.random() * 4); // 2021-2024

                    // Create User
                    const user = await User.create({
                        name,
                        email,
                        password: defaultPassword,
                        role: 'student',
                        organizationId: org._id,
                        isActive: true
                    });

                    // Create Student
                    await Student.create({
                        name,
                        email,
                        cms_id: cmsIdCounter,
                        room_no: Math.floor(Math.random() * 400) + 100,
                        batch,
                        dept,
                        course,
                        father_name: `${getRandomElement(firstNames)} ${name.split(' ')[1]}`,
                        contact: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
                        address: `${getRandomElement(['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'])}, India`,
                        dob: getRandomDate(new Date(2000, 0, 1), new Date(2006, 11, 31)),
                        cnic: `${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 9000000) + 1000000}-${Math.floor(Math.random() * 9) + 1}`,
                        hostel: hostel._id,
                        organizationId: org._id,
                        user: user._id
                    });

                    cmsIdCounter++;
                    totalCreated++;

                    if ((i + 1) % 20 === 0) {
                        process.stdout.write(`   Progress: ${i + 1}/${studentsToCreate}\r`);
                    }
                } catch (err) {
                    // Skip if duplicate
                    if (!err.message.includes('duplicate')) {
                        console.log(`   ⚠️  Error creating student: ${err.message}`);
                    }
                }
            }

            console.log(`   ✅ Created ${studentsToCreate} students for ${org.name}`);

            // Create some sample complaints (5-10 per org)
            const students = await Student.find({ organizationId: org._id }).limit(10);
            const complaintsCount = Math.floor(Math.random() * 6) + 5;

            for (let i = 0; i < complaintsCount && i < students.length; i++) {
                try {
                    await Complaint.create({
                        studentId: students[i]._id,
                        category: getRandomElement(complaintTypes),
                        title: `${getRandomElement(complaintTypes)} Issue in Room ${students[i].room_no}`,
                        description: 'Sample complaint for demonstration purposes.',
                        status: getRandomElement(['Pending', 'In Progress', 'Resolved']),
                        priority: getRandomElement(['Low', 'Medium', 'High']),
                        organizationId: org._id
                    });
                } catch (err) {
                    // Continue on error
                }
            }

            console.log(`   ✅ Created ${complaintsCount} sample complaints\n`);
        }

        // Final summary
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ DATABASE SEEDING COMPLETE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const finalStats = await Promise.all(organizations.map(async (org) => {
            const studentCount = await Student.countDocuments({ organizationId: org._id });
            const hostelCount = await Hostel.countDocuments({ organizationId: org._id });
            const complaintCount = await Complaint.countDocuments({ organizationId: org._id });

            return {
                name: org.name,
                students: studentCount,
                hostels: hostelCount,
                complaints: complaintCount
            };
        }));

        console.log('📊 FINAL STATISTICS:\n');
        finalStats.forEach(stat => {
            console.log(`🏢 ${stat.name}:`);
            console.log(`   Students: ${stat.students}`);
            console.log(`   Hostels: ${stat.hostels}`);
            console.log(`   Complaints: ${stat.complaints}\n`);
        });

        const totalStudentCount = await Student.countDocuments();
        console.log(`📈 TOTAL STUDENTS: ${totalStudentCount}`);
        console.log(`📈 TOTAL ORGANIZATIONS: ${organizations.length}`);
        console.log(`📈 AVERAGE PER ORG: ${Math.floor(totalStudentCount / organizations.length)}\n`);

        console.log('🎉 Your database is now populated with realistic demo data!');
        console.log('🔐 All students can login with password: student123\n');

    } catch (error) {
        console.error('❌ Error:', error);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Connection closed\n');
        process.exit(0);
    }
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║                                                            ║');
console.log('║     DATABASE SEEDING - DEMO DATA POPULATION                ║');
console.log('║     Target: 150-200 Students Across All Organizations     ║');
console.log('║                                                            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

seedDatabase();
