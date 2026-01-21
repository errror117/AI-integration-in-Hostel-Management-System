/**
 * Complete Seeder - 50 Students with ALL Required Fields
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Student = require('../models/Student');
const Hostel = require('../models/Hostel');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected\n');
    } catch (error) {
        console.error('❌ MongoDB Error:', error.message);
        process.exit(1);
    }
};

// 50 Hindu student names
const studentNames = [
    'Arjun Sharma', 'Priya Patel', 'Rahul Gupta', 'Ananya Reddy', 'Vikram Singh',
    'Sneha Iyer', 'Aditya Verma', 'Kavya Nair', 'Rohan Kumar', 'Diya Desai',
    'Karan Joshi', 'Isha Malhotra', 'Aarav Mehta', 'Riya Kapoor', 'Siddharth Rao',
    'Aisha Pandey', 'Arnav Sinha', 'Meera Pillai', 'Vivaan Agarwal', 'Sara Chatterjee',
    'Ishaan Mishra', 'Anjali Bhatt', 'Kabir Saxena', 'Tanvi Yadav', 'Ayaan Khan',
    'Nisha Jain', 'Dev Chauhan', 'Pooja Menon', 'Yash Trivedi', 'Kriti Bansal',
    'Shiv Rajput', 'Divya Kohli', 'Aryan Thakur', 'Sanvi Tiwari', 'Lakshya Bose',
    'Shreya Das', 'Advait Kulkarni', 'Avni Bhatia', 'Vihaan Goyal', 'Myra Shah',
    'Reyansh Dubey', 'Aadhya Soni', 'Atharv Shukla', 'Kiara Arora', 'Rudra Ghosh',
    'Pari Chopra', 'Dhruv Sethi', 'Nitya Bajaj', 'Pranav Dutta', 'Saanvi Varma'
];

async function seed() {
    try {
        await connectDB();

        console.log('🌱 SEEDING 50 STUDENTS WITH ALL FIELDS\n');
        console.log('═══════════════════════════════════════\n');

        // Clear old data
        console.log('🧹 Clearing old students and users...');
        await Student.deleteMany({});
        await User.deleteMany({ isAdmin: false });
        console.log('✅ Old data cleared\n');

        // Get or create hostel
        let hostel = await Hostel.findOne();
        if (!hostel) {
            hostel = await Hostel.create({
                name: 'Marwadi University Hostel',
                address: 'Rajkot, Gujarat',
                contact_no: '9876543210'
            });
        }

        const password = await bcrypt.hash('password123', 10);

        // Create 50 students with ALL required fields
        console.log(`📝 Creating ${studentNames.length} students...\n`);

        for (let i = 0; i < studentNames.length; i++) {
            const name = studentNames[i];
            const firstName = name.split(' ')[0].toLowerCase();
            const lastName = name.split(' ')[1].toLowerCase();
            const email = `${firstName}.${lastName}@student.com`;

            // Create user
            const user = await User.create({
                email: email,
                password: password,
                isAdmin: false
            });

            // Create student with ALL required fields from Student model
            const student = await Student.create({
                user: user._id,
                name: name,
                cms_id: 100001 + i,                          // Required, unique
                email: email,                                  // Required, unique
                contact: `98765432${String(i).padStart(2, '0')}`, // Required
                hostel: hostel._id,
                room_no: 101 + Math.floor(i / 2),            // Required
                batch: 2024 - (i % 4),                        // Required
                dept: ['Computer Science', 'IT', 'Electronics', 'Mechanical'][i % 4], // Required
                course: ['B.Tech', 'M.Tech', 'BCA', 'MCA'][i % 4], // Required
                father_name: `Father of ${name}`,             // Required
                mother_name: `Mother of ${name}`,
                address: `${101 + i} Gandhi Road, Rajkot, Gujarat`, // Required
                dob: new Date(2002 + (i % 5), i % 12, (i % 28) + 1), // Required
                cnic: `${42201}${String(1000000 + i).substring(1)}1`, // Required, unique (CNIC format)
                date_of_joining: new Date(2024, 0, 15)
            });

            if ((i + 1) % 10 === 0) {
                console.log(`✅ Created ${i + 1}/${studentNames.length} students`);
            }
        }

        console.log(`\n🎉 Successfully created ${studentNames.length} students!\n`);
        console.log('📧 Test Login:');
        console.log('   Email: arjun.sharma@student.com');
        console.log('   Password: password123\n');
        console.log('✅ All students use password: password123\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

seed();
