import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

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
function sanitizeText(text: string): string {
  if (!text) return "";
  try {
    const str = String(text);
    let cleaned = str.replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, " ");
    cleaned = cleaned.replace(/[^\x00-\x7F\u00C0-\u00FF]/g, "");
    return cleaned.trim();
  } catch (e) {
    return "";
  }
}

export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

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
      page.drawText(sanitizeText(item.description), { x: margin + 10, y: yPosition, size: 10, font: regularFont, color: rgb(0, 0, 0) });
      page.drawText(sanitizeText(`${item.amount.toLocaleString("fr-SN")} FCFA`), { x: width - margin - 100, y: yPosition, size: 10, font: regularFont, color: rgb(0, 0, 0) });
      yPosition -= 25;
    });

    // Total
    yPosition -= 10;
    page.drawLine({ start: { x: margin, y: yPosition }, end: { x: width - margin, y: yPosition }, thickness: 1, color: rgb(0, 0, 0) });
    yPosition -= 25;
    page.drawText("TOTAL NET A PAYER", { x: width - margin - 250, y: yPosition, size: 12, font: boldFont, color: rgb(0, 0, 0) });
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

