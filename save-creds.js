// Save credentials to a file
const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config({ path: './backend/.env' });

async function saveCredentials() {
    try {
        const conn = await mongoose.createConnection(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 20000
        });

        const UserSchema = new mongoose.Schema({}, { strict: false });
        const OrgSchema = new mongoose.Schema({}, { strict: false });
        const StudentSchema = new mongoose.Schema({}, { strict: false });
        const AdminSchema = new mongoose.Schema({}, { strict: false });

        const User = conn.model('User', UserSchema, 'users');
        const Organization = conn.model('Organization', OrgSchema, 'organizations');
        const Student = conn.model('Student', StudentSchema, 'students');
        const Admin = conn.model('Admin', AdminSchema, 'admins');

        const orgs = await Organization.find({}).lean();
        const users = await User.find({}).lean();
        const students = await Student.find({}).lean();
        const admins = await Admin.find({}).lean();

        let output = '# ALL LOGIN CREDENTIALS\n\n';
        output += `Generated: ${new Date().toISOString()}\n\n`;
        output += '---\n\n';

        // Organizations
        output += '## ORGANIZATIONS\n\n';
        for (const org of orgs) {
            output += `### ${org.name}\n`;
            output += `- ID: ${org._id}\n`;
            output += `- Status: ${org.isActive ? '✅ Active' : '❌ Inactive'}\n`;
            output += `- Subscription: ${org.subscription?.status || 'Unknown'}\n\n`;
        }

        output += '---\n\n';
        output += '## ALL USERS (Login Credentials)\n\n';
        output += '| Email | Role | Organization | Password |\n';
        output += '|-------|------|--------------|----------|\n';

        for (const user of users) {
            const orgName = orgs.find(o => o._id.toString() === user.organizationId?.toString())?.name || 'Global';
            const password = user.role === 'super_admin' ? 'SuperAdmin@123' : (user.isAdmin ? 'admin123' : 'student123');
            output += `| ${user.email} | ${user.role} | ${orgName} | ${password} |\n`;
        }

        output += '\n---\n\n';
        output += '## STUDENTS (Detail)\n\n';

        for (const student of students) {
            const orgName = orgs.find(o => o._id.toString() === student.organizationId?.toString())?.name || 'Unknown';
            output += `**${student.name}** (${orgName})\n`;
            output += `- Email: \`${student.email}\`\n`;
            output += `- CMS: ${student.cms_id}\n`;
            output += `- Password: \`student123\`\n\n`;
        }

        output += '---\n\n';
        output += '## ADMINS (Detail)\n\n';

        for (const admin of admins) {
            const orgName = orgs.find(o => o._id.toString() === admin.organizationId?.toString())?.name || 'Unknown';
            output += `**${admin.name}** (${orgName})\n`;
            output += `- Email: \`${admin.email}\`\n`;
            output += `- Password: \`admin123\`\n\n`;
        }

        // Save to file
        fs.writeFileSync('ALL_CREDENTIALS.md', output);
        console.log('✅ Saved to ALL_CREDENTIALS.md');

        await conn.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

saveCredentials();
