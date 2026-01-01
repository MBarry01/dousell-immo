#!/usr/bin/env node
/* eslint-disable */

/**
 * Script de vérification du manifest.json
 * Usage: node scripts/check-manifest.js
 */

const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
const iconsPath = path.join(__dirname, '..', 'public', 'icons');

console.log('🔍 Vérification du manifest.json...\n');

// 1. Vérifier que le fichier existe
if (!fs.existsSync(manifestPath)) {
  console.error('❌ Le fichier manifest.json n\'existe pas !');
  console.error(`   Chemin attendu: ${manifestPath}`);
  process.exit(1);
}

// 2. Lire et parser le JSON
let manifest;
try {
  const content = fs.readFileSync(manifestPath, 'utf8');
  manifest = JSON.parse(content);
  console.log('✅ JSON valide\n');
} catch (error) {
  console.error('❌ Erreur de syntaxe JSON:', error.message);
  process.exit(1);
}

// 3. Vérifier les propriétés essentielles
const checks = [
  {
    name: 'name',
    value: manifest.name,
    required: true,
    message: 'Nom de l\'application',
  },
  {
    name: 'short_name',
    value: manifest.short_name,
    required: true,
    message: 'Nom court (max 12 caractères)',
    validate: (val) => val.length <= 12,
  },
  {
    name: 'start_url',
    value: manifest.start_url,
    required: true,
    message: 'URL de démarrage',
  },
  {
    name: 'display',
    value: manifest.display,
    required: true,
    expected: 'standalone',
    message: 'Mode d\'affichage (doit être "standalone")',
  },
  {
    name: 'background_color',
    value: manifest.background_color,
    required: true,
    expected: '#05080c',
    message: 'Couleur de fond (doit être #05080c pour éviter les bords blancs)',
  },
  {
    name: 'theme_color',
    value: manifest.theme_color,
    required: true,
    expected: '#05080c',
    message: 'Couleur du thème',
  },
  {
    name: 'icons',
    value: manifest.icons,
    required: true,
    message: 'Icônes (doit être un tableau)',
    validate: (val) => Array.isArray(val) && val.length >= 2,
  },
];

let hasErrors = false;

console.log('📋 Vérification des propriétés :\n');

checks.forEach((check) => {
  if (check.required && !manifest[check.name]) {
    console.error(`❌ ${check.name}: MANQUANT - ${check.message}`);
    hasErrors = true;
    return;
  }

  if (check.expected && manifest[check.name] !== check.expected) {
    console.error(
      `❌ ${check.name}: "${manifest[check.name]}" (attendu: "${check.expected}") - ${check.message}`
    );
    hasErrors = true;
    return;
  }

  if (check.validate && !check.validate(manifest[check.name])) {
    console.error(`❌ ${check.name}: VALIDATION ÉCHOUÉE - ${check.message}`);
    hasErrors = true;
    return;
  }

  console.log(`✅ ${check.name}: ${JSON.stringify(manifest[check.name])}`);
});

// 4. Vérifier les icônes
console.log('\n🖼️  Vérification des icônes :\n');

if (manifest.icons && Array.isArray(manifest.icons)) {
  const requiredSizes = ['192x192', '512x512'];
  const foundSizes = [];

  manifest.icons.forEach((icon, index) => {
    const iconPath = path.join(__dirname, '..', 'public', icon.src);
    const exists = fs.existsSync(iconPath);

    if (!exists) {
      console.error(`❌ Icône ${index + 1}: Fichier introuvable - ${icon.src}`);
      hasErrors = true;
    } else {
      console.log(`✅ Icône ${index + 1}: ${icon.src} (${icon.sizes})`);
    }

    if (icon.sizes) {
      foundSizes.push(icon.sizes);
    }

    // Vérifier purpose
    if (icon.purpose && icon.purpose !== 'any') {
      console.warn(
        `⚠️  Icône ${index + 1}: purpose="${icon.purpose}" (recommandé: "any" pour éviter les bords blancs)`
      );
    }
  });

  // Vérifier que toutes les tailles requises sont présentes
  requiredSizes.forEach((size) => {
    if (!foundSizes.includes(size)) {
      console.error(`❌ Taille d'icône manquante: ${size}`);
      hasErrors = true;
    }
  });
} else {
  console.error('❌ Aucune icône trouvée dans le manifest');
  hasErrors = true;
}

// 5. Résumé
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.error('\n❌ Le manifest.json contient des erreurs. Corrigez-les avant de déployer.\n');
  process.exit(1);
} else {
  console.log('\n✅ Le manifest.json est correct !\n');
  console.log('📱 Prochaines étapes :');
  console.log('   1. Testez avec Lighthouse (Chrome DevTools > Lighthouse > PWA)');
  console.log('   2. Vérifiez sur mobile (iOS Safari et Android Chrome)');
  console.log('   3. Utilisez PWA Builder : https://www.pwabuilder.com/\n');
  process.exit(0);
}
