import { PDFDocument, rgb, StandardFonts, PDFFont } from "pdf-lib";
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';

interface InvoiceData {
  invoiceNumber: string;
  date: Date;
  clientName: string;
  clientEmail: string;
  items: {
    description: string;
    amount: number;
  }[];
  total: number;
}

// Fonction utilitaire pour nettoyer le texte
// Emojis are now allowed!
function sanitizeText(text: string): string {
  if (!text) return "";
  try {
    const str = String(text);
    // Replace ALL Unicode spaces (including non-breaking spaces) with normal space
    // This includes: \u00A0 (NBSP), \u2000-\u200B (various spaces), \u202F (narrow NBSP), \u205F (medium mathematical space), \u3000 (ideographic space)
    let cleaned = str.replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, " ");
    
    // Normalize multiple spaces to single space
    cleaned = cleaned.replace(/\s+/g, " ");

    // Remove only control characters that might break PDF (0x00-0x1F except tabs/newlines)
    // keep emojis and other chars
    cleaned = cleaned.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

    return cleaned.trim();
  } catch (_e) {
    return "";
  }
}

export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Load Emoji Font
    let emojiFont: PDFFont | undefined;
    try {
      // Try public/fonts first, then fallback to node_modules if needed (local dev)
      const fontsDir = path.join(process.cwd(), 'public', 'fonts');
      // We will look for NotoEmoji-Regular.ttf or similar
      const fontPath = path.join(fontsDir, 'NotoEmoji-Regular.woff2');
      const fontBytes = fs.readFileSync(fontPath);
      emojiFont = await pdfDoc.embedFont(fontBytes);
    } catch (e) {
      console.warn("Could not load Emoji font, falling back to standard fonts:", e);
    }

    const margin = 50;
    let yPosition = height - 80;

    // --- LOGO INTEGRATION (TEXT BASED) ---
    const goldColor = rgb(251 / 255, 191 / 255, 36 / 255);
    const blackColor = rgb(0, 0, 0);

    // Main Title: DOUSSEL IMMO
    page.drawText("DOUSSEL", { x: margin, y: yPosition, size: 28, font: boldFont, color: blackColor });
    const textWidth = boldFont.widthOfTextAtSize("DOUSSEL", 28);
    page.drawText(" IMMO", { x: margin + textWidth, y: yPosition, size: 28, font: boldFont, color: blackColor });

    yPosition -= 20;

    // Slogan
    page.drawText("Votre partenaire immobilier de confiance", { x: margin, y: yPosition, size: 10, font: regularFont, color: blackColor });

    yPosition -= 30;

    // Separator
    page.drawLine({ start: { x: margin, y: yPosition }, end: { x: width - margin, y: yPosition }, thickness: 2, color: goldColor });
    yPosition -= 40;

    // --- INVOICE DETAILS ---
    const rightX = width - margin;
    page.drawText("FACTURE N°", { x: rightX - 120, y: yPosition, size: 10, font: regularFont, color: rgb(0, 0, 0) });
    yPosition -= 15;
    page.drawText(sanitizeText(data.invoiceNumber), { x: rightX - 120, y: yPosition, size: 10, font: boldFont, color: rgb(0, 0, 0) });
    yPosition -= 20;
    page.drawText("Date d'emission", { x: rightX - 120, y: yPosition, size: 10, font: regularFont, color: rgb(0, 0, 0) });
    yPosition -= 15;
    page.drawText(data.date.toLocaleDateString("fr-FR"), { x: rightX - 120, y: yPosition, size: 10, font: regularFont, color: rgb(0, 0, 0) });

    // --- CLIENT DETAILS ---
    yPosition = height - 200;
    page.drawText("FACTURE A", { x: margin, y: yPosition, size: 10, font: regularFont, color: rgb(0, 0, 0) });
    yPosition -= 15;
    page.drawText(sanitizeText(data.clientName), { x: margin, y: yPosition, size: 10, font: boldFont, color: rgb(0, 0, 0) });
    yPosition -= 15;
    page.drawText(sanitizeText(data.clientEmail), { x: margin, y: yPosition, size: 10, font: regularFont, color: rgb(0, 0, 0) });

    // --- TABLE ---
    yPosition -= 60;
    const tableTop = yPosition;
    page.drawRectangle({ x: margin, y: tableTop - 25, width: width - 2 * margin, height: 25, color: rgb(0.96, 0.96, 0.96), borderColor: rgb(0, 0, 0), borderWidth: 1 });
    page.drawText("DESCRIPTION", { x: margin + 10, y: tableTop - 17, size: 10, font: boldFont, color: rgb(0, 0, 0) });
    page.drawText("MONTANT", { x: width - margin - 100, y: tableTop - 17, size: 10, font: boldFont, color: rgb(0, 0, 0) });

    yPosition = tableTop - 50;
    data.items.forEach((item) => {
      // Use fallback font for description to support emojis
      const description = sanitizeText(item.description);
      const options: { x: number; y: number; size: number; font: PDFFont; color: ReturnType<typeof rgb> } = { x: margin + 10, y: yPosition, size: 10, font: regularFont, color: rgb(0, 0, 0) };

      if (emojiFont) {
        options.font = regularFont; // pdf-lib automatic fallback is not that simple, we need to handle it or use a font that supports both?
        // Actually, pdf-lib doesn't support automatic fallback easily without complex logic.
        // BUT, if we use the emoji font as the primary font for the description, it might look weird for normal text (monochrome).
        // However, for this task, the goal is to SHOW emojis.
        // Let's try to use emojiFont if we detect emojis, or just use `fallback` feature if available? No.
        // Simplest hack: Use the emoji font for the whole description line if it contains emojis?
        // Or better: NotoEmoji contains standard chars too?

        // NotoEmoji-Regular is a monochrome font that has standard glyphs too usually.
        // Let's safe-guard: if descriptions have emojis, use emojiFont.
        // Regex for emoji:
        if (/\p{Emoji}/u.test(description)) {
          options.font = emojiFont;
        }
      }

      page.drawText(description, options);

      // Nettoyer le montant formaté pour éviter les espaces insécables
      page.drawText(sanitizeText(`${item.amount.toLocaleString("fr-SN")} FCFA`), { x: width - margin - 100, y: yPosition, size: 10, font: regularFont, color: rgb(0, 0, 0) });
      yPosition -= 25;
    });

    // Total
    yPosition -= 10;
    page.drawLine({ start: { x: margin, y: yPosition }, end: { x: width - margin, y: yPosition }, thickness: 1, color: rgb(0, 0, 0) });
    yPosition -= 25;
    page.drawText("TOTAL NET A PAYER", { x: width - margin - 250, y: yPosition, size: 12, font: boldFont, color: rgb(0, 0, 0) });
    // Nettoyer le total formaté pour éviter les espaces insécables
    page.drawText(sanitizeText(`${data.total.toLocaleString("fr-SN")} FCFA`), { x: width - margin - 100, y: yPosition, size: 12, font: boldFont, color: rgb(0, 0, 0) });

    // Footer
    const footerY = 50;
    page.drawText("Doussel Immo - Dakar, Senegal - Support: +221 77 138 52 81 - Email: contact@doussel-immo.com", { x: margin, y: footerY, size: 8, font: regularFont, color: rgb(0, 0, 0) });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    throw error;
  }
}







