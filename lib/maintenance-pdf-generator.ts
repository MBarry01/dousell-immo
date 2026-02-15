import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface MaintenancePDFData {
    requestId: string;
    description: string;
    category: string;
    interventionDate: string;
    quotedPrice: number;
    propertyTitle: string;
    propertyAddress: string;
    tenantName: string;
    artisanName?: string;
    artisanPhone?: string;
    ownerName: string;
    ownerCompany?: string;
    ownerAddress?: string;
    logoUrl?: string;
}

const COLORS = {
    black: rgb(0, 0, 0),
    darkGray: rgb(0.2, 0.2, 0.2),
    gray: rgb(0.5, 0.5, 0.5),
    lightGray: rgb(0.95, 0.95, 0.95),
};

export async function generateMaintenancePDF(data: MaintenancePDFData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const margin = 50;
    let currentY = height - margin;

    // --- Header ---
    if (data.logoUrl) {
        try {
            const response = await fetch(data.logoUrl);
            const imageBytes = await response.arrayBuffer();
            const logo = data.logoUrl.toLowerCase().endsWith('.png')
                ? await pdfDoc.embedPng(imageBytes)
                : await pdfDoc.embedJpg(imageBytes);

            const logoHeight = 40;
            const logoWidth = (logo.width * logoHeight) / logo.height;
            page.drawImage(logo, {
                x: margin,
                y: currentY - logoHeight,
                width: logoWidth,
                height: logoHeight,
            });
            currentY -= logoHeight + 20;
        } catch (e) {
            console.error("Logo fetch error", e);
        }
    }

    // -- Title --
    const title = "DEVIS D'INTERVENTION";
    page.drawText(title, {
        x: margin,
        y: currentY,
        size: 18,
        font: fontBold,
        color: COLORS.black,
    });

    const dateStr = format(new Date(), 'dd/MM/yyyy', { locale: fr });
    page.drawText(`Date du document : ${dateStr}`, {
        x: width - margin - 150,
        y: currentY,
        size: 10,
        font: fontRegular,
        color: COLORS.gray,
    });
    currentY -= 40;

    // --- Grid Info ---
    const colWidth = (width - 2 * margin) / 2;

    // Propriétaire
    page.drawText("ÉMIS PAR :", { x: margin, y: currentY, size: 9, font: fontBold, color: COLORS.gray });
    currentY -= 15;
    page.drawText(data.ownerCompany || data.ownerName, { x: margin, y: currentY, size: 11, font: fontBold });
    currentY -= 15;
    if (data.ownerAddress) {
        page.drawText(data.ownerAddress, { x: margin, y: currentY, size: 9, font: fontRegular });
        currentY -= 12;
    }

    // Bien & Locataire
    let gridY = currentY + 42;
    page.drawText("DESTINATAIRE / BIEN :", { x: margin + colWidth, y: gridY, size: 9, font: fontBold, color: COLORS.gray });
    gridY -= 15;
    page.drawText(data.tenantName, { x: margin + colWidth, y: gridY, size: 11, font: fontBold });
    gridY -= 15;
    page.drawText(data.propertyTitle, { x: margin + colWidth, y: gridY, size: 10, font: fontRegular });
    gridY -= 12;
    page.drawText(data.propertyAddress, { x: margin + colWidth, y: gridY, size: 8, font: fontRegular, color: COLORS.gray });

    currentY = Math.min(currentY, gridY) - 40;

    // --- Détails Intervention ---
    page.drawRectangle({
        x: margin,
        y: currentY - 5,
        width: width - 2 * margin,
        height: 20,
        color: COLORS.lightGray,
    });
    page.drawText("DÉTAILS DE L'INTERVENTION", { x: margin + 5, y: currentY, size: 10, font: fontBold });
    currentY -= 30;

    const details = [
        { label: "Catégorie", value: data.category },
        { label: "Date prévue", value: format(new Date(data.interventionDate), 'dd MMMM yyyy à HH:mm', { locale: fr }).replace(/[\u200B\u202F\u00A0]/g, ' ') },
        { label: "Description", value: data.description ? data.description.replace(/[\u200B\u202F\u00A0]/g, ' ') : '' },
    ];

    for (const item of details) {
        page.drawText(item.label, { x: margin, y: currentY, size: 9, font: fontBold, color: COLORS.gray });
        const wrappedLines = wrapText(item.value, fontRegular, 10, width - margin - 150);
        let lineY = currentY;
        for (const line of wrappedLines) {
            page.drawText(line, { x: margin + 100, y: lineY, size: 10, font: fontRegular });
            lineY -= 14;
        }
        currentY = Math.min(currentY - 20, lineY - 10);
    }

    currentY -= 20;

    // --- Artisan ---
    if (data.artisanName) {
        page.drawText("INTERVENANT (Artisan)", { x: margin, y: currentY, size: 10, font: fontBold });
        currentY -= 15;
        page.drawText(data.artisanName, { x: margin, y: currentY, size: 10, font: fontRegular });
        if (data.artisanPhone) {
            currentY -= 12;
            page.drawText(`Tel : ${data.artisanPhone}`, { x: margin, y: currentY, size: 9, font: fontRegular, color: COLORS.gray });
        }
        currentY -= 30;
    }

    // --- Montant ---
    currentY -= 20;
    const totalBoxWidth = 200;
    const totalBoxX = width - margin - totalBoxWidth;

    page.drawRectangle({
        x: totalBoxX,
        y: currentY - 10,
        width: totalBoxWidth,
        height: 40,
        color: COLORS.black,
    });

    page.drawText("MONTANT TOTAL ESTIMÉ", {
        x: totalBoxX + 10,
        y: currentY + 12,
        size: 8,
        font: fontRegular,
        color: rgb(1, 1, 1),
    });

    const priceStr = `${data.quotedPrice.toLocaleString('fr-FR')} FCFA`.replace(/[\u200B\u202F\u00A0]/g, ' ');
    const priceWidth = fontBold.widthOfTextAtSize(priceStr, 14);
    page.drawText(priceStr, {
        x: width - margin - priceWidth - 10,
        y: currentY - 2,
        size: 14,
        font: fontBold,
        color: rgb(1, 1, 1),
    });

    // Footer
    page.drawText("Document généré automatiquement par Doussel Immo.", {
        x: margin,
        y: 30,
        size: 8,
        font: fontRegular,
        color: COLORS.gray,
    });

    return await pdfDoc.save();
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
    const lines: string[] = [];
    const words = text.split(' ');
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (font.widthOfTextAtSize(testLine, fontSize) <= maxWidth) {
            currentLine = testLine;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}
