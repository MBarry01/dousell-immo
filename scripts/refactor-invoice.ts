import * as fs from 'fs';
import * as path from 'path';

const invoicePath = path.join(process.cwd(), 'lib', 'invoice.ts');
let content = fs.readFileSync(invoicePath, 'utf8');

// 1. Add Import if not present
if (!content.includes('import { logoBase64 } from "./logo";')) {
    content = 'import { logoBase64 } from "./logo";\n' + content;
}

// 2. Remove the massive inline definition
// We look for: const logoBase64 = "..."
// And replace it with a comment or nothing, relying on the import.
// However, the import is at the top scope, but the variable was defined inside the function.
// So we need to remove the 'const logoBase64 = ...' line entirely so it uses the top-level import.
// OR, we can just rename the local variable if we want to be safe, but using the import is better.

// Regex to match: const logoBase64 = ".*";
// Since the string is huge, we should be careful. It ends with ";
// We can match `const logoBase64 = "` until `";`
const regex = /const logoBase64 = "[^"]+";/;
if (regex.test(content)) {
    content = content.replace(regex, '// Used imported logoBase64');
    console.log('Replaced inline logoBase64 definition.');
} else {
    // Fallback: maybe it was injected differently or I can't match it easily with regex due to size/chars.
    // Let's try to find the start and end markers I used before.
    const startMarker = '// Embed Base64 Logo directly to avoid file path issues in production/serverless';
    const endMarker = 'const logoImageBytes = Buffer.from(logoBase64, \'base64\');';

    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);

    if (startIndex !== -1 && endIndex !== -1) {
        // We want to keep the start marker and the end marker line (which uses the var),
        // but remove the definition in between.
        // The definition is: const logoBase64 = "...";

        // Let's just replace the whole block with a clean version.
        const _newBlock = `
      // Embed Base64 Logo directly to avoid file path issues in production/serverless
      // const logoBase64 is imported from ./logo
      `;

        // We need to be careful not to delete 'const logoImageBytes...'
        // My previous injection was:
        // const logoBase64 = "${logoBase64}";
        // const logoImageBytes = Buffer.from(logoBase64, 'base64');

        // So I will replace from `const logoBase64 = "` to the line before `const logoImageBytes`

        // Actually, simpler approach:
        // Just replace the specific line `const logoBase64 = "...";` 
        // But regex might fail on 700KB line.

        // Let's find the line starting with `const logoBase64 = "`
        const lines = content.split('\n');
        const newLines = lines.map(line => {
            if (line.trim().startsWith('const logoBase64 = "')) {
                return '      // Using imported logoBase64';
            }
            return line;
        });
        content = newLines.join('\n');
        console.log('Replaced inline logoBase64 line.');
    }
}

fs.writeFileSync(invoicePath, content);
console.log('Updated lib/invoice.ts');
