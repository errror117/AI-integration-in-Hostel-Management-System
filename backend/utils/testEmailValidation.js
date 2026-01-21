const { check, validationResult } = require('express-validator');

// Test email validation
const testEmail = 'kunal.pillai20000@mu.edu';

// Simulate express-validator's isEmail check
const validator = require('validator');

console.log('Testing email validation:');
console.log(`Email: ${testEmail}`);
console.log(`Is valid email (validator): ${validator.isEmail(testEmail)}`);

// More test cases
const emails = [
    'kunal.pillai20000@mu.edu',
    'admin@mu.edu',
    'test@test.com',
    'user123@domain.com',
    'firstname.lastname12345@example.edu'
];

console.log('\nTesting multiple emails:');
emails.forEach(email => {
    console.log(`${email}: ${validator.isEmail(email) ? '✅' : '❌'}`);
});
