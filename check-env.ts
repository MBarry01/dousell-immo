import * as fs from 'fs';

const content = fs.readFileSync('.env.local', 'utf-8');
const lines = content.split(/\r?\n/);

console.log("Line 2 (URL):", JSON.stringify(lines[1]));
console.log("Line 3 (ANON):", JSON.stringify(lines[2]));
console.log("Line 12 (SERVICE):", JSON.stringify(lines[11]));
