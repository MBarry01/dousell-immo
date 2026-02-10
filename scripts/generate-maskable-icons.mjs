/**
 * Génère les icônes maskable PWA avec safe zone 80%
 *
 * Concept maskable Android :
 * - L'icône fait 512x512 mais Android la découpe en cercle/squircle/carré
 * - Seule la zone centrale (80% = 410px sur 512) est garantie visible
 * - Le logo doit tenir dans un cercle de 410px de diamètre centré
 *
 * Ce script :
 * 1. Prend l'icône source (icon-512.png)
 * 2. La redimensionne pour tenir dans la safe zone (80%)
 * 3. La place sur un fond #05080c (background du site)
 * 4. Génère icon-maskable-512.png et icon-maskable-192.png
 *
 * Usage : node scripts/generate-maskable-icons.mjs
 */

import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, '..', 'public', 'icons');
const BG_COLOR = '#05080c';

async function generateMaskableIcons() {
  const sourceIcon = join(ICONS_DIR, 'icon-512.png');

  // Lire les métadonnées de l'icône source
  const metadata = await sharp(sourceIcon).metadata();
  console.log(`Source: ${metadata.width}x${metadata.height}`);

  // --- Génération 512x512 maskable ---
  // Safe zone = 80% de 512 = ~410px
  // On redimensionne le logo à 360px pour avoir de la marge dans la safe zone
  const logoSize512 = 360;
  const canvasSize512 = 512;
  const offset512 = Math.round((canvasSize512 - logoSize512) / 2);

  const resizedLogo512 = await sharp(sourceIcon)
    .resize(logoSize512, logoSize512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: canvasSize512,
      height: canvasSize512,
      channels: 4,
      background: BG_COLOR,
    },
  })
    .composite([{ input: resizedLogo512, left: offset512, top: offset512 }])
    .png()
    .toFile(join(ICONS_DIR, 'icon-maskable-512.png'));

  console.log('icon-maskable-512.png generee (360px logo dans 512px canvas)');

  // --- Génération 192x192 maskable ---
  const logoSize192 = 136;
  const canvasSize192 = 192;
  const offset192 = Math.round((canvasSize192 - logoSize192) / 2);

  const resizedLogo192 = await sharp(sourceIcon)
    .resize(logoSize192, logoSize192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: canvasSize192,
      height: canvasSize192,
      channels: 4,
      background: BG_COLOR,
    },
  })
    .composite([{ input: resizedLogo192, left: offset192, top: offset192 }])
    .png()
    .toFile(join(ICONS_DIR, 'icon-maskable-192.png'));

  console.log('icon-maskable-192.png generee (136px logo dans 192px canvas)');

  // --- Bonus : apple-touch-icon 180x180 ---
  await sharp(sourceIcon)
    .resize(180, 180)
    .png()
    .toFile(join(ICONS_DIR, 'apple-touch-icon.png'));

  console.log('apple-touch-icon.png generee (180x180)');

  console.log('\nTermine ! Mettez a jour manifest.json pour pointer vers les nouvelles icones maskable.');
}

generateMaskableIcons().catch(console.error);
