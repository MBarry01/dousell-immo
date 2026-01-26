import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIG
const TYPES_PATH = path.join(__dirname, '../types/supabase.ts');
const SQL_DUMP_PATH = path.join(__dirname, '../schema_dump.sql');
const MAP_PATH = path.join(__dirname, '../COMPONENT_MAP.md');
const OUTPUT_FILE = path.join(__dirname, '../PROJECT_BRAIN.md');

function readFile(path) {
    try {
        if (fs.existsSync(path)) {
            return fs.readFileSync(path, 'utf8');
        }
        return null;
    } catch (e) { return null; }
}

let dataContent = "";
const typesContent = readFile(TYPES_PATH);
const sqlContent = readFile(SQL_DUMP_PATH);

if (typesContent) {
    dataContent = `\`\`\`typescript\n${typesContent}\n\`\`\``;
    console.log("✅ Types Supabase (TS) trouvés.");
} else if (sqlContent && sqlContent.trim().length > 0) {
    dataContent = `\`\`\`sql\n${sqlContent}\n\`\`\``;
    console.log("✅ Dump SQL trouvé (Alternative aux types).");
} else {
    dataContent = `> ⚠️ **MANQUANT** : Aucune définition de données trouvée.\n> Veuillez générer les types : \`npx supabase gen types typescript ... > types/supabase.ts\`\n> OU remplir \`schema_dump.sql\`.`;
    console.warn("⚠️ Aucune source de données (Types ou SQL) trouvée.");
}

const mapContent = readFile(MAP_PATH) || "// ⚠️ COMPONENT_MAP.md non trouvé. Lancez 'npm run map' !";

const brainContent = `# 🧠 PROJECT BRAIN (Context for AI)

---
## 1. DATA STRUCTURE
Utilise ces définitions pour comprendre la base de données (Tables, Colonnes, Relations).

${dataContent}

---
## 2. UI COMPONENTS (Existing)
Utilise ces composants pour construire l'interface.
${mapContent}
`;

fs.writeFileSync(OUTPUT_FILE, brainContent);
console.log(`✅ PROJECT_BRAIN.md généré.`);
