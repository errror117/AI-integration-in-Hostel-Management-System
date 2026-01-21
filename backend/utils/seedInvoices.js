/**
 * Invoice Seeder - Production Ready
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Invoice = require('../models/Invoice');
const Student = require('../models/Student');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected\n');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

async function seedInvoices() {
    try {
        console.log('💰 INVOICE SEEDER\n');

        await Invoice.deleteMany({});

        const students = await Student.find();
        console.log(`Creating invoices for ${students.length} students...\n`);

        const months = ['July 2025', 'August 2025', 'September 2025', 'October 2025', 'November 2025', 'December 2025'];
        let total = 0, paid = 0, pending = 0;

        for (const student of students) {
            const numInvoices = 4 + Math.floor(Math.random() * 3);

            for (let i = 0; i < numInvoices; i++) {
                const month = months[i % months.length];
                const amount = 5000 + Math.floor(Math.random() * 2000);
                const isPaid = i < numInvoices - 2;

                await Invoice.create({
                    student: student._id,
                    title: `${month} - Hostel Fees`,
                    amount: amount,
                    status: isPaid ? 'paid' : 'pending',
                    date: new Date(2025, 6 + i, Math.floor(Math.random() * 5) + 1)
                });

                total++;
                if (isPaid) paid++; else pending++;
            }
            console.log(`   ✅ ${student.name} - ${numInvoices} invoices`);
        }

        console.log('\n═══════════════════════════════════════');
        console.log(`📄 Total: ${total} | ✅ Paid: ${paid} | ⚠️ Pending: ${pending}`);
        console.log('═══════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

connectDB().then(seedInvoices);
