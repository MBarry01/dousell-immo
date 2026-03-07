const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
const projectId = process.env.POSTHOG_PROJECT_ID;
let out = '';

async function test(host) {
    const query = "SELECT count() FROM events";
    out += 'Testing ' + host + '\n';
    try {
        const res = await fetch(`${host}/api/projects/${projectId}/query/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
            signal: AbortSignal.timeout(5000)
        });
        out += host + ' Status: ' + res.status + '\n';
        const json = await res.json();
        out += host + ' Data: ' + JSON.stringify(json).substring(0, 150) + '\n';
    } catch (e) {
        out += host + ' Error: ' + e.message + '\n';
    }
}
async function run() {
    await test('https://us.posthog.com');
    await test('https://eu.posthog.com');
    fs.writeFileSync('test-out-utf8.txt', out, 'utf8');
}
run();
