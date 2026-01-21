const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// Color codes for terminal output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

async function testLogin(email, password, userType) {
    try {
        console.log(`\n${colors.blue}Testing ${userType}: ${email}${colors.reset}`);

        const response = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });

        if (response.data.success) {
            console.log(`${colors.green}✅ LOGIN SUCCESS!${colors.reset}`);
            console.log(`   Token: ${response.data.data.token.substring(0, 30)}...`);
            console.log(`   Role: ${response.data.data.user.role}`);
            console.log(`   Organization ID: ${response.data.data.user.organizationId || 'N/A (Super Admin)'}`);
            return true;
        } else {
            console.log(`${colors.red}❌ LOGIN FAILED${colors.reset}`);
            console.log(`   Error: ${JSON.stringify(response.data.errors)}`);
            return false;
        }
    } catch (error) {
        console.log(`${colors.red}❌ LOGIN ERROR${colors.reset}`);
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Message: ${JSON.stringify(error.response.data)}`);
        } else {
            console.log(`   Error: ${error.message}`);
        }
        return false;
    }
}

async function runTests() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║          LOGIN FUNCTIONALITY TEST                          ║');
    console.log('║          Testing all fixed credentials...                 ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    let totalTests = 0;
    let passedTests = 0;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TESTING SUPER ADMIN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    totalTests++;
    if (await testLogin('superadmin@hostelease.com', 'admin123', 'Super Admin')) {
        passedTests++;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TESTING ORGANIZATION ADMINS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const admins = [
        { email: 'admin@abc-eng.edu', org: 'ABC Engineering' },
        { email: 'admin@xyz-inst.edu', org: 'XYZ Institute' },
        { email: 'admin@pqr-uni.edu', org: 'PQR University' },
        { email: 'admin@mu.edu', org: 'Mumbai University' }
    ];

    for (const admin of admins) {
        totalTests++;
        if (await testLogin(admin.email, 'admin123', `${admin.org} Admin`)) {
            passedTests++;
        }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TESTING STUDENT ACCOUNTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Get student emails from database
    const mongoose = require('mongoose');
    require('dotenv').config();
    const Student = require('./backend/models/Student');

    try {
        await mongoose.connect(process.env.MONGO_URI);

        const students = await Student.find().limit(3).select('email name');

        for (const student of students) {
            totalTests++;
            if (await testLogin(student.email, 'student123', `Student: ${student.name}`)) {
                passedTests++;
            }
        }

        await mongoose.connection.close();
    } catch (error) {
        console.log(`${colors.yellow}⚠️  Could not fetch students from database${colors.reset}`);
        console.log('   Testing with example student email...');

        totalTests++;
        if (await testLogin('rahul.sharma10000@abc-eng.edu', 'student123', 'Sample Student')) {
            passedTests++;
        }
    }

    // Final Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║          TEST RESULTS SUMMARY                              ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`Total Tests: ${totalTests}`);
    console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
    console.log(`${colors.red}Failed: ${totalTests - passedTests}${colors.reset}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

    if (passedTests === totalTests) {
        console.log(`${colors.green}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.green}║                                                            ║${colors.reset}`);
        console.log(`${colors.green}║     ✅ ALL LOGINS WORKING PERFECTLY!                       ║${colors.reset}`);
        console.log(`${colors.green}║                                                            ║${colors.reset}`);
        console.log(`${colors.green}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);
    } else {
        console.log(`${colors.yellow}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.yellow}║                                                            ║${colors.reset}`);
        console.log(`${colors.yellow}║     ⚠️  SOME LOGINS FAILED - CHECK ERRORS ABOVE           ║${colors.reset}`);
        console.log(`${colors.yellow}║                                                            ║${colors.reset}`);
        console.log(`${colors.yellow}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);
        console.log(`${colors.yellow}Run: npm run fix-logins (in backend folder)${colors.reset}\n`);
    }

    process.exit(0);
}

// Wait a bit for backend to be ready
console.log('Waiting for backend server to be ready...');
setTimeout(() => {
    runTests();
}, 2000);
