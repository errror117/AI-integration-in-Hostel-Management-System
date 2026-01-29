/**
 * Seed All Demo Data
 * Adds comprehensive demo data for all organizations including:
 * - Complaints
 * - Suggestions
 * - ChatLogs (for AI Analytics)
 * - Attendance
 * - Invoices
 * - Mess-off requests
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function seedAllDemoData() {
    try {
        console.log('🚀 Connecting to MongoDB Atlas...');
        const conn = await mongoose.createConnection(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000
        });
        console.log('✅ Connected to MongoDB Atlas!\n');

        // Define schemas
        const OrgSchema = new mongoose.Schema({}, { strict: false });
        const StudentSchema = new mongoose.Schema({}, { strict: false });
        const UserSchema = new mongoose.Schema({}, { strict: false });
        const ComplaintSchema = new mongoose.Schema({}, { strict: false });
        const SuggestionSchema = new mongoose.Schema({}, { strict: false });
        const ChatLogSchema = new mongoose.Schema({}, { strict: false });
        const AttendanceSchema = new mongoose.Schema({}, { strict: false });
        const InvoiceSchema = new mongoose.Schema({}, { strict: false });
        const MessOffSchema = new mongoose.Schema({}, { strict: false });

        const Organization = conn.model('Organization', OrgSchema, 'organizations');
        const Student = conn.model('Student', StudentSchema, 'students');
        const User = conn.model('User', UserSchema, 'users');
        const Complaint = conn.model('Complaint', ComplaintSchema, 'complaints');
        const Suggestion = conn.model('Suggestion', SuggestionSchema, 'suggestions');
        const ChatLog = conn.model('ChatLog', ChatLogSchema, 'chatlogs');
        const Attendance = conn.model('Attendance', AttendanceSchema, 'attendances');
        const Invoice = conn.model('Invoice', InvoiceSchema, 'invoices');
        const MessOff = conn.model('MessOff', MessOffSchema, 'messoffs');

        // Get organizations (ABC and MU)
        const abcOrg = await Organization.findOne({ name: /ABC Engineering/i }).lean();
        const muOrg = await Organization.findOne({ name: /Marwadi/i }).lean();

        if (!abcOrg || !muOrg) {
            console.log('❌ Organizations not found! Run seed first.');
            process.exit(1);
        }

        console.log(`📍 ABC Engineering: ${abcOrg._id}`);
        console.log(`📍 Marwadi University: ${muOrg._id}\n`);

        // Get some students from each org
        const abcStudents = await Student.find({ organizationId: abcOrg._id }).limit(20).lean();
        const muStudents = await Student.find({ organizationId: muOrg._id }).limit(20).lean();

        console.log(`👥 Found ${abcStudents.length} ABC students`);
        console.log(`👥 Found ${muStudents.length} MU students\n`);

        // Get admin users
        const abcAdmin = await User.findOne({ organizationId: abcOrg._id, role: 'org_admin' }).lean();
        const muAdmin = await User.findOne({ organizationId: muOrg._id, role: 'org_admin' }).lean();

        // Helper functions
        const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const randomDate = (daysAgo) => new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

        // ============= CHATBOT QUERIES DATA =============
        const studentQueries = [
            { query: 'What is today\'s mess menu?', intent: 'MESS_INFO', role: 'student' },
            { query: 'Show my pending invoices', intent: 'MY_INVOICES', role: 'student' },
            { query: 'I want to register a complaint', intent: 'REGISTER_COMPLAINT', role: 'student' },
            { query: 'WiFi is not working in my room', intent: 'REGISTER_COMPLAINT', role: 'student' },
            { query: 'What is the gym timing?', intent: 'GYM_INFO', role: 'student' },
            { query: 'Show my complaint status', intent: 'MY_COMPLAINTS', role: 'student' },
            { query: 'I want to submit a suggestion', intent: 'SUBMIT_SUGGESTION', role: 'student' },
            { query: 'What is the visitor policy?', intent: 'VISITOR_POLICY', role: 'student' },
            { query: 'When is laundry service available?', intent: 'LAUNDRY_INFO', role: 'student' },
            { query: 'Need room cleaning', intent: 'CLEANING_REQUEST', role: 'student' },
            { query: 'What is the WiFi password?', intent: 'WIFI_INFO', role: 'student' },
            { query: 'I want mess off for next week', intent: 'MESS_OFF', role: 'student' },
            { query: 'Show my room details', intent: 'MY_ROOM', role: 'student' },
            { query: 'Check my attendance', intent: 'ATTENDANCE', role: 'student' },
            { query: 'Emergency contact numbers', intent: 'EMERGENCY', role: 'student' },
            { query: 'Hello', intent: 'GREETING', role: 'student' },
            { query: 'Help me', intent: 'HELP', role: 'student' },
            { query: 'AC not working', intent: 'REGISTER_COMPLAINT', role: 'student' },
            { query: 'Food quality is bad', intent: 'REGISTER_COMPLAINT', role: 'student' },
            { query: 'How do I apply for leave?', intent: 'LEAVE_REQUEST', role: 'student' }
        ];

        const adminQueries = [
            { query: 'Show me today\'s summary', intent: 'ADMIN_SUMMARY', role: 'admin' },
            { query: 'Download student report', intent: 'ADMIN_DOWNLOAD', role: 'admin' },
            { query: 'Show pending complaints', intent: 'ADMIN_COMPLAINTS', role: 'admin' },
            { query: 'What are urgent issues?', intent: 'ADMIN_URGENT', role: 'admin' },
            { query: 'Show student suggestions', intent: 'ADMIN_SUGGESTIONS', role: 'admin' },
            { query: 'Invoice status report', intent: 'ADMIN_INVOICES', role: 'admin' },
            { query: 'AI chatbot analytics', intent: 'ADMIN_ANALYTICS', role: 'admin' },
            { query: 'How many students are registered?', intent: 'ADMIN_STUDENTS', role: 'admin' },
            { query: 'Show mess off requests', intent: 'ADMIN_MESS', role: 'admin' },
            { query: 'Today\'s attendance report', intent: 'ADMIN_ATTENDANCE', role: 'admin' },
            { query: 'Predict next week complaints', intent: 'ADMIN_PREDICT_COMPLAINTS', role: 'admin' },
            { query: 'Predict mess attendance tomorrow', intent: 'ADMIN_PREDICT_MESS', role: 'admin' },
            { query: 'Show trends and patterns', intent: 'ADMIN_PREDICT_TRENDS', role: 'admin' },
            { query: 'Hello', intent: 'ADMIN_GREETING', role: 'admin' },
            { query: 'What can you do?', intent: 'ADMIN_HELP', role: 'admin' }
        ];

        // Complaint types
        const complaintTypes = [
            { type: 'Electrical', title: 'Fan not working', desc: 'The ceiling fan in room is making noise and stops intermittently.', category: 'Electrical' },
            { type: 'Plumbing', title: 'Water leakage', desc: 'There is continuous water leakage from the bathroom tap.', category: 'Plumbing' },
            { type: 'WiFi/Internet', title: 'WiFi connectivity issues', desc: 'WiFi signal is very weak in my room. Cannot attend online classes.', category: 'WiFi/Internet' },
            { type: 'Mess/Food', title: 'Food quality issue', desc: 'The food quality has deteriorated. Rice is often undercooked.', category: 'Mess/Food' },
            { type: 'Cleanliness', title: 'Room not cleaned', desc: 'Housekeeping has not cleaned my room for 3 days.', category: 'Cleanliness' },
            { type: 'Security', title: 'Door lock malfunction', desc: 'Main door lock is not working properly. Security concern.', category: 'Security' },
            { type: 'Maintenance', title: 'Window glass broken', desc: 'Window glass is cracked and needs replacement.', category: 'Maintenance' },
            { type: 'Electrical', title: 'AC not cooling', desc: 'AC in room is not cooling properly despite running for hours.', category: 'Electrical' }
        ];

        const suggestionTypes = [
            { title: 'Extend library hours', desc: 'Please extend library hours till midnight during exams.' },
            { title: 'Add gym equipment', desc: 'The hostel gym needs more treadmills and dumbbells.' },
            { title: 'Improve mess menu', desc: 'Add more variety especially South Indian options.' },
            { title: 'Create study rooms', desc: 'Dedicated quiet study rooms on each floor would help.' },
            { title: 'Better laundry service', desc: 'Current laundry service is slow. Add more machines.' },
            { title: 'Install water coolers', desc: 'Water coolers needed on each floor.' }
        ];

        let stats = {
            chatLogs: 0,
            complaints: 0,
            suggestions: 0,
            attendance: 0,
            invoices: 0,
            messOff: 0
        };

        // ============= SEED DATA FOR ABC ENGINEERING =============
        console.log('📝 Seeding data for ABC Engineering College...\n');

        for (const student of abcStudents) {
            // Add ChatLogs (3-5 per student)
            const numLogs = Math.floor(Math.random() * 3) + 3;
            for (let i = 0; i < numLogs; i++) {
                const queryData = random(studentQueries);
                await ChatLog.create({
                    organizationId: abcOrg._id,
                    user: student._id,
                    role: 'student',
                    query: queryData.query,
                    intent: queryData.intent,
                    confidence: (Math.random() * 0.3 + 0.7).toFixed(2),
                    response: 'Bot response generated',
                    timestamp: randomDate(Math.floor(Math.random() * 30)),
                    meta: {
                        responseTime: Math.floor(Math.random() * 500) + 100,
                        wasHelpful: Math.random() > 0.2
                    }
                });
                stats.chatLogs++;
            }

            // Add Complaints (1-2 per student)
            const numComplaints = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < numComplaints; i++) {
                const complaint = random(complaintTypes);
                await Complaint.create({
                    organizationId: abcOrg._id,
                    student: student._id,
                    type: complaint.type,
                    title: complaint.title,
                    description: complaint.desc,
                    category: complaint.category,
                    status: random(['pending', 'in_progress', 'resolved']),
                    urgencyLevel: random(['low', 'medium', 'high']),
                    aiPriorityScore: Math.floor(Math.random() * 50) + 30,
                    sentiment: random(['neutral', 'negative']),
                    date: randomDate(Math.floor(Math.random() * 30))
                });
                stats.complaints++;
            }

            // Add Suggestions (50% chance)
            if (Math.random() > 0.5) {
                const suggestion = random(suggestionTypes);
                await Suggestion.create({
                    organizationId: abcOrg._id,
                    student: student._id,
                    title: suggestion.title,
                    description: suggestion.desc,
                    status: random(['pending', 'reviewed', 'implemented']),
                    date: randomDate(Math.floor(Math.random() * 45))
                });
                stats.suggestions++;
            }

            // Add Attendance (last 7 days)
            for (let d = 0; d < 7; d++) {
                await Attendance.create({
                    organizationId: abcOrg._id,
                    student: student._id,
                    date: randomDate(d),
                    status: Math.random() > 0.15 ? 'present' : 'absent'
                });
                stats.attendance++;
            }

            // Add Invoice
            await Invoice.create({
                organizationId: abcOrg._id,
                student: student._id,
                title: random(['Hostel Fee', 'Mess Fee', 'Maintenance Charge']),
                amount: Math.floor(Math.random() * 10000) + 5000,
                status: random(['pending', 'paid', 'overdue']),
                date: randomDate(30)
            });
            stats.invoices++;

            // Add MessOff (30% chance)
            if (Math.random() > 0.7) {
                const startDate = randomDate(Math.floor(Math.random() * 10));
                await MessOff.create({
                    organizationId: abcOrg._id,
                    student: student._id,
                    leaving_date: startDate,
                    return_date: new Date(startDate.getTime() + (Math.random() * 5 + 1) * 24 * 60 * 60 * 1000),
                    reason: random(['Going home', 'Family function', 'Medical leave']),
                    status: random(['pending', 'approved', 'rejected']),
                    request_date: randomDate(15)
                });
                stats.messOff++;
            }
        }

        // Add Admin ChatLogs for ABC
        if (abcAdmin) {
            for (let i = 0; i < 15; i++) {
                const queryData = random(adminQueries);
                await ChatLog.create({
                    organizationId: abcOrg._id,
                    user: abcAdmin._id,
                    role: 'admin',
                    query: queryData.query,
                    intent: queryData.intent,
                    confidence: (Math.random() * 0.2 + 0.8).toFixed(2),
                    response: 'Admin bot response',
                    timestamp: randomDate(Math.floor(Math.random() * 14))
                });
                stats.chatLogs++;
            }
        }

        console.log('✅ ABC Engineering data seeded!\n');

        // ============= SEED DATA FOR MARWADI UNIVERSITY =============
        console.log('📝 Seeding data for Marwadi University...\n');

        for (const student of muStudents) {
            // Add ChatLogs
            const numLogs = Math.floor(Math.random() * 3) + 2;
            for (let i = 0; i < numLogs; i++) {
                const queryData = random(studentQueries);
                await ChatLog.create({
                    organizationId: muOrg._id,
                    user: student._id,
                    role: 'student',
                    query: queryData.query,
                    intent: queryData.intent,
                    confidence: (Math.random() * 0.3 + 0.7).toFixed(2),
                    response: 'Bot response generated',
                    timestamp: randomDate(Math.floor(Math.random() * 30))
                });
                stats.chatLogs++;
            }

            // Add Complaints
            const complaint = random(complaintTypes);
            await Complaint.create({
                organizationId: muOrg._id,
                student: student._id,
                type: complaint.type,
                title: complaint.title,
                description: complaint.desc,
                category: complaint.category,
                status: random(['pending', 'in_progress', 'resolved']),
                urgencyLevel: random(['low', 'medium', 'high']),
                aiPriorityScore: Math.floor(Math.random() * 50) + 30,
                date: randomDate(Math.floor(Math.random() * 30))
            });
            stats.complaints++;

            // Add Suggestions (40% chance)
            if (Math.random() > 0.6) {
                const suggestion = random(suggestionTypes);
                await Suggestion.create({
                    organizationId: muOrg._id,
                    student: student._id,
                    title: suggestion.title,
                    description: suggestion.desc,
                    status: random(['pending', 'reviewed']),
                    date: randomDate(Math.floor(Math.random() * 40))
                });
                stats.suggestions++;
            }

            // Add Attendance
            for (let d = 0; d < 7; d++) {
                await Attendance.create({
                    organizationId: muOrg._id,
                    student: student._id,
                    date: randomDate(d),
                    status: Math.random() > 0.1 ? 'present' : 'absent'
                });
                stats.attendance++;
            }

            // Add Invoice
            await Invoice.create({
                organizationId: muOrg._id,
                student: student._id,
                title: random(['Hostel Fee', 'Mess Fee']),
                amount: Math.floor(Math.random() * 8000) + 4000,
                status: random(['pending', 'paid']),
                date: randomDate(25)
            });
            stats.invoices++;

            // Add MessOff (25% chance)
            if (Math.random() > 0.75) {
                const startDate = randomDate(Math.floor(Math.random() * 7));
                await MessOff.create({
                    organizationId: muOrg._id,
                    student: student._id,
                    leaving_date: startDate,
                    return_date: new Date(startDate.getTime() + (Math.random() * 4 + 1) * 24 * 60 * 60 * 1000),
                    reason: random(['Weekend trip', 'Family visit', 'Medical appointment']),
                    status: random(['pending', 'approved']),
                    request_date: randomDate(10)
                });
                stats.messOff++;
            }
        }

        // Add Admin ChatLogs for MU
        if (muAdmin) {
            for (let i = 0; i < 12; i++) {
                const queryData = random(adminQueries);
                await ChatLog.create({
                    organizationId: muOrg._id,
                    user: muAdmin._id,
                    role: 'admin',
                    query: queryData.query,
                    intent: queryData.intent,
                    confidence: (Math.random() * 0.2 + 0.8).toFixed(2),
                    response: 'Admin bot response',
                    timestamp: randomDate(Math.floor(Math.random() * 14))
                });
                stats.chatLogs++;
            }
        }

        console.log('✅ Marwadi University data seeded!\n');

        // Summary
        console.log('═══════════════════════════════════════');
        console.log('          📊 SEEDING SUMMARY           ');
        console.log('═══════════════════════════════════════');
        console.log(`   ChatLogs:      ${stats.chatLogs} created`);
        console.log(`   Complaints:    ${stats.complaints} created`);
        console.log(`   Suggestions:   ${stats.suggestions} created`);
        console.log(`   Attendance:    ${stats.attendance} records`);
        console.log(`   Invoices:      ${stats.invoices} created`);
        console.log(`   MessOff:       ${stats.messOff} created`);
        console.log('═══════════════════════════════════════');
        console.log('\n✅ All demo data successfully seeded!');

        await conn.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

seedAllDemoData();
