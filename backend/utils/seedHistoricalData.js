/**
 * Optimized Historical Data Seeder - 500+ Students Edition
 * Uses batch inserts for better performance
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Student = require('../models/Student');
const Hostel = require('../models/Hostel');
const Complaint = require('../models/Complaint');
const Suggestion = require('../models/Suggestion');
const Invoice = require('../models/Invoice');
const Attendance = require('../models/Attendance');
const ChatLog = require('../models/ChatLog');
const MessOff = require('../models/MessOff');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 60000
        });
        console.log('✅ MongoDB Connected\n');
    } catch (error) {
        console.error('❌ MongoDB Error:', error.message);
        process.exit(1);
    }
};

// Helper functions
const randomDate = (daysAgo) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    return date;
};

const weightedRandom = (items, weights) => {
    const total = weights.reduce((a, b) => a + b, 0);
    const random = Math.random() * total;
    let sum = 0;
    for (let i = 0; i < items.length; i++) {
        sum += weights[i];
        if (random < sum) return items[i];
    }
    return items[0];
};

// 500+ Indian names
const firstNames = [
    'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
    'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Advait', 'Aarush', 'Kabir', 'Dhruv', 'Ritvik', 'Rudra',
    'Ananya', 'Aadhya', 'Aanya', 'Diya', 'Pihu', 'Prisha', 'Anvi', 'Anika', 'Navya', 'Myra',
    'Sara', 'Ira', 'Ahana', 'Kiara', 'Mira', 'Riya', 'Saanvi', 'Siya', 'Tara', 'Shanaya',
    'Rohan', 'Rahul', 'Raj', 'Ravi', 'Rohit', 'Sachin', 'Sagar', 'Sahil', 'Sandeep', 'Sanjay',
    'Sneha', 'Sonia', 'Sunita', 'Swati', 'Tanvi', 'Tanya', 'Uma', 'Usha', 'Vaishali', 'Vandana',
    'Karan', 'Kartik', 'Kunal', 'Lalit', 'Lokesh', 'Madhav', 'Mahesh', 'Manoj', 'Mayank', 'Mohit',
    'Neha', 'Nidhi', 'Nikita', 'Nisha', 'Pallavi', 'Payal', 'Pooja', 'Prachi', 'Pragya', 'Preeti',
    'Vishal', 'Yash', 'Yogesh', 'Akash', 'Aman', 'Amit', 'Anand', 'Anil', 'Ankur', 'Anuj',
    'Rashmi', 'Rekha', 'Renuka', 'Richa', 'Ridhi', 'Ritu', 'Ruchi', 'Sakshi', 'Sandhya', 'Sanjana'
];

const lastNames = [
    'Sharma', 'Patel', 'Gupta', 'Singh', 'Kumar', 'Reddy', 'Verma', 'Joshi', 'Shah', 'Mehta',
    'Agarwal', 'Iyer', 'Nair', 'Rao', 'Desai', 'Jain', 'Kapoor', 'Malhotra', 'Khanna', 'Chopra',
    'Bhatia', 'Saxena', 'Mishra', 'Pandey', 'Tiwari', 'Dubey', 'Srivastava', 'Yadav', 'Chauhan', 'Rajput'
];

const depts = ['CSE', 'ECE', 'IT', 'ME', 'CE', 'EE', 'AI', 'DS', 'IOT', 'CST'];
const courses = ['B.Tech', 'M.Tech', 'BCA', 'MCA'];
const batches = [2021, 2022, 2023, 2024, 2025];
const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'];

const complaintTemplates = [
    { type: 'Electric', title: 'WiFi not working', description: 'Internet connection is very slow.' },
    { type: 'Electric', title: 'Fan not working', description: 'Ceiling fan has stopped working.' },
    { type: 'Cleaning', title: 'Bathroom not cleaned', description: 'Bathroom needs cleaning.' },
    { type: 'Cleaning', title: 'Room dusty', description: 'Room not swept for days.' },
    { type: 'Furniture', title: 'Broken chair', description: 'Study chair is broken.' },
    { type: 'Others', title: 'Noisy neighbors', description: 'Room neighbors playing loud music.' }
];

const suggestionTemplates = [
    { title: 'Gym Equipment', description: 'Please add more gym equipment.' },
    { title: 'Menu Variety', description: 'More variety in mess menu.' },
    { title: 'WiFi Speed', description: 'Upgrade internet bandwidth.' },
    { title: 'Laundry Machines', description: 'Add more washing machines.' },
    { title: 'Study Room', description: '24-hour study room access.' }
];

const chatQueries = [
    { query: 'Hello', intent: 'GREETING' },
    { query: 'Mess menu', intent: 'MESS_INFO' },
    { query: 'Register complaint', intent: 'REGISTER_COMPLAINT' },
    { query: 'Show complaints', intent: 'MY_COMPLAINTS' },
    { query: 'WiFi password', intent: 'WIFI_INFO' },
    { query: 'Help', intent: 'HELP' }
];

async function seedData() {
    try {
        console.log('🌱 AI HOSTEL MANAGEMENT - 500+ STUDENTS SEEDER (OPTIMIZED)\n');
        console.log('═══════════════════════════════════════════════════════════\n');

        // Clear existing data
        console.log('🧹 Clearing old data...');
        await Promise.all([
            User.deleteMany({ email: /@student\.com$/ }),
            Student.deleteMany({ email: /@student\.com$/ }),
            Complaint.deleteMany({}),
            Suggestion.deleteMany({}),
            Invoice.deleteMany({}),
            Attendance.deleteMany({}),
            ChatLog.deleteMany({}),
            MessOff.deleteMany({})
        ]);
        console.log('✅ Old data cleared\n');

        // Get or create hostels
        let hostels = await Hostel.find();
        if (hostels.length === 0) {
            hostels = await Hostel.insertMany([
                { name: 'MU Hostel A', address: 'Block A', contact_no: '02212345678' },
                { name: 'MU Hostel B', address: 'Block B', contact_no: '02212345679' }
            ]);
        }

        // Create 520 students using batch
        const STUDENT_COUNT = 520;
        console.log(`👥 Creating ${STUDENT_COUNT} students...`);
        const hashedPassword = await bcrypt.hash('student123', 10);
        const students = [];
        let cmsId = 100001;
        let roomNo = 101;

        for (let i = 0; i < STUDENT_COUNT; i++) {
            const firstName = firstNames[i % firstNames.length];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@student.com`;
            const hostel = hostels[i % hostels.length];

            const user = await User.create({
                email: email,
                password: hashedPassword,
                isAdmin: false
            });

            students.push({
                user: user._id,
                name: `${firstName} ${lastName}`,
                email: email,
                cms_id: cmsId++,
                room_no: roomNo,
                batch: batches[Math.floor(Math.random() * batches.length)],
                dept: depts[Math.floor(Math.random() * depts.length)],
                course: courses[Math.floor(Math.random() * courses.length)],
                contact: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
                father_name: `Mr. ${lastName}`,
                address: `${cities[Math.floor(Math.random() * cities.length)]}, India`,
                dob: new Date(2000 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), 15),
                cnic: `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
                hostel: hostel._id
            });

            if ((i + 1) % 3 === 0) roomNo++;
            if ((i + 1) % 100 === 0) console.log(`   ✅ ${i + 1}/${STUDENT_COUNT} students created`);
        }

        const createdStudents = await Student.insertMany(students);
        console.log(`✅ Created ${createdStudents.length} students\n`);

        // Create complaints in batches
        console.log('🛠️  Creating 1000+ complaints...');
        const complaints = [];
        for (let day = 0; day < 90; day++) {
            const date = new Date();
            date.setDate(date.getDate() - day);
            const count = (date.getDay() === 0 || date.getDay() === 6) ? 5 : 12;

            for (let i = 0; i < count; i++) {
                const student = createdStudents[Math.floor(Math.random() * createdStudents.length)];
                const template = complaintTemplates[Math.floor(Math.random() * complaintTemplates.length)];
                complaints.push({
                    student: student._id,
                    hostel: student.hostel,
                    type: template.type,
                    title: template.title,
                    description: template.description,
                    status: day > 7 ? (Math.random() > 0.2 ? 'resolved' : 'pending') : 'pending',
                    date: date
                });
            }
        }
        await Complaint.insertMany(complaints);
        console.log(`✅ Created ${complaints.length} complaints\n`);

        // Create suggestions
        console.log('💡 Creating 500 suggestions...');
        const suggestions = [];
        for (let i = 0; i < 500; i++) {
            const student = createdStudents[Math.floor(Math.random() * createdStudents.length)];
            const template = suggestionTemplates[Math.floor(Math.random() * suggestionTemplates.length)];
            suggestions.push({
                student: student._id,
                hostel: student.hostel,
                title: template.title,
                description: template.description,
                status: weightedRandom(['pending', 'approved', 'rejected'], [0.4, 0.4, 0.2]),
                date: randomDate(60)
            });
        }
        await Suggestion.insertMany(suggestions);
        console.log(`✅ Created ${suggestions.length} suggestions\n`);

        // Create invoices
        console.log('💰 Creating invoices (6 months)...');
        const invoices = [];
        for (const student of createdStudents) {
            for (let month = 0; month < 6; month++) {
                const invoiceDate = new Date();
                invoiceDate.setMonth(invoiceDate.getMonth() - month);
                invoices.push({
                    student: student._id,
                    title: `Mess Fee - ${invoiceDate.toLocaleString('default', { month: 'long' })}`,
                    amount: 3000 + Math.floor(Math.random() * 1000),
                    status: month === 0 ? 'pending' : (Math.random() > 0.1 ? 'paid' : 'pending'),
                    date: invoiceDate
                });
            }
        }
        await Invoice.insertMany(invoices);
        console.log(`✅ Created ${invoices.length} invoices\n`);

        // Create attendance (last 14 days for speed)
        console.log('📋 Creating attendance (14 days)...');
        const attendanceRecords = [];
        for (let day = 0; day < 14; day++) {
            const date = new Date();
            date.setDate(date.getDate() - day);
            date.setHours(0, 0, 0, 0);
            const rate = (date.getDay() === 0 || date.getDay() === 6) ? 0.6 : 0.85;

            for (const student of createdStudents) {
                if (Math.random() > 0.1) {
                    attendanceRecords.push({
                        student: student._id,
                        status: Math.random() < rate ? 'present' : 'absent',
                        date: date
                    });
                }
            }
        }
        await Attendance.insertMany(attendanceRecords);
        console.log(`✅ Created ${attendanceRecords.length} attendance records\n`);

        // Create chat logs
        console.log('💬 Creating 1000 chat logs...');
        const chatLogs = [];
        for (let i = 0; i < 1000; i++) {
            const student = createdStudents[Math.floor(Math.random() * createdStudents.length)];
            const chat = chatQueries[Math.floor(Math.random() * chatQueries.length)];
            chatLogs.push({
                user: student._id,
                role: Math.random() > 0.1 ? 'student' : 'admin',
                query: chat.query,
                intent: chat.intent,
                confidence: 0.7 + Math.random() * 0.3,
                response: `Response for ${chat.intent}`,
                timestamp: randomDate(30)
            });
        }
        await ChatLog.insertMany(chatLogs);
        console.log(`✅ Created ${chatLogs.length} chat logs\n`);

        // Create mess-off requests
        console.log('🍽️  Creating 300 mess-off requests...');
        const messOffs = [];
        for (let i = 0; i < 300; i++) {
            const student = createdStudents[Math.floor(Math.random() * createdStudents.length)];
            const start = Math.floor(Math.random() * 60);
            const duration = 1 + Math.floor(Math.random() * 5);
            const leavingDate = new Date();
            leavingDate.setDate(leavingDate.getDate() - start);
            const returnDate = new Date(leavingDate);
            returnDate.setDate(returnDate.getDate() + duration);

            messOffs.push({
                student: student._id,
                hostel: student.hostel,
                leaving_date: leavingDate,
                return_date: returnDate,
                reason: `Going home for ${duration} days`,
                status: weightedRandom(['pending', 'approved', 'rejected'], [0.3, 0.5, 0.2]),
                request_date: leavingDate
            });
        }
        await MessOff.insertMany(messOffs);
        console.log(`✅ Created ${messOffs.length} mess-off requests\n`);

        // Summary
        console.log('═══════════════════════════════════════════════════════════');
        console.log('✅ DATA SEEDED SUCCESSFULLY!\n');
        console.log('📊 SUMMARY:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`👥 Students: ${createdStudents.length}`);
        console.log(`🛠️  Complaints: ${complaints.length}`);
        console.log(`💡 Suggestions: ${suggestions.length}`);
        console.log(`💰 Invoices: ${invoices.length}`);
        console.log(`📋 Attendance: ${attendanceRecords.length}`);
        console.log(`💬 Chat Logs: ${chatLogs.length}`);
        console.log(`🍽️  Mess-Offs: ${messOffs.length}`);
        console.log('═══════════════════════════════════════════════════════════\n');

        console.log('🔐 LOGIN CREDENTIALS:');
        console.log('   Students: aarav.sharma0@student.com / student123');
        console.log('   Admin: admin@test.com / password123\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

connectDB().then(seedData);
