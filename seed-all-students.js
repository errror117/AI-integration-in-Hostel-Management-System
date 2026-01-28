// Full Demo Data Seeder - ALL Students in ABC Engineering & Marwadi University
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function seedAllStudentsData() {
    try {
        console.log('🚀 Connecting to MongoDB Atlas...');
        const conn = await mongoose.createConnection(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 60000
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

        if (!abcOrg || !muOrg) {
            console.log('❌ Organizations not found!');
            process.exit(1);
        }

        console.log(`📍 ABC Engineering: ${abcOrg._id}`);
        console.log(`📍 Marwadi University: ${muOrg._id}\n`);

        // Get hostels
        let abcHostel = await Hostel.findOne({ organizationId: abcOrg._id }).lean();
        let muHostel = await Hostel.findOne({ organizationId: muOrg._id }).lean();

        // Get ALL students from both orgs
        const abcStudents = await Student.find({ organizationId: abcOrg._id }).lean();
        const muStudents = await Student.find({ organizationId: muOrg._id }).lean();

        console.log(`👥 ABC Engineering: ${abcStudents.length} students`);
        console.log(`👥 Marwadi University: ${muStudents.length} students\n`);

        // Complaint categories
        const complaintTypes = [
            { type: 'electrical', title: 'Fan not working', desc: 'The ceiling fan in my room is not working properly.' },
            { type: 'electrical', title: 'Tube light flickering', desc: 'The tube light in my room keeps flickering.' },
            { type: 'electrical', title: 'AC not cooling', desc: 'The AC is not cooling despite running for hours.' },
            { type: 'electrical', title: 'Power socket not working', desc: 'One of the power sockets in my room is dead.' },
            { type: 'plumbing', title: 'Water leakage', desc: 'There is water leakage from the bathroom tap.' },
            { type: 'plumbing', title: 'Clogged drain', desc: 'The bathroom drain is completely clogged.' },
            { type: 'plumbing', title: 'Low water pressure', desc: 'Very low water pressure in the bathroom.' },
            { type: 'plumbing', title: 'Geyser not working', desc: 'The hot water geyser is not heating water.' },
            { type: 'internet', title: 'WiFi connectivity issues', desc: 'WiFi signal is very weak in my room.' },
            { type: 'internet', title: 'Internet speed slow', desc: 'Internet speed is extremely slow for online classes.' },
            { type: 'furniture', title: 'Broken study chair', desc: 'My study chair is broken and needs replacement.' },
            { type: 'furniture', title: 'Mattress damaged', desc: 'The mattress is old and has springs poking out.' },
            { type: 'furniture', title: 'Cupboard door broken', desc: 'The cupboard door hinge is broken.' },
            { type: 'mess', title: 'Food quality issue', desc: 'The food quality has deteriorated recently.' },
            { type: 'mess', title: 'Unhygienic kitchen', desc: 'Found insects in the mess hall.' },
            { type: 'cleaning', title: 'Room not cleaned', desc: 'Room has not been cleaned for 3 days.' },
            { type: 'security', title: 'Door lock problem', desc: 'The room door lock is not working properly.' },
            { type: 'maintenance', title: 'Window broken', desc: 'Window glass is cracked.' }
        ];

        const suggestionTypes = [
            { title: 'Extend library hours', desc: 'Please extend library till midnight during exams.' },
            { title: 'Add gym equipment', desc: 'Need more treadmills and weights in gym.' },
            { title: 'Improve mess menu', desc: 'Add more variety especially continental.' },
            { title: 'Create study rooms', desc: 'Dedicated quiet study rooms on each floor.' },
            { title: 'Cultural events', desc: 'Monthly cultural events for students.' },
            { title: 'Better laundry', desc: 'Add more washing machines.' },
            { title: 'Water coolers', desc: 'Install water coolers on each floor.' },
            { title: 'Recreation room', desc: 'Common room with TV and games.' },
            { title: 'Faster WiFi', desc: 'Upgrade internet speed to fiber.' },
            { title: 'More parking', desc: 'Need more bike parking space.' }
        ];

        const messOffReasons = [
            'Going home for vacation', 'Family function', 'Medical leave',
            'Festival celebration', 'Weekend trip', 'Family visit',
            'Medical appointment', 'Personal work', 'Wedding ceremony',
            'Religious function'
        ];

        const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const randomDate = (daysAgo) => new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        const statuses = ['pending', 'in-progress', 'resolved'];
        const priorities = ['low', 'medium', 'high'];

        let stats = {
            complaints: 0,
            suggestions: 0,
            messoff: 0,
            invoices: 0,
            attendance: 0
        };

        // Process each organization
        async function processStudents(students, org, hostel, orgName) {
            console.log(`\n📝 Processing ${orgName}...`);
            let processed = 0;

            for (const student of students) {
                const hostelId = student.hostel || hostel?._id;

                // 60% chance of having a complaint (1-2 per student)
                if (Math.random() < 0.6) {
                    const numComplaints = Math.random() < 0.4 ? 2 : 1;
                    for (let i = 0; i < numComplaints; i++) {
                        const complaint = random(complaintTypes);
                        await Complaint.create({
                            organizationId: org._id,
                            hostel: hostelId,
                            student: student._id,
                            studentName: student.name,
                            studentEmail: student.email,
                            room_no: student.room_no || Math.floor(Math.random() * 400) + 100,
                            type: complaint.type,
                            title: complaint.title,
                            description: complaint.desc,
                            status: random(statuses),
                            priority: random(priorities),
                            createdAt: randomDate(Math.floor(Math.random() * 60)),
                            updatedAt: new Date()
                        });
                        stats.complaints++;
                    }
                }

                // 30% chance of suggestion
                if (Math.random() < 0.3) {
                    const suggestion = random(suggestionTypes);
                    await Suggestion.create({
                        organizationId: org._id,
                        hostel: hostelId,
                        student: student._id,
                        studentName: student.name,
                        title: suggestion.title,
                        description: suggestion.desc,
                        status: random(['pending', 'reviewed', 'implemented']),
                        upvotes: Math.floor(Math.random() * 25),
                        createdAt: randomDate(Math.floor(Math.random() * 90)),
                        updatedAt: new Date()
                    });
                    stats.suggestions++;
                }

                // 25% chance of mess-off request
                if (Math.random() < 0.25) {
                    const startDate = randomDate(Math.floor(Math.random() * 20));
                    const duration = Math.floor(Math.random() * 7) + 1;
                    const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);
                    await MessOff.create({
                        organizationId: org._id,
                        hostel: hostelId,
                        student: student._id,
                        studentName: student.name,
                        cms_id: student.cms_id,
                        room_no: student.room_no || Math.floor(Math.random() * 400) + 100,
                        startDate: startDate,
                        endDate: endDate,
                        reason: random(messOffReasons),
                        status: random(['pending', 'approved', 'rejected']),
                        createdAt: randomDate(25),
                        updatedAt: new Date()
                    });
                    stats.messoff++;
                }

                // Every student gets an invoice
                await Invoice.create({
                    organizationId: org._id,
                    hostel: hostelId,
                    student: student._id,
                    studentName: student.name,
                    cms_id: student.cms_id,
                    type: random(['hostel_fee', 'mess_fee', 'maintenance', 'electricity']),
                    amount: Math.floor(Math.random() * 15000) + 3000,
                    dueDate: randomDate(-Math.floor(Math.random() * 30)),
                    status: random(['pending', 'paid', 'overdue', 'paid']),
                    description: `Charges for ${random(['January', 'February', 'March'])} 2026`,
                    createdAt: randomDate(60),
                    updatedAt: new Date()
                });
                stats.invoices++;

                // Attendance - last 5 days only (to keep data size manageable)
                for (let d = 0; d < 5; d++) {
                    await Attendance.create({
                        organizationId: org._id,
                        hostel: hostelId,
                        student: student._id,
                        studentName: student.name,
                        cms_id: student.cms_id,
                        date: randomDate(d),
                        status: Math.random() > 0.12 ? 'present' : 'absent',
                        checkInTime: `0${7 + Math.floor(Math.random() * 3)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
                        checkOutTime: Math.random() > 0.2 ? `${20 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : null,
                        createdAt: randomDate(d)
                    });
                    stats.attendance++;
                }

                processed++;
                if (processed % 50 === 0) {
                    console.log(`   Processed ${processed}/${students.length} students...`);
                }
            }
            console.log(`   ✅ Completed ${processed} students for ${orgName}`);
        }

        // Process ABC Engineering
        await processStudents(abcStudents, abcOrg, abcHostel, 'ABC Engineering College');

        // Process Marwadi University  
        await processStudents(muStudents, muOrg, muHostel, 'Marwadi University');

        // Summary
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('              📊 FULL SEEDING SUMMARY                  ');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`   ABC Students:     ${abcStudents.length}`);
        console.log(`   MU Students:      ${muStudents.length}`);
        console.log(`   Total Students:   ${abcStudents.length + muStudents.length}`);
        console.log('───────────────────────────────────────────────────────');
        console.log(`   Complaints:       ${stats.complaints} created`);
        console.log(`   Suggestions:      ${stats.suggestions} created`);
        console.log(`   Mess-off:         ${stats.messoff} created`);
        console.log(`   Invoices:         ${stats.invoices} created`);
        console.log(`   Attendance:       ${stats.attendance} records`);
        console.log('═══════════════════════════════════════════════════════');
        console.log('\n✅ ALL demo data successfully added to MongoDB Atlas!');

        await conn.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

seedAllStudentsData();
