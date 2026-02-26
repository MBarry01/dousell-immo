const fs = require('fs');
const path = require('path');

const root = __dirname.replace(/\\scripts$/, '');
const extensions = ['.ts', '.tsx', '.js', '.jsx'];
const excludeDirs = ['node_modules', '.next', '.git', 'scripts'];

const replacements = [
    ['https://dousel.com', 'https://dousel.com'],
    ['https://dousel.com', 'https://dousel.com'],
    ['https://dousel.com', 'https://dousel.com'],
    ['https://dousel.com', 'https://dousel.com'],
    ['https://app.dousel.com', 'https://app.dousel.com'],
    ['contact@dousel.com', 'contact@dousel.com'],
    ['contact@dousel.com', 'contact@dousel.com'],
    ['Dousel', 'Dousel'],
    ['Dousel', 'Dousel'],
];

function walk(dir) {
    let results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (!excludeDirs.includes(entry.name)) results = results.concat(walk(full));
        } else if (extensions.includes(path.extname(entry.name))) {
            results.push(full);
        }
    }
    return results;
}

const files = walk(root);
let changed = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;
    for (const [old, nw] of replacements) {
        content = content.split(old).join(nw);
    }
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('CHANGED:', path.relative(root, file));
        changed++;
    }
}

console.log(`\n--- TOTAL: ${changed} files changed ---`);
