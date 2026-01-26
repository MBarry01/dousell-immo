import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMPONENTS_DIR = path.join(__dirname, '../components');
const OUTPUT_FILE = path.join(__dirname, '../COMPONENT_MAP.md');

function getFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            getFiles(filePath, fileList);
        } else if (file.endsWith('.tsx') && !file.includes('.test.') && !file.includes('.stories.')) {
            // On retire l'extension et le chemin absolu pour ne garder que le relatif
            const relativePath = path.relative(path.join(__dirname, '..'), filePath);
            const componentName = path.basename(file, '.tsx');
            fileList.push(`- **<${componentName} />** (Path: \`${relativePath}\`)`);
        }
    });
    return fileList;
}

console.log(`Scanning components in ${COMPONENTS_DIR}...`);
const components = getFiles(COMPONENTS_DIR);
const content = `# 🗺️ MAP DES COMPOSANTS (${components.length})\n\nUtilise ces composants existants avant d'en créer de nouveaux :\n\n${components.join('\n')}`;

fs.writeFileSync(OUTPUT_FILE, content);
console.log(`✅ COMPONENT_MAP.md généré avec ${components.length} composants.`);
