/**
 * Chat Logs Seeding Script for Analytics Testing
 * Creates sample chat interactions for demonstrating AI analytics
 * Run: node utils/seedChatLogs.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const ChatLog = require('../models/ChatLog');
const Student = require('../models/Student');
const Organization = require('../models/Organization');

// Sample queries by intent
const sampleQueries = {
    GREETING: ['hello', 'hi', 'hey there', 'good morning', 'namaste'],
    MESS_INFO: ['what is today menu', 'mess timings', 'dinner menu', 'lunch today', 'mess food'],
    REGISTER_COMPLAINT: ['I have a complaint', 'register complaint', 'my fan not working', 'wifi issue', 'water problem'],
    MY_COMPLAINTS: ['show my complaints', 'complaint status', 'track my complaint', 'my issues'],
    MY_INVOICES: ['show invoice', 'my dues', 'pending payment', 'hostel fee', 'bill'],
    HELP: ['help me', 'what can you do', 'guide me', 'features'],
    WIFI_INFO: ['wifi password', 'internet not working', 'network issue'],
    LEAVE_REQUEST: ['I want to apply leave', 'going home', 'leave request'],
    MESS_OFF: ['mess off request', 'skip mess', 'not eating tomorrow'],
    EMERGENCY: ['emergency contact', 'warden number', 'ambulance'],
    GYM_INFO: ['gym timing', 'workout', 'gym open'],
    LAUNDRY_INFO: ['laundry service', 'washing clothes', 'laundry timing']
};

// Sample responses by intent
const sampleResponses = {
    GREETING: '👋 Hello! How can I help you today?',
    MESS_INFO: '🍲 **Today\'s Menu**\n• Breakfast: Poha, Tea\n• Lunch: Rice, Dal, Sabzi\n• Dinner: Roti, Paneer, Salad',
    REGISTER_COMPLAINT: '🛠️ I\'ll help you register a complaint. What type of issue is this?',
    MY_COMPLAINTS: '📋 Found 2 complaints:\n• #123: Fan issue - In Progress\n• #124: WiFi - Resolved',
    MY_INVOICES: '💳 Your pending dues: ₹8,500 (Due: Jan 10)',
    HELP: '❓ I can help with: Mess Menu, Complaints, Leave Requests, Invoices, and more!',
    WIFI_INFO: '📶 WiFi: Hostel_Student_5G\nPassword: Learn@Hostel2025',
    LEAVE_REQUEST: '📝 Leave Application: Are you going Home or Outing?',
    MESS_OFF: '🍽️ Request mess off? Please provide dates.',
    EMERGENCY: '🚨 Warden: +91 98765 43210\nAmbulance: 108',
    GYM_INFO: '🏋️ Gym: 6 AM - 9 AM, 5 PM - 9 PM',
    LAUNDRY_INFO: '🧺 Laundry: Drop before 10 AM, pickup next day 5 PM'
};

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(daysBack) {
    const now = new Date();
    const pastDate = new Date(now.getTime() - Math.random() * daysBack * 24 * 60 * 60 * 1000);
    return pastDate;
}

async function seedChatLogs() {
    try {
        console.log('🌱 Starting Chat Logs seeding...\n');

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get organizations and students
        const organizations = await Organization.find();

        if (organizations.length === 0) {
            console.log('⚠️  No active organizations found.');
            return;
        }

        let totalCreated = 0;
        const intents = Object.keys(sampleQueries);

        for (const org of organizations) {
            console.log(`🏢 Seeding chat logs for: ${org.name}`);

            // Get students from this organization
            const students = await Student.find({ organizationId: org._id }).limit(20);

            if (students.length === 0) {
                console.log('   ⚠️  No students found, skipping...\n');
                continue;
            }

            // Create chat logs (50 per organization)
            const logsPerOrg = 50;

            for (let i = 0; i < logsPerOrg; i++) {
                const student = getRandomElement(students);
                const intent = getRandomElement(intents);
                const query = getRandomElement(sampleQueries[intent]);
                const response = sampleResponses[intent];
                const confidence = 0.7 + Math.random() * 0.3; // 0.7 - 1.0

                try {
                    await ChatLog.create({
                        organizationId: org._id,
                        user: student.user || student._id,
                        role: 'student',
                        query: query,
                        intent: intent,
                        confidence: parseFloat(confidence.toFixed(2)),
                        response: response,
                        timestamp: getRandomDate(30), // Last 30 days
                        meta: {
                            responseTime: Math.floor(Math.random() * 500) + 100,
                            wasHelpful: Math.random() > 0.2
                        }
                    });
                    totalCreated++;
                } catch (e) {
                    // Skip errors
                }
            }

            // Add some admin chat logs (10 per org)
            for (let i = 0; i < 10; i++) {
                const adminIntents = ['ADMIN_SUMMARY', 'ADMIN_COMPLAINTS', 'ADMIN_STUDENTS', 'ADMIN_INVOICES'];
                const adminQueries = {
                    'ADMIN_SUMMARY': 'Give me a summary',
                    'ADMIN_COMPLAINTS': 'Show complaints',
                    'ADMIN_STUDENTS': 'How many students',
                    'ADMIN_INVOICES': 'Pending invoices'
                };
                const intent = getRandomElement(adminIntents);

                try {
                    await ChatLog.create({
                        organizationId: org._id,
                        user: students[0].user || students[0]._id,
                        role: 'admin',
                        query: adminQueries[intent],
                        intent: intent,
                        confidence: 0.95,
                        response: '📊 Admin response generated...',
                        timestamp: getRandomDate(14),
                        meta: {
                            responseTime: Math.floor(Math.random() * 300) + 50
                        }
                    });
                    totalCreated++;
                } catch (e) {
                    // Skip errors
                }
            }

            console.log(`   ✅ Created ${logsPerOrg + 10} chat logs\n`);
        }

        // Summary
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ CHAT LOGS SEEDING COMPLETE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const totalLogs = await ChatLog.countDocuments();
        console.log(`📊 Total chat logs in database: ${totalLogs}`);
        console.log(`📈 Logs created this run: ${totalCreated}`);
        console.log(`\n🎉 AI Analytics now has sample data to display!`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Connection closed');
        process.exit(0);
    }
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║                                                            ║');
console.log('║     CHAT LOGS SEEDING - Analytics Demo Data               ║');
console.log('║                                                            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

seedChatLogs();
