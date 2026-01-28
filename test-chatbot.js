// Test chatbot endpoint
const axios = require('axios');

async function testChatbot() {
    const SuperAdminAPI = 'http://localhost:3000/api';

    // Test 1: Without authentication (public query)
    console.log('Test 1: Chatbot WITHOUT authentication');
    try {
        const response = await axios.post(`${API}/chatbot/message`, {
            query: 'Hello',
            role: 'student'
        });
        console.log('✅ SUCCESS (no auth)');
        console.log('Reply:', response.data.reply.substring(0, 60) + '...');
    } catch (error) {
        console.log(' FAILED (no auth)');
        console.log('Error:', error.response?.data || error.message);
    }

    // Test 2: With student token
    console.log('\nTest 2: Chatbot WITH student authentication');
    try {
        // First login
        const loginRes = await axios.post(`${API}/auth/login`, {
            email: 'admin@abc-eng.edu',
            password: 'admin123'
        });
        const token = loginRes.data.data.token;

        // Then chatbot
        const chatRes = await axios.post(`${API}/chatbot/message`, {
            query: 'Give me a summary',
            role: 'admin'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('✅ SUCCESS (with auth)');
        console.log('Reply:', chatRes.data.reply.substring(0, 80) + '...');
        console.log('Intent:', chatRes.data.intent);
    } catch (error) {
        console.log('❌ FAILED (with auth)');
        console.log('Error:', error.response?.data || error.message);
    }
}

testChatbot();
