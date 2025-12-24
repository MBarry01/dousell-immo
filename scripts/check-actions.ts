import fs from 'fs';
import { glob } from 'glob';

async function check() {
    const files = await glob('app/**/actions.ts', { ignore: 'node_modules/**' });
    let hasError = false;

    files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');

        // Vérifie la présence de Zod
        if (!content.includes('z.object') && !content.includes('zod')) {
            console.warn(`⚠️ [SECURITY WARNING] ${file} ne semble pas importer Zod.`);
        }

        // Vérifie le pattern de retour standard (rudimentaire mais efficace)
        if (!content.includes('return { success:')) {
            console.error(`❌ [CONTRACT VIOLATION] ${file} ne retourne pas d'objet standard { success: ... }.`);
            hasError = true;
        }
    });

    if (hasError) process.exit(1);
    console.log("✅ Server Actions Check: OK (Structure standardisée)");
}

check();
