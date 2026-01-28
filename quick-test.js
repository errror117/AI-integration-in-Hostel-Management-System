// Test login endpoint directly
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testSuperAdminLogin() {
    try {
        console.log('Testing Super Admin login...');
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: 'superadmin@hostelease.com',
            password: 'SuperAdmin@123'
        });

        console.log('✅ SUCCESS!');
        console.log('Token:', response.data.data.token.substring(0, 30) + '...');
        console.log('Role:', response.data.data.user.role);
    } catch (error) {
        console.log('❌ FAILED');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
    }
}

async function testAdminLogin() {
    try {
        console.log('\nTesting Admin login...');
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@abc-eng.edu',
            password: 'admin123'
        });

        console.log('✅ SUCCESS!');
        console.log('Token:', response.data.data.token.substring(0, 30) + '...');
        console.log('Role:', response.data.data.user.role);
    } catch (error) {
        console.log('❌ FAILED');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
    }
}

async function runTests() {
    await testSuperAdminLogin();
    await testAdminLogin();
}

runTests();
