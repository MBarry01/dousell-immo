const fs = require('fs');
const path = require('path');

const errorsFile = 'tsc_errors.txt';
if (!fs.existsSync(errorsFile)) {
    console.log("Errors file not found");
    process.exit(1);
}
const content = fs.readFileSync(errorsFile, 'utf8');
const lines = content.split(/\r?\n/);

console.log(`Read ${lines.length} lines from ${errorsFile}`);

const fixes = [];
let matchCount = 0;

lines.forEach(line => {
    // line format: app/(vitrine)/api/cache-metrics/route.ts(21,10): error TS2724: ...
    const fileMatch = line.match(/^(.+?)\((\d+),(\d+)\): error TS\d+: (.+)$/);
    if (!fileMatch) {
        // console.log("No match line:", line);
        return;
    }

    const filePath = fileMatch[1].trim();
    const lineNum = parseInt(fileMatch[2]);
    const message = fileMatch[4];

    let badName = null;
    let goodName = null;

    if (message.includes("has no exported member named '")) {
        const m = message.match(/named '(_\w+)'/);
        if (m) badName = m[1];
    } else if (message.includes("Property '")) {
        const m = message.match(/Property '(_\w+)' does not exist/);
        if (m) badName = m[1];
    } else if (message.includes("Cannot find name '")) {
        const m = message.match(/name '(_\w+)'/);
        if (m) badName = m[1];
    } else if (message.includes("Module '")) {
        const m = message.match(/member '(_\w+)'/);
        if (m) badName = m[1];
    }

    if (badName) {
        goodName = badName.substring(1);
        fixes.push({ filePath, lineNum, badName, goodName });
        matchCount++;
    }
});

console.log(`Found ${fixes.length} fixes`);

const fixesByFile = {};
fixes.forEach(fix => {
    if (!fixesByFile[fix.filePath]) fixesByFile[fix.filePath] = [];
    fixesByFile[fix.filePath].push(fix);
});

Object.keys(fixesByFile).forEach(relPath => {
    const absPath = path.resolve(relPath);
    console.log(`Processing ${relPath} -> ${absPath}`);

    if (!fs.existsSync(absPath)) {
        console.log(`  File not found: ${absPath}`);
        return;
    }

    let fileContent = fs.readFileSync(absPath, 'utf8');
    const fileLines = fileContent.split(/\r?\n/);
    let modified = false;

    // Apply specific line fixes
    fixesByFile[relPath].forEach(fix => {
        const idx = fix.lineNum - 1;
        if (idx >= 0 && idx < fileLines.length) {
            const originalLine = fileLines[idx];
            // Replace ALL occurrences of badName in the line? 
            // Or use regex with word boundary?
            // badName = _Something.
            // If regex `/_Something/g` -> `Something`.
            if (originalLine.includes(fix.badName)) {
                // Use explicit replace to avoid replacing substrings incorrectly?
                // badName always starts with _
                const newLine = originalLine.split(fix.badName).join(fix.goodName);
                if (newLine !== originalLine) {
                    fileLines[idx] = newLine;
                    modified = true;
                    // console.log(`  Fixed line ${fix.lineNum}`);
                }
            } else {
                console.log(`  WARN: Line ${fix.lineNum} does not contain ${fix.badName}: "${originalLine.trim()}"`);
            }
        }
    });

    if (modified) {
        fs.writeFileSync(absPath, fileLines.join('\n'), 'utf8');
        console.log(`  Saved ${relPath}`);
    } else {
        console.log(`  No changes needed for ${relPath}`);
    }
});
