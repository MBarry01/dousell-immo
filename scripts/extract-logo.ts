import * as fs from 'fs';
import * as path from 'path';

const logoPath = path.join(process.cwd(), 'public', 'Logo_black.png');
const outputPath = path.join(process.cwd(), 'lib', 'logo.ts');

try {
    const logoBuffer = fs.readFileSync(logoPath);
    const base64 = logoBuffer.toString('base64');

    const fileContent = `export const logoBase64 = "${base64}";\n`;

    fs.writeFileSync(outputPath, fileContent);
    console.log(`Successfully created ${outputPath} with logo base64 (length: ${base64.length})`);
} catch (error) {
    console.error('Error processing logo:', error);
}
