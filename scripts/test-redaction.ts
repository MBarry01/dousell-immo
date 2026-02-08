import { logger } from '../lib/logger';

console.log('--- START REDACTION TEST ---');

// Test 1: Simple object with sensitive fields
logger.info({
    msg: "User login attempt",
    email: "john.doe@example.com",
    password: "supersecretpassword123",
    userId: "user_123"
}, "Login attempt");

// Test 2: Nested object
logger.info({
    user: {
        name: "John Doe",
        email: "john.doe@example.com",
        details: {
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
        }
    }
}, "User details fetch");

// Test 3: Array of objects
logger.info({
    users: [
        { email: "user1@test.com", password: "pwd" },
        { email: "user2@test.com", password: "pwd" }
    ]
}, "Bulk user process");

console.log('--- END REDACTION TEST ---');
console.log('Check the output above. You should see [REDACTED] instead of emails and passwords.');
