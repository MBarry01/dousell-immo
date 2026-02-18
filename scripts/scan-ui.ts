import fs from 'fs';
import _path from 'path';
import { glob } from 'glob'; // Assurez-vous d'avoir 'glob' (npm i glob)

const FORBIDDEN_PATTERNS = [
    { regex: /#[0-9A-Fa-f]{6}/g, message: "⚠️ Couleur Hex brute détectée. Utilisez les variables Tailwind (bg-primary, etc)." },
    { regex: /\bvh\b/g, message: "⚠️ Unité 'vh' détectée. Utilisez 'dvh' pour le mobile." },
    { regex: /bg-white(?!\/)/g, message: "⚠️ 'bg-white' détecté. Dousell est Dark Mode only." }
];

async function scan() {
    const files = await glob('app/**/*.tsx', { ignore: 'node_modules/**' });
    let hasError = false;

    files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        FORBIDDEN_PATTERNS.forEach(pattern => {
            if (pattern.regex.test(content)) {
                // Exception pour le fichier de config ou globals
                if (file.includes('tailwind.config') || file.includes('globals.css')) return;

                // Exception pour les couleurs hex dans les SVG (attribut fill) et metadata
                if (pattern.regex.source.includes('#[0-9A-Fa-f]{6}')) {
                    const lines = content.split('\n');
                    let hasViolation = false;
                    lines.forEach(line => {
                        if (/#[0-9A-Fa-f]{6}/.test(line)) {
                            // Ignorer si c'est dans un SVG fill ou dans metadata
                            if (!line.includes('fill=') && !line.includes('themeColor')) {
                                hasViolation = true;
                            }
                        }
                    });
                    if (!hasViolation) return;
                }

                console.error(`❌ [DESIGN VIOLATION] dans ${file}: ${pattern.message}`);
                hasError = true;
            }
        });
    });

    if (hasError) process.exit(1);
    console.log("✅ Design System Check: OK (Teranga Style respecté)");
}

scan();
