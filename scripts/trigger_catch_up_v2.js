
const https = require('http');
require('dotenv').config({ path: '.env.local' });

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/catch-up-ged',
    method: 'POST',
    headers: {
        'x-admin-secret': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json'
    }
};

console.log("Triggering catch-up API...");

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log("Response status:", res.statusCode);
        console.log("Response data:", data);
    });
});

req.on('error', (e) => {
    console.error("Error triggering API:", e.message);
});

req.end();
