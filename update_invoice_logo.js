const fs = require('fs');
const path = require('path');

const logoBase64 = fs.readFileSync('logo.txt', 'utf8').trim();
const invoicePath = path.join('lib', 'invoice.ts');
let content = fs.readFileSync(invoicePath, 'utf8');

const newCode = `    // --- LOGO INTEGRATION ---
    try {
      // Embed Base64 Logo directly to avoid file path issues in production/serverless
      const logoBase64 = "${logoBase64}";
      const logoImageBytes = Buffer.from(logoBase64, 'base64');
      const logoImage = await pdfDoc.embedPng(logoImageBytes);
      const logoDims = logoImage.scale(0.25);

      page.drawImage(logoImage, {
        x: margin,
        y: height - 80 - logoDims.height,
        width: logoDims.width,
        height: logoDims.height,
      });
      yPosition = height - 100 - logoDims.height;
    } catch (e) {
      console.warn("Logo loading failed:", e);
      
      // Fallback Text
      const goldColor = rgb(251 / 255, 191 / 255, 36 / 255);
      const blackColor = rgb(0, 0, 0);
      page.drawText("DOUSSEL", { x: margin, y: yPosition, size: 28, font: boldFont, color: blackColor });
      const textWidth = boldFont.widthOfTextAtSize("DOUSSEL", 28);
      page.drawText("IMMO", { x: margin + textWidth + 8, y: yPosition, size: 28, font: boldFont, color: goldColor });
      yPosition -= 30;
    }`;

// Replace the try-catch block for logo loading
// We look for the start of the try block and the end of the catch block
const startMarker = '// --- LOGO INTEGRATION ---';
const endMarker = '    // Separator';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex);
    const finalContent = before + newCode + '\n\n' + after;
    fs.writeFileSync(invoicePath, finalContent);
    console.log('Successfully injected logo base64 into lib/invoice.ts');
} else {
    console.error('Could not find markers to replace content');
}
