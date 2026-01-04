/**
 * Générateur de PDF pour Contrats de Bail
 * Utilise pdf-lib pour créer des PDFs professionnels
 *
 * Features:
 * - Mise en page professionnelle avec marges
 * - Support des signatures numériques (images)
 * - Logo du propriétaire
 * - Conformité visuelle Sénégal
 */

import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage, degrees } from 'pdf-lib';
import { generateContractText, ContractData, validateContractData } from './contract-template';
import { DEFAULT_CONTRACT_TEXTS, ContractCustomTexts } from './contract-defaults';
import { replacePlaceholders } from './pdf-generator-helper';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = {
  primary: rgb(0.2, 0.2, 0.6),
  secondary: rgb(0.4, 0.4, 0.4),
  text: rgb(0, 0, 0),
  lightGray: rgb(0.95, 0.95, 0.95),
  mediumGray: rgb(0.8, 0.8, 0.8),
};

interface PDFGenerationOptions {
  includeWatermark?: boolean;
  watermarkText?: string;
  logoUrl?: string;
}

interface PDFGenerationResult {
  success: boolean;
  pdfBytes?: Uint8Array;
  error?: string;
}

/**
 * Génère un PDF de contrat de bail à partir des données
 */
/**
 * Génère un PDF de contrat de bail à partir des données
 */
