// Comprehensive Demo Data Seeder for ABC Engineering & Marwadi University
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function seedDemoData() {
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
        const HostelSchema = new mongoose.Schema({}, { strict: false });
        const ComplaintSchema = new mongoose.Schema({}, { strict: false });
        const SuggestionSchema = new mongoose.Schema({}, { strict: false });
        const MessOffSchema = new mongoose.Schema({}, { strict: false });
        const InvoiceSchema = new mongoose.Schema({}, { strict: false });
        const AttendanceSchema = new mongoose.Schema({}, { strict: false });

        const Organization = conn.model('Organization', OrgSchema, 'organizations');
        const Student = conn.model('Student', StudentSchema, 'students');
        const Hostel = conn.model('Hostel', HostelSchema, 'hostels');
        const Complaint = conn.model('Complaint', ComplaintSchema, 'complaints');
        const Suggestion = conn.model('Suggestion', SuggestionSchema, 'suggestions');
        const MessOff = conn.model('MessOff', MessOffSchema, 'messoffs');
        const Invoice = conn.model('Invoice', InvoiceSchema, 'invoices');
        const Attendance = conn.model('Attendance', AttendanceSchema, 'attendances');

        // Get organizations
        const abcOrg = await Organization.findOne({ name: /ABC Engineering/i }).lean();
        const muOrg = await Organization.findOne({ name: /Marwadi University/i }).lean();

        if (!abcOrg) {
            console.log('❌ ABC Engineering College not found!');
            process.exit(1);
        }
        if (!muOrg) {
            console.log('❌ Marwadi University not found!');
            process.exit(1);
        }

        console.log(`📍 ABC Engineering: ${abcOrg._id}`);
        console.log(`📍 Marwadi University: ${muOrg._id}\n`);

        // Get hostels
        const abcHostel = await Hostel.findOne({ organizationId: abcOrg._id }).lean();
        const muHostel = await Hostel.findOne({ organizationId: muOrg._id }).lean();

        if (!abcHostel) {
            console.log('⚠️ No hostel found for ABC, creating one...');
            const newHostel = await Hostel.create({
                organizationId: abcOrg._id,
                name: 'ABC Boys Hostel',
                type: 'boys',
                capacity: 500,
                occupancy: 350,
                address: 'ABC Engineering Campus, Ahmedabad'
            });
            abcHostel = newHostel.toObject();
        }

        if (!muHostel) {
            console.log('⚠️ No hostel found for MU, creating one...');
            const newHostel = await Hostel.create({
                organizationId: muOrg._id,
                name: 'MU Main Hostel',
                type: 'boys',
                capacity: 600,
                occupancy: 450,
                address: 'Marwadi University Campus, Rajkot'
            });
            muHostel = newHostel.toObject();
        }

        console.log(`🏠 ABC Hostel: ${abcHostel?.name || 'Created'}`);
        console.log(`🏠 MU Hostel: ${muHostel?.name || 'Created'}\n`);

        // Get students for ABC
        const abcStudents = await Student.find({
            organizationId: abcOrg._id,
            email: { $in: ['priya.p@abc-eng.edu', 'rahul.s@abc-eng.edu', 'amit.k@abc-eng.edu', 'divya.nair10000@abc-eng.edu', 'student@abc-eng.edu'] }
        }).lean();

        // Get students for Marwadi
        const muStudents = await Student.find({
            organizationId: muOrg._id,
            email: { $in: ['kunal.pillai20000@mu.edu', 'priyanka.sen20001@mu.edu', 'nitin.das20002@mu.edu', 'tanya.saxena20003@mu.edu'] }
        }).lean();

        console.log(`👥 Found ${abcStudents.length} ABC students`);
        console.log(`👥 Found ${muStudents.length} MU students\n`);

        // Complaint categories and titles
        const complaintTypes = [
            { type: 'electrical', title: 'Fan not working', desc: 'The ceiling fan in my room is not working properly. It makes loud noise and sometimes stops.' },
            { type: 'plumbing', title: 'Water leakage in bathroom', desc: 'There is continuous water leakage from the bathroom tap. Wasting a lot of water.' },
            { type: 'internet', title: 'WiFi connectivity issues', desc: 'WiFi signal is very weak in my room. Cannot attend online classes properly.' },
            { type: 'furniture', title: 'Broken study chair', desc: 'My study chair is broken. The back support has come off completely.' },
            { type: 'mess', title: 'Food quality issue', desc: 'The food quality in mess has deteriorated. Rice is often undercooked.' },
            { type: 'electrical', title: 'AC not cooling', desc: 'The AC in my room is not cooling properly despite being on for hours.' },
            { type: 'plumbing', title: 'Clogged drain', desc: 'The bathroom drain is completely clogged. Water is not draining at all.' },
            { type: 'maintenance', title: 'Window glass broken', desc: 'The window glass is cracked and needs replacement before monsoon.' },
            { type: 'cleaning', title: 'Room not cleaned properly', desc: 'The housekeeping staff has not cleaned my room for the past 3 days.' },
            { type: 'security', title: 'Door lock malfunction', desc: 'The main door lock is not working properly. Security concern.' }
        ];

        const suggestionTypes = [
            { title: 'Extend library hours', desc: 'Please extend library hours till midnight during exam season. Many students need to study late.' },
            { title: 'Add gym equipment', desc: 'The hostel gym needs more equipment like treadmills and dumbbells.' },
            { title: 'Improve mess menu', desc: 'Suggest adding more variety in mess menu, especially South Indian options.' },
            { title: 'Create study rooms', desc: 'Please create dedicated quiet study rooms on each floor.' },
            { title: 'Organize cultural events', desc: 'Monthly cultural events would help students destress and bond.' },
            { title: 'Better laundry service', desc: 'The current laundry service is slow. Please add more machines.' },
            { title: 'Install water coolers', desc: 'Please install water coolers on each floor. RO water is available only on ground floor.' },
            { title: 'Add recreational room', desc: 'A common room with TV, carrom, and table tennis would be great.' }
        ];

        const statuses = ['pending', 'in-progress', 'resolved'];
        const priorities = ['low', 'medium', 'high'];

        let complaintsCreated = 0;
        let suggestionsCreated = 0;
        let messoffCreated = 0;
        let invoicesCreated = 0;
        let attendanceCreated = 0;

        // Helper to get random item
        const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const randomDate = (daysAgo) => new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

        // ================== ABC ENGINEERING DATA ==================
        console.log('📝 Adding data for ABC Engineering College...');

        for (const student of abcStudents) {
            const hostelId = student.hostel || abcHostel._id;

            // Add Complaints (2-3 per student)
            const numComplaints = Math.floor(Math.random() * 2) + 2;
            for (let i = 0; i < numComplaints; i++) {
                const complaint = random(complaintTypes);
                await Complaint.create({
                    organizationId: abcOrg._id,
                    hostel: hostelId,
                    student: student._id,
                    studentName: student.name,
                    studentEmail: student.email,
                    room_no: student.room_no,
                    type: complaint.type,
                    title: complaint.title,
                    description: complaint.desc,
                    status: random(statuses),
                    priority: random(priorities),
                    createdAt: randomDate(Math.floor(Math.random() * 30)),
                    updatedAt: new Date()
                });
                complaintsCreated++;
            }

            // Add Suggestions (1-2 per student)
            const numSuggestions = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < numSuggestions; i++) {
                const suggestion = random(suggestionTypes);
                await Suggestion.create({
                    organizationId: abcOrg._id,
                    hostel: hostelId,
                    student: student._id,
                    studentName: student.name,
                    title: suggestion.title,
                    description: suggestion.desc,
                    status: random(['pending', 'reviewed', 'implemented']),
                    upvotes: Math.floor(Math.random() * 20),
                    createdAt: randomDate(Math.floor(Math.random() * 60)),
                    updatedAt: new Date()
                });
                suggestionsCreated++;
            }

            // Add Mess-off Request (50% chance)
            if (Math.random() > 0.5) {
                const startDate = randomDate(Math.floor(Math.random() * 10));
                const endDate = new Date(startDate.getTime() + (Math.floor(Math.random() * 5) + 1) * 24 * 60 * 60 * 1000);
                await MessOff.create({
                    organizationId: abcOrg._id,
                    hostel: hostelId,
                    student: student._id,
                    studentName: student.name,
                    cms_id: student.cms_id,
                    room_no: student.room_no,
                    startDate: startDate,
                    endDate: endDate,
                    reason: random(['Going home for vacation', 'Family function', 'Medical leave', 'Festival celebration']),
                    status: random(['pending', 'approved', 'rejected']),
                    createdAt: randomDate(15),
                    updatedAt: new Date()
                });
                messoffCreated++;
            }

            // Add Invoice
            await Invoice.create({
                organizationId: abcOrg._id,
                hostel: hostelId,
                student: student._id,
                studentName: student.name,
                cms_id: student.cms_id,
                type: random(['hostel_fee', 'mess_fee', 'maintenance']),
                amount: Math.floor(Math.random() * 10000) + 5000,
                dueDate: randomDate(-30), // 30 days from now
                status: random(['pending', 'paid', 'overdue']),
                description: 'Semester fee for Jan-Jun 2026',
                createdAt: randomDate(45),
                updatedAt: new Date()
            });
            invoicesCreated++;

            // Add Attendance (last 7 days)
            for (let d = 0; d < 7; d++) {
                await Attendance.create({
                    organizationId: abcOrg._id,
                    hostel: hostelId,
                    student: student._id,
                    studentName: student.name,
                    cms_id: student.cms_id,
                    date: randomDate(d),
                    status: Math.random() > 0.15 ? 'present' : 'absent',
                    checkInTime: '08:30',
                    checkOutTime: Math.random() > 0.3 ? '21:00' : null,
                    createdAt: randomDate(d)
                });
                attendanceCreated++;
            }
        }

        console.log('✅ ABC Engineering data added!\n');

        // ================== MARWADI UNIVERSITY DATA ==================
        console.log('📝 Adding data for Marwadi University...');

        for (const student of muStudents) {
            const hostelId = student.hostel || muHostel._id;

            // Add Complaints
            const numComplaints = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < numComplaints; i++) {
                const complaint = random(complaintTypes);
                await Complaint.create({
                    organizationId: muOrg._id,
                    hostel: hostelId,
                    student: student._id,
                    studentName: student.name,
                    studentEmail: student.email,
                    room_no: student.room_no,
                    type: complaint.type,
                    title: complaint.title,
                    description: complaint.desc,
                    status: random(statuses),
                    priority: random(priorities),
                    createdAt: randomDate(Math.floor(Math.random() * 30)),
                    updatedAt: new Date()
                });
                complaintsCreated++;
            }

            // Add Suggestions
            if (Math.random() > 0.3) {
                const suggestion = random(suggestionTypes);
                await Suggestion.create({
                    organizationId: muOrg._id,
                    hostel: hostelId,
                    student: student._id,
                    studentName: student.name,
                    title: suggestion.title,
                    description: suggestion.desc,
                    status: random(['pending', 'reviewed', 'implemented']),
                    upvotes: Math.floor(Math.random() * 15),
                    createdAt: randomDate(Math.floor(Math.random() * 45)),
                    updatedAt: new Date()
                });
                suggestionsCreated++;
            }

            // Add Mess-off Request
            if (Math.random() > 0.4) {
                const startDate = randomDate(Math.floor(Math.random() * 7));
                const endDate = new Date(startDate.getTime() + (Math.floor(Math.random() * 4) + 1) * 24 * 60 * 60 * 1000);
                await MessOff.create({
                    organizationId: muOrg._id,
                    hostel: hostelId,
                    student: student._id,
                    studentName: student.name,
                    cms_id: student.cms_id,
                    room_no: student.room_no,
                    startDate: startDate,
                    endDate: endDate,
                    reason: random(['Weekend trip', 'Family visit', 'Medical appointment', 'Personal work']),
                    status: random(['pending', 'approved']),
                    createdAt: randomDate(10),
                    updatedAt: new Date()
                });
                messoffCreated++;
            }

            // Add Invoice
            await Invoice.create({
                organizationId: muOrg._id,
                hostel: hostelId,
                student: student._id,
                studentName: student.name,
                cms_id: student.cms_id,
                type: random(['hostel_fee', 'mess_fee']),
                amount: Math.floor(Math.random() * 8000) + 4000,
                dueDate: randomDate(-20),
                status: random(['pending', 'paid']),
                description: 'Monthly hostel charges - January 2026',
                createdAt: randomDate(30),
                updatedAt: new Date()
            });
            invoicesCreated++;

            // Add Attendance
            for (let d = 0; d < 7; d++) {
                await Attendance.create({
                    organizationId: muOrg._id,
                    hostel: hostelId,
                    student: student._id,
                    studentName: student.name,
                    cms_id: student.cms_id,
                    date: randomDate(d),
                    status: Math.random() > 0.1 ? 'present' : 'absent',
                    checkInTime: '09:00',
                    checkOutTime: Math.random() > 0.25 ? '20:30' : null,
                    createdAt: randomDate(d)
                });
                attendanceCreated++;
            }
        }

        console.log('✅ Marwadi University data added!\n');

        // Summary
        console.log('═══════════════════════════════════════');
        console.log('          📊 SEEDING SUMMARY           ');
        console.log('═══════════════════════════════════════');
        console.log(`   Complaints:    ${complaintsCreated} created`);
        console.log(`   Suggestions:   ${suggestionsCreated} created`);
        console.log(`   Mess-off:      ${messoffCreated} created`);
        console.log(`   Invoices:      ${invoicesCreated} created`);
        console.log(`   Attendance:    ${attendanceCreated} records`);
        console.log('═══════════════════════════════════════');
        console.log('\n✅ Demo data successfully added to MongoDB Atlas!');

        await conn.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

seedDemoData();
