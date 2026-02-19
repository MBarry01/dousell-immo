const fs = require('fs');
const path = require('path');

const lintJsonPath = path.join(__dirname, 'lint_errors.json');
const data = JSON.parse(fs.readFileSync(lintJsonPath, 'utf8'));

const entitiesMap = {
    "'": "&apos;",
    '"': "&quot;",
    '>': "&gt;",
    '}': "&#125;"
};

const fileFixes = {};

data.forEach(fileResult => {
    const filePath = fileResult.filePath;
    const errors = fileResult.messages.filter(m => m.ruleId === 'react/no-unescaped-entities');

    if (errors.length > 0) {
        if (!fileFixes[filePath]) fileFixes[filePath] = [];
        fileFixes[filePath].push(...errors);
    }
});

Object.keys(fileFixes).forEach(filePath => {
    if (!fs.existsSync(filePath)) return;

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Sort errors for this file in descending order (line and then column)
    // to avoid index shifting problems.
    const errors = fileFixes[filePath].sort((a, b) => {
        if (a.line !== b.line) return b.line - a.line;
        return b.column - a.column;
    });

    errors.forEach(error => {
        const lineIdx = error.line - 1;
        const colIdx = error.column - 1;
        const line = lines[lineIdx];

        if (!line) return;

        const charToReplace = line[colIdx];
        const replacement = entitiesMap[charToReplace];

        if (replacement) {
            const newLine = line.substring(0, colIdx) + replacement + line.substring(colIdx + 1);
            lines[lineIdx] = newLine;
        } else {
            console.warn(`No replacement for char "${charToReplace}" at ${filePath}:${error.line}:${error.column}`);
        }
    });

    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log(`Fixed ${errors.length} entities in ${filePath}`);
});
