const fs = require('fs');
const path = require('path');

const lintJsonPath = path.join(__dirname, 'lint_errors_v6.json');
const data = JSON.parse(fs.readFileSync(lintJsonPath, 'utf8'));

const ruleCounts = {};
let totalErrors = 0;

data.forEach(result => {
    result.messages.forEach(msg => {
        const ruleId = msg.ruleId || 'unknown';
        ruleCounts[ruleId] = (ruleCounts[ruleId] || 0) + 1;
        totalErrors++;
    });
});

console.log(`Total Errors: ${totalErrors}`);
console.log('Rule Counts:');
Object.entries(ruleCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([rule, count]) => {
        console.log(`${rule}: ${count}`);
    });
