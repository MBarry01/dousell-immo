const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

// Files that still need fixing (identified by verification)
const targetDirs = ['lib', 'scripts', 'app'];
const extensions = ['.ts', '.tsx', '.js', '.jsx'];
const excludeDirs = ['node_modules', '.next', '.git'];

const replacements = [
    ['https://dousel.com', 'https://dousel.com'],
    ['https://dousel.com', 'https://dousel.com'],
    ['https://dousel.com', 'https://dousel.com'],
    ['https://dousel.com', 'https://dousel.com'],
    ['https://app.dousel.com', 'https://app.dousel.com'],
    ['contact@dousel.com', 'contact@dousel.com'],
    ['contact@dousel.com', 'contact@dousel.com'],
    ["https://dousel.com'", "https://dousel.com'"],
    ['Dousel', 'Dousel'],
    ['Dousel', 'Dousel'],
];

function walk(dir) {
    let results = [];
    try {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!excludeDirs.includes(entry.name)) results = results.concat(walk(full));
            } else if (extensions.includes(path.extname(entry.name))) {
                results.push(full);
            }
        }
    } catch (e) { }
    return results;
}

let allFiles = [];
for (const d of targetDirs) {
    allFiles = allFiles.concat(walk(path.join(root, d)));
}

let changed = 0;
for (const file of allFiles) {
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