export async function generateLeasePDF(
  data: ContractData,
  customTexts: ContractCustomTexts = {},
  options: PDFGenerationOptions = {}
): Promise<PDFGenerationResult> {
  try {
    // 1. Validation des données
    const validation = validateContractData(data);
    if (!validation.valid) {
      return {
        success: false,
        error: `Données invalides: ${validation.errors.join(', ')}`
      };
    }

    // 2. Créer un nouveau document PDF
    const pdfDoc = await PDFDocument.create();

    // 3. Charger les polices
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // 4. Contenu du contrat (Header, Parties, Articles via CMS)
    await addContractContent(pdfDoc, data, customTexts, fontRegular, fontBold, options);

    // 6. Signatures intégrées dans addContractContent

    // 7. Ajouter le watermark si demandé (brouillon, etc.)
    if (options.includeWatermark && options.watermarkText) {
      await addWatermark(pdfDoc, options.watermarkText);
    }

    // 8. Sauvegarder et retourner
    const pdfBytes = await pdfDoc.save();

    return {
      success: true,
      pdfBytes
    };

  } catch (error) {
    console.error('Erreur génération PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Ajoute le contenu structuré du contrat : Header, Grille Parties, Articles
 */
async function addContractContent(
  pdfDoc: PDFDocument,
  data: ContractData,
  customTexts: ContractCustomTexts,
  fontRegular: PDFFont,
  fontBold: PDFFont,
  options: PDFGenerationOptions
): Promise<void> {
  const pageWidth = 595.28; // A4 width
  const pageHeight = 841.89; // A4 height
  const margin = 50;

  // Création de la première page
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - margin;

  // --- 1. HEADER (Logo + Titre) ---
  currentY = await drawHeader(pdfDoc, currentPage, data, options, currentY, pageWidth, margin, fontBold);

  // --- 2. PARTIES (Grille Bailleur / Locataire) ---
  currentY = drawPartiesGrid(currentPage, data, currentY, pageWidth, margin, fontRegular, fontBold);

  // Espace après la grille
  currentY -= 30;

  // --- 3. CORPS (Articles CMS) ---
  const lineSpacing = 14;
  const maxWidth = pageWidth - (2 * margin);

  // Fusion des textes
  const finalTexts = { ...DEFAULT_CONTRACT_TEXTS, ...customTexts };

  const articles = [
    { title: "ARTICLE 1 : OBJET DU BAIL ET DESCRIPTION DU BIEN", content: finalTexts.article_1_objet },
    { title: "ARTICLE 2 : DESTINATION DES LIEUX", content: finalTexts.article_2_destination },
    { title: "ARTICLE 3 : DURÉE DU BAIL", content: finalTexts.article_3_duree },
    { title: "ARTICLE 4 : LOYER", content: finalTexts.article_4_loyer },
    { title: "ARTICLE 5 : CHARGES ET CONSOMMATIONS", content: finalTexts.article_5_charges },
    { title: "ARTICLE 6 : DÉPÔT DE GARANTIE (CAUTION)", content: finalTexts.article_6_caution },
    { title: "ARTICLE 7 : OBLIGATIONS DU PRENEUR", content: finalTexts.article_7_obligations_preneur },
    { title: "ARTICLE 8 : OBLIGATIONS DU BAILLEUR", content: finalTexts.article_8_obligations_bailleur },
    { title: "ARTICLE 9 : RÉSILIATION ET PRÉAVIS", content: finalTexts.article_9_resiliation },
    { title: "ARTICLE 10 : CLAUSE RÉSOLUTOIRE", content: finalTexts.article_10_clause_resolutoire },
    { title: "ARTICLE 11 : ÉLECTION DE DOMICILE ET JURIDICTION COMPÉTENTE", content: finalTexts.article_11_election_domicile },
    { title: "ARTICLE 12 : FRAIS ET EXEMPLAIRES", content: finalTexts.article_12_frais },
  ];

  // Titre introductif
  currentPage.drawText("IL A ETE CONVENU ET ARRETE CE QUI SUIT :", {
    x: margin,
    y: currentY,
    size: 10,
    font: fontBold,
    color: COLORS.text,
  });
  currentY -= (lineSpacing * 2);

  // Boucle de rendu des articles
  for (const art of articles) {
    // Vérif nouvelle page (avec marge de sécurité)
    if (currentY < 100) {
      drawFooter(currentPage, pdfDoc.getPageCount(), pageWidth, fontRegular);
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      currentY = pageHeight - margin;
    }

    // Titre de l'article
    currentPage.drawText(art.title, { x: margin, y: currentY, size: 11, font: fontBold, color: COLORS.text });

    // Soulignage du titre
    const titleWidth = fontBold.widthOfTextAtSize(art.title, 11);
    currentPage.drawLine({
      start: { x: margin, y: currentY - 2 },
      end: { x: margin + titleWidth, y: currentY - 2 },
      thickness: 1,
      color: COLORS.text,
    });

    currentY -= 15;

    // Remplacement des variables
    const contentWithVars = replacePlaceholders(art.content || "", data);

    // Contenu (Wrappé)
    const lines = wrapText(contentWithVars, fontRegular, 10, maxWidth);
    for (const line of lines) {
      // Vérif saut de page intra-article
      if (currentY < margin + 20) {
        drawFooter(currentPage, pdfDoc.getPageCount(), pageWidth, fontRegular);
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
      }

      currentPage.drawText(line, { x: margin, y: currentY, size: 10, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
      currentY -= lineSpacing;
    }
    currentY -= 15; // Espace entre articles
  }

  // --- CLAUSES PARTICULIÈRES (AJOUT) ---
  if (customTexts.custom_clauses && customTexts.custom_clauses.trim() !== "") {
    if (currentY < 100) {
      drawFooter(currentPage, pdfDoc.getPageCount(), pageWidth, fontRegular);
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      currentY = pageHeight - margin;
    }

    const customTitle = "CONDITIONS PARTICULIÈRES";
    currentPage.drawText(customTitle, { x: margin, y: currentY, size: 11, font: fontBold, color: COLORS.text });

    const cw = fontBold.widthOfTextAtSize(customTitle, 11);
    currentPage.drawLine({
      start: { x: margin, y: currentY - 2 },
      end: { x: margin + cw, y: currentY - 2 },
      thickness: 1,
      color: COLORS.text,
    });

    currentY -= 15;

    const lines = wrapText(customTexts.custom_clauses, fontRegular, 10, maxWidth);
    for (const line of lines) {
      if (currentY < margin + 20) {
        drawFooter(currentPage, pdfDoc.getPageCount(), pageWidth, fontRegular);
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
      }
      currentPage.drawText(line, { x: margin, y: currentY, size: 10, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
      currentY -= lineSpacing;
    }
    currentY -= 20;
  }

  // --- SECTION SIGNATURES ---
  // On s'assure d'avoir assez de place (150px min), sinon nouvelle page
  if (currentY < 150) {
    drawFooter(currentPage, pdfDoc.getPageCount(), pageWidth, fontRegular);
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    currentY = pageHeight - margin;
  }

  currentY -= 30; // Petit espace avant la zone

  // Titre de section
  currentPage.drawText("SIGNATURES", { x: margin, y: currentY, size: 12, font: fontBold, color: COLORS.primary });
  currentPage.drawLine({
    start: { x: margin, y: currentY - 5 },
    end: { x: pageWidth - margin, y: currentY - 5 },
    thickness: 1,
    color: COLORS.primary // Primary color
  });

  currentY -= 40; // Espace sous la ligne

  // --- COLONNE GAUCHE : BAILLEUR ---
  const leftColX = margin;
  currentPage.drawText("LE BAILLEUR (Propriétaire)", { x: leftColX, y: currentY, size: 10, font: fontBold, color: COLORS.primary });
  currentPage.drawText("Lu et approuvé", { x: leftColX, y: currentY - 15, size: 9, font: fontRegular, color: COLORS.secondary });

  // Signature Bailleur
  if (data.signatures.landlordSignatureUrl) {
    try {
      const sigImage = await fetchAndEmbedImage(pdfDoc, data.signatures.landlordSignatureUrl);
      if (sigImage) {
        const sigWidth = 120;
        const sigHeight = 60;
        const scaledDims = sigImage.scale(sigWidth / sigImage.width);
        currentPage.drawImage(sigImage, {
          x: leftColX,
          y: currentY - 80,
          width: Math.min(scaledDims.width, sigWidth),
          height: Math.min(scaledDims.height, sigHeight),
        });
      }
    } catch (e) { console.warn("Erreur signature bailleur", e); }
  }


  // --- COLONNE DROITE : PRENEUR ---
  const rightColX = pageWidth / 2 + 20; // On commence après le milieu
  currentPage.drawText("LE PRENEUR (Locataire)", { x: rightColX, y: currentY, size: 10, font: fontBold, color: COLORS.primary });
  currentPage.drawText("Lu et approuvé", { x: rightColX, y: currentY - 15, size: 9, font: fontRegular, color: COLORS.secondary });

  // Signature Preneur
  if (data.signatures.tenantSignatureUrl) {
    try {
      const sigImage = await fetchAndEmbedImage(pdfDoc, data.signatures.tenantSignatureUrl);
      if (sigImage) {
        const sigWidth = 120;
        const sigHeight = 60;
        const scaledDims = sigImage.scale(sigWidth / sigImage.width);
        currentPage.drawImage(sigImage, {
          x: rightColX,
          y: currentY - 80,
          width: Math.min(scaledDims.width, sigWidth),
          height: Math.min(scaledDims.height, sigHeight),
        });
      }
    } catch (e) {
      console.warn("Pas de signature locataire chargée");
    }
  }


  // Footer pour la dernière page
  drawFooter(currentPage, pdfDoc.getPageCount(), pageWidth, fontRegular);

  // Mettre à jour les numéros de page
  const totalPages = pdfDoc.getPageCount();
  const pages = pdfDoc.getPages();
  pages.forEach((page, idx) => {
    page.drawText(`Page ${idx + 1} sur ${totalPages}`, {
      x: pageWidth - margin - 80,
      y: 30,
      size: 9,
      font: fontRegular,
      color: COLORS.secondary,
    });

    page.drawLine({
      start: { x: margin, y: 45 },
      end: { x: pageWidth - margin, y: 45 },
      thickness: 0.5,
      color: COLORS.mediumGray,
    });
  });
}

// --- HELPERS VISUELS ---

/** Dessine l'en-tête avec Logo et Titre Encadré (Empilés) */
async function drawHeader(
  pdfDoc: PDFDocument,
  page: PDFPage,
  data: ContractData,
  options: PDFGenerationOptions,
  startY: number,
  pageWidth: number,
  margin: number,
  fontBold: PDFFont
): Promise<number> {
  let currentY = startY;

  // 1. Logo à Gauche (s'il existe)
  if (options.logoUrl) {
    try {
      const logoImage = await fetchAndEmbedImage(pdfDoc, options.logoUrl);
      if (logoImage) {
        const logoHeight = 40;
        const logoDims = logoImage.scale(logoHeight / logoImage.height);
        page.drawImage(logoImage, {
          x: margin, // Gauche
          y: currentY - logoHeight,
          width: logoDims.width,
          height: logoDims.height,
        });

        // On descend le curseur Y sous le logo + marge
        currentY -= (logoHeight + 20);
      }
    } catch (e) { console.warn("Erreur logo", e); }
  }

  // 2. Titre Centré et Encadré (Sous le logo)
  const title = "CONTRAT DE BAIL A USAGE D'HABITATION";
  const subTitle = "République du Sénégal";
  const textSize = 14;
  const titleWidth = fontBold.widthOfTextAtSize(title, textSize);
  const boxWidth = titleWidth + 40;
  const boxHeight = 50;
  const boxX = (pageWidth - boxWidth) / 2;
  const boxY = currentY - boxHeight; // Positionné par rapport au nouveau currentY

  // Fond gris léger
  page.drawRectangle({
    x: boxX,
    y: boxY,
    width: boxWidth,
    height: boxHeight,
    color: COLORS.lightGray,
    borderColor: COLORS.mediumGray,
    borderWidth: 1,
  });

  // Texte Titre
  page.drawText(title, {
    x: (pageWidth - titleWidth) / 2,
    y: boxY + 25,
    size: textSize,
    font: fontBold,
    color: COLORS.primary, // Primary Color
  });

  // Sous-titre
  const subSize = 10;
  const subWidth = fontBold.widthOfTextAtSize(subTitle, subSize);
  page.drawText(subTitle, {
    x: (pageWidth - subWidth) / 2,
    y: boxY + 10,
    size: subSize,
    font: fontBold,
    color: COLORS.secondary,
  });

  return boxY - 30; // Espace après header
}

/** Dessine la Grille des Parties (Bailleur / Preneur) */
function drawPartiesGrid(
  page: PDFPage,
  data: ContractData,
  startY: number,
  pageWidth: number,
  margin: number,
  fontRegular: PDFFont,
  fontBold: PDFFont
): number {
  const { landlord, tenant } = data;
  const boxHeight = 160;
  const colWidth = (pageWidth - (2 * margin) - 10) / 2; // -10 pour gap au milieu
  const col1X = margin;
  const col2X = margin + colWidth + 10;

  // Fond global gris très clair pour la zone
  page.drawRectangle({
    x: margin,
    y: startY - boxHeight,
    width: pageWidth - (2 * margin),
    height: boxHeight,
    color: rgb(0.97, 0.97, 0.97),
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 1,
  }); // Erreur possible si boxHeight trop petit pour le contenu, on assume A4 fixe

  let textY = startY - 20;

  // --- COLONNE 1 : BAILLEUR ---
  page.drawText("LE BAILLEUR", { x: col1X + 10, y: textY, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.6) });
  textY -= 15;

  const lLines = [
    landlord.companyName ? `Société : ${landlord.companyName}` : `M./Mme : ${landlord.firstName} ${landlord.lastName}`,
    landlord.companyName && landlord.ninea ? `NINEA : ${landlord.ninea}` : '',
    `Adresse : ${landlord.address}`,
    `Tel : ${landlord.phone}`,
    landlord.email ? `Email : ${landlord.email}` : ''
  ].filter(l => l);

  let lY = textY;
  for (const l of lLines) {
    // Wrap si nécessaire (adresse longue)
    const wrapped = wrapText(l, fontRegular, 9, colWidth - 20);
    for (const wL of wrapped) {
      page.drawText(wL, { x: col1X + 10, y: lY, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
      lY -= 12;
    }
  }

  // --- COLONNE 2 : PRENEUR ---
  textY = startY - 20; // Reset Y pour colonne 2
  page.drawText("LE PRENEUR", { x: col2X + 10, y: textY, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.6) });
  textY -= 15;

  const tLines = [
    `M./Mme : ${tenant.firstName} ${tenant.lastName}`,
    tenant.nationalId ? `CNI / Passeport : ${tenant.nationalId}` : '',
    `Tel : ${tenant.phone}`,
    tenant.email ? `Email : ${tenant.email}` : ''
  ].filter(l => l);

  let tY = textY;
  for (const l of tLines) {
    const wrapped = wrapText(l, fontRegular, 9, colWidth - 20);
    for (const wL of wrapped) {
      page.drawText(wL, { x: col2X + 10, y: tY, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
      tY -= 12;
    }
  }

  // Ligne verticale de séparation
  page.drawLine({
    start: { x: margin + colWidth + 5, y: startY - 10 },
    end: { x: margin + colWidth + 5, y: startY - boxHeight + 10 },
    color: rgb(0.8, 0.8, 0.8),
    thickness: 1
  });

  return startY - boxHeight; // Retourne la nouvelle position Y
}

/** Helper simple pour footer temporaire (avant override final) */
function drawFooter(page: PDFPage, pageNum: number, width: number, font: PDFFont) {
  // Vide intentionnellement ou simple placeholder, le vrai est fait à la fin
}


/**
 * Wrapper le texte pour qu'il tienne dans la largeur maximale, en respectant les sauts de ligne
 */
function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  // 1. Normaliser les sauts de ligne et ASSAINIR le texte (Char non supportés par WinAnsi - ex 0x202f)
  const normalizedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Espace incésable étroit (0x202f) et autres espaces bizarres -> espace simple
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ')
    // Guillemets et apostrophes
    .replace(/[«»“”]/g, '"')
    .replace(/[‘’]/g, "'")
    // Tirets
    .replace(/[–—]/g, '-')
    // Points de suspension
    .replace(/…/g, '...');

  // 2. Découper en paragraphes
  const paragraphs = normalizedText.split('\n');
  const allLines: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      // Conserver les sauts de ligne vides (paragraphes vides)
      // On ajoute une ligne vide si ce n'est pas la toute première (évite marge top excessive)
      // mais ici on veut respecter le format user.
      allLines.push('');
      continue;
    }

    const words = paragraph.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);

      if (width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          allLines.push(currentLine);
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      allLines.push(currentLine);
    }
  }

  return allLines.length > 0 ? allLines : [''];
}

/**
 * Ajoute les signatures sur la dernière page
 */


/**
 * Ajoute un watermark (filigrane) sur toutes les pages
 */
async function addWatermark(pdfDoc: PDFDocument, text: string): Promise<void> {
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  pages.forEach(page => {
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: width / 2 - 100,
      y: height / 2,
      size: 60,
      font: font,
      color: rgb(0.9, 0.9, 0.9),
      opacity: 0.3,
      rotate: degrees(-45), // Utiliser degrees() de pdf-lib
    });
  });
}

/**
 * Récupère et embed une image depuis une URL
 */
async function fetchAndEmbedImage(pdfDoc: PDFDocument, imageUrl: string) {
  try {
    const response = await fetch(imageUrl);
    const imageBytes = await response.arrayBuffer();

    // Déterminer le type d'image
    if (imageUrl.toLowerCase().endsWith('.png')) {
      return await pdfDoc.embedPng(new Uint8Array(imageBytes) as any);
    } else if (imageUrl.toLowerCase().endsWith('.jpg') || imageUrl.toLowerCase().endsWith('.jpeg')) {
      return await pdfDoc.embedJpg(new Uint8Array(imageBytes) as any);
    } else {
      console.warn('Format d\'image non supporté:', imageUrl);
      return null;
    }
  } catch (err) {
    console.error('Erreur chargement image:', err);
    return null;
  }
}

/**
 * Sauvegarde le PDF en fichier (pour Node.js)
 */
export async function savePDFToFile(pdfBytes: Uint8Array, filename: string): Promise<void> {
  if (typeof window === 'undefined') {
    // Environnement Node.js
    const fs = await import('fs');
    fs.writeFileSync(filename, pdfBytes);
  } else {
    // Environnement navigateur
    const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}

/**
 * Upload le PDF vers Supabase Storage
 */
export async function uploadPDFToStorage(
  pdfBytes: Uint8Array,
  filename: string,
  supabaseClient: any
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { data, error } = await supabaseClient.storage
      .from('lease-contracts') // Bucket privé
      .upload(filename, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Créer une URL signée (valide 1 an = 31536000 secondes) pour bucket privé
    const { data: signedData, error: signedError } = await supabaseClient.storage
      .from('lease-contracts')
      .createSignedUrl(filename, 31536000);

    if (signedError) {
      console.error('Erreur création URL signée:', signedError);
      // Fallback: retourner le chemin du fichier à la place
      return {
        success: true,
        url: `storage://lease-contracts/${filename}` // URL interne pour référence
      };
    }

    return {
      success: true,
      url: signedData.signedUrl
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}
