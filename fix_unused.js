const fs = require('fs');
const path = require('path');

const lintJsonPath = path.join(__dirname, 'lint_errors_v2.json');
const data = JSON.parse(fs.readFileSync(lintJsonPath, 'utf8'));

const fileFixes = {};

data.forEach(fileResult => {
    const filePath = fileResult.filePath;
    const errors = fileResult.messages.filter(m => m.ruleId === '@typescript-eslint/no-unused-vars');

    if (errors.length > 0) {
        if (!fileFixes[filePath]) fileFixes[filePath] = [];
        fileFixes[filePath].push(...errors);
    }
});

Object.keys(fileFixes).forEach(filePath => {
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let lines = content.split('\n');

    // Sort errors for this file in descending order (line and then column)
    const errors = fileFixes[filePath].sort((a, b) => {
        if (a.line !== b.line) return b.line - a.line;
        return b.column - a.column;
    });

    errors.forEach(error => {
        const lineIdx = error.line - 1;
        const colIdx = error.column - 1;
        const line = lines[lineIdx];

        if (!line) return;

        // Match the variable name from the message: "'varName' is defined but never used."
        const match = error.message.match(/'([^']+)'/);
        if (!match) return;

        const varName = match[1];

        // Find the variable in the line at or near colIdx
        const textAtCol = line.substring(colIdx);
        if (textAtCol.startsWith(varName)) {
            const newLine = line.substring(0, colIdx) + '_' + line.substring(colIdx);
            lines[lineIdx] = newLine;
        } else {
            // Some variables might be slightly off in column or inside a destructive assignment
            // We search for the first occurrence of varName after colIdx-5
            const searchStart = Math.max(0, colIdx - 2);
            const relativeIdx = line.substring(searchStart).indexOf(varName);
            if (relativeIdx !== -1) {
                const absoluteIdx = searchStart + relativeIdx;
                const newLine = line.substring(0, absoluteIdx) + '_' + line.substring(absoluteIdx);
                lines[lineIdx] = newLine;
            } else {
                console.warn(`Could not find "${varName}" at ${filePath}:${error.line}:${error.column}`);
            }
        }
    });

    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log(`Prefixed ${errors.length} variables in ${filePath}`);
});
