/**
 * Script pour générer les icônes PWA (PNG) depuis le SVG
 * 
 * Usage:
 *   npm run generate-icons
 * 
 * Ou directement:
 *   node scripts/generate-pwa-icons.js
 */

const fs = require('fs');
const path = require('path');

const SVG_PATH = path.join(__dirname, '../public/icons/icon.svg');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

// Fonction pour convertir SVG en PNG (méthode simple avec sharp si disponible)
async function generateIcons() {
  try {
    // Vérifier si le SVG existe
    if (!fs.existsSync(SVG_PATH)) {
      console.error('❌ Erreur: Le fichier icon.svg n\'existe pas à:', SVG_PATH);
      process.exit(1);
    }

    // Vérifier si sharp est disponible
    let sharp;
    try {
      sharp = require('sharp');
    } catch (_error) {
      console.error('❌ Erreur: Le package "sharp" n\'est pas installé.');
      console.error('\n📦 Installation requise:');
      console.error('   npm install sharp --save-dev');
      console.error('\n💡 Alternatives:');
      console.error('   1. Utilisez un outil en ligne (CloudConvert, Convertio)');
      console.error('   2. Utilisez ImageMagick: magick convert public/icons/icon.svg -resize 192x192 public/icons/icon-192.png');
      console.error('\n📖 Voir docs/GENERER-ICONES-PWA.md pour plus d\'options');
      process.exit(1);
    }

    // Lire le SVG
    const svg = fs.readFileSync(SVG_PATH);

    console.log('🎨 Génération des icônes PWA...\n');

    // Générer icon-192.png
    await sharp(svg)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 5, g: 8, b: 12, alpha: 1 }, // #05080c
      })
      .png()
      .toFile(path.join(OUTPUT_DIR, 'icon-192.png'));

    console.log('✅ icon-192.png généré (192x192 px)');

    // Générer icon-512.png
    await sharp(svg)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 5, g: 8, b: 12, alpha: 1 }, // #05080c
      })
      .png()
      .toFile(path.join(OUTPUT_DIR, 'icon-512.png'));

    console.log('✅ icon-512.png généré (512x512 px)');

    console.log('\n🎉 Icônes PWA générées avec succès !');
    console.log('\n📋 Prochaines étapes:');
    console.log('   1. Vérifiez que les fichiers sont dans public/icons/');
    console.log('   2. Testez dans Chrome DevTools (F12 → Application → Manifest)');
    console.log('   3. Testez l\'installation PWA');

  } catch (error) {
    console.error('❌ Erreur lors de la génération des icônes:', error.message);
    console.error('\n💡 Voir docs/GENERER-ICONES-PWA.md pour d\'autres méthodes');
    process.exit(1);
  }
}

// Exécuter
generateIcons();

