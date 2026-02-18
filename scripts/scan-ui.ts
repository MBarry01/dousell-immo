import fs from 'fs';
import _path from 'path';
import { glob } from 'glob'; // Assurez-vous d'avoir 'glob' (npm i glob)

const FORBIDDEN_PATTERNS = [
    { regex: /#[0-9A-Fa-f]{6}/g, message: "⚠️ Couleur Hex brute détectée. Utilisez les variables Tailwind (bg-primary, etc).", warnOnly: true },
    { regex: /\bvh\b/g, message: "⚠️ Unité 'vh' détectée. Utilisez 'dvh' pour le mobile.", warnOnly: false },
    // bg-white est toléré dans les fichiers PDF/documents et le workspace light-mode
    { regex: /bg-white(?!\/)/g, message: "⚠️ 'bg-white' détecté. Préférez les tokens Tailwind (bg-background, bg-card, etc).", warnOnly: true }
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
                        // On crée un nouveau regex local sans flag g pour tester la ligne proprement
                        const hexRegex = /#[0-9A-Fa-f]{6}/i;
                        if (!hexRegex.test(line)) return;

                        // Ignorer les attributs SVG et metadata
                        if (line.includes('fill=') || line.includes('themeColor') ||
                            line.includes('stopColor') || line.includes('stroke=')) return;
                        // Ignorer les API DOM/Canvas (JS assignments)
                        if (line.includes('.style.') || line.includes('style.innerHTML') ||
                            line.includes('strokeStyle') || line.includes('fillStyle') ||
                            line.includes('borderColor') || line.includes('backgroundColor =')) return;
                        // Ignorer les templates HTML email (style=" inline HTML, non-JSX)
                        if (line.includes('style="')) return;

                        // CONSTRUCTION DE LA LIGNE NETTOYÉE
                        // 1. On retire d'abord les syntaxes Tailwind arbitrary (ex: text-[#F4C430])
                        // 2. On retire ensuite les codes couleurs autorisés explicitement (brand)
                        let cleanedLine = line.replace(/\[#[0-9A-Fa-f]{3,8}(?:\/\d+)?\]/g, '');

                        // Liste des couleurs autorisées (brand gold)
                        const allowedHex = ['#F4C430', '#FFD700', '#E5B82A'];
                        allowedHex.forEach(hex => {
                            const escapedHex = hex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            cleanedLine = cleanedLine.replace(new RegExp(escapedHex, 'gi'), '');
                        });

                        // Ignorer les données JS (objets, tableaux) avec des valeurs hex restantes
                        // (ex: collected: '#22c55e')
                        const trimmedCleaned = cleanedLine.trim();
                        if (/:\s*['"]#[0-9A-Fa-f]{6}/i.test(trimmedCleaned) ||
                            /^['"]#[0-9A-Fa-f]{6}/i.test(trimmedCleaned) ||
                            /,\s*['"]#[0-9A-Fa-f]{6}/i.test(trimmedCleaned)) return;

                        // S'il reste un code hex dans la ligne nettoyée, c'est une violation
                        if (hexRegex.test(cleanedLine)) {
                            hasViolation = true;
                        }
                    });
                    if (!hasViolation) return;
                }

                if (pattern.warnOnly) {
                    console.warn(`⚠️  [DESIGN WARNING] dans ${file}: ${pattern.message}`);
                } else {
                    console.error(`❌ [DESIGN VIOLATION] dans ${file}: ${pattern.message}`);
                    hasError = true;
                }
            }
        });
    });

    if (hasError) {
        process.exit(1);
    }
    console.log("✅ Design System Check: PASSED (Warnings allowed)");
    process.exit(0);
}

scan();
