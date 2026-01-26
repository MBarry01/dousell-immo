import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UI_DIR = path.join(__dirname, '../components/ui');
const OUTPUT_FILE = path.join(UI_DIR, 'index.ts');

// Liste des exports avec alias manuels pour éviter les conflits
const MANUAL_EXPORTS = {
    'container-scroll-animation.tsx': 'export { ContainerScroll, Header as ContainerScrollHeader, Card as ContainerScrollCard } from "./container-scroll-animation";'
};

const files = fs.readdirSync(UI_DIR).filter(f => f.endsWith('.tsx') && f !== 'index.ts');

const exports = files.map(f => {
    if (MANUAL_EXPORTS[f]) {
        return MANUAL_EXPORTS[f];
    }
    return `export * from "./${f.replace('.tsx', '')}";`;
}).join('\n');

fs.writeFileSync(OUTPUT_FILE, exports);
console.log(`✅ components/ui/index.ts généré avec ${files.length} exports.`);
