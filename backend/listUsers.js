const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function listAllUsers() {
    try {
        await client.connect();
        console.log('\n✅ Connected to MongoDB\n');

        const database = client.db('hosteldb');
        const users = database.collection('users');

        const allUsers = await users.find({}).project({
            email: 1,
            role: 1,
            isActive: 1,
            isAdmin: 1,
            _id: 0
        }).toArray();

        console.log('═'.repeat(70));
        console.log('                  ALL USERS IN DATABASE');
        console.log('═'.repeat(70));
        console.log(`Total Users: ${allUsers.length}\n`);

        // Group by type
        const students = allUsers.filter(u => u.role === 'student');
        const admins = allUsers.filter(u => u.isAdmin === true);
        const orgs = allUsers.filter(u => u.role === 'organization');

        if (students.length > 0) {
            console.log('👨‍🎓 STUDENTS');
            console.log('─'.repeat(70));
            students.forEach((user, i) => {
                console.log(`${i + 1}. Email: ${user.email}`);
                console.log(`   Password: student123`);
                console.log(`   Active: ${user.isActive}`);
                console.log('');
            });
        }

        if (admins.length > 0) {
            console.log('👔 ADMINS');
            console.log('─'.repeat(70));
            admins.forEach((user, i) => {
                console.log(`${i + 1}. Email: ${user.email}`);
                console.log(`   Password: admin123`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Active: ${user.isActive}`);
                console.log('');
            });
        }

        if (orgs.length > 0) {
            console.log('🏢 ORGANIZATIONS');
            console.log('─'.repeat(70));
            orgs.forEach((user, i) => {
                console.log(`${i + 1}. Email: ${user.email}`);
                console.log(`   Password: org123`);
                console.log(`   Active: ${user.isActive}`);
                console.log('');
            });
        }

        console.log('═'.repeat(70));
        console.log('NOTE: If any login fails, let me know and I will reset/create new accounts');
        console.log('═'.repeat(70));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
    }
}

listAllUsers();
