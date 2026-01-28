// Quick check - get exact student email
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function checkEmail() {
    try {
        // Use a new connection
        const conn = await mongoose.createConnection(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 3000
        });

        const Student = conn.model('Student', require('./backend/models/Student').schema);

        // Find Rahul Sharma
        const rahul = await Student.findOne({ name: /rahul sharma/i }).maxTimeMS(3000);

        if (rahul) {
            console.log('✅ Found Rahul Sharma:');
            console.log('   Email:', rahul.email);
            console.log('   CMS ID:', rahul.cms_id);
            console.log('   Password: student123');
        } else {
            console.log('❌ Rahul Sharma not found');
        }

        await conn.close();
        process.exit(0);
    } catch (error) {
        console.log('⚠️  Quick check failed, please refresh All Students page to see emails');
        process.exit(1);
    }
}

checkEmail();
