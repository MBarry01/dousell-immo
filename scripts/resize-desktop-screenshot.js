/**
 * Script pour recadrer le screenshot desktop à 1879x817px
 * 
 * Ce script utilise Sharp pour recadrer l'image à la taille correcte
 * qui respecte le ratio PWA de 2.3:1
 * 
 * Usage:
 *   npm install sharp --save-dev
 *   node scripts/resize-desktop-screenshot.js
 */

const fs = require('fs');
const path = require('path');

const INPUT_PATH = path.join(__dirname, '../public/screenshots/desktop-home.png');
const OUTPUT_PATH = path.join(__dirname, '../public/screenshots/desktop-home.png');
const TEMP_PATH = path.join(__dirname, '../public/screenshots/desktop-home-temp.png');

async function resizeScreenshot() {
  try {
    // Vérifier si l'image existe
    if (!fs.existsSync(INPUT_PATH)) {
      console.error('❌ Erreur: Le fichier desktop-home.png n\'existe pas à:', INPUT_PATH);
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
      console.error('\n💡 Alternative manuelle:');
      console.error('   1. Ouvrez desktop-home.png dans un éditeur d\'images');
      console.error('   2. Recadrez à 1879x817px');
      console.error('   3. Sauvegardez');
      process.exit(1);
    }

    console.log('🖼️  Recadrage du screenshot desktop...\n');

    // Recadrer l'image à 1879x817px (utiliser un fichier temporaire)
    await sharp(INPUT_PATH)
      .resize(1879, 817, {
        fit: 'cover', // Couvre la zone (peut couper un peu)
        position: 'center', // Centre l'image
      })
      .png()
      .toFile(TEMP_PATH);

    // Remplacer l'ancien fichier par le nouveau
    fs.unlinkSync(INPUT_PATH);
    fs.renameSync(TEMP_PATH, OUTPUT_PATH);

    console.log('✅ Screenshot recadré avec succès !');
    console.log('   Taille: 1879x817px');
    console.log('   Ratio: 2.3:1 ✅');
    console.log('\n📋 Prochaines étapes:');
    console.log('   1. Vérifiez dans Chrome DevTools → Application → Manifest');
    console.log('   2. L\'avertissement de mismatch devrait disparaître');
    console.log('   3. L\'erreur de ratio est déjà résolue');

  } catch (error) {
    console.error('❌ Erreur lors du recadrage:', error.message);
    console.error('\n💡 Voir docs/SOLUTION-SCREENSHOT-DESKTOP.md pour d\'autres méthodes');
    process.exit(1);
  }
}

// Exécuter
resizeScreenshot();

