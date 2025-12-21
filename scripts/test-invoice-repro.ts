
import { generateInvoicePdf } from "../lib/invoice";
import { sendEmail } from "../lib/mail";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
    console.log("🚀 Starting invoice test with emojis...");

    try {
        // 1. Generate Invoice PDF
        console.log("📄 Generating PDF...");
        const invoiceData = {
            invoiceNumber: "TEST-INV-EMOJI",
            date: new Date(),
            clientName: "Test User",
            clientEmail: "test@example.com",
            items: [
                {
                    description: "Test Item with Emoji 🏠✨",
                    amount: 5000,
                },
            ],
            total: 5000,
        };

        const pdfBuffer = await generateInvoicePdf(invoiceData);
        console.log(`✅ PDF generated. Size: ${pdfBuffer.length} bytes`);

        // Save to disk to verify
        fs.writeFileSync("test-invoice-emoji.pdf", pdfBuffer);
        console.log("💾 Saved to test-invoice-emoji.pdf");

        // 2. Send Email
        console.log("📧 Sending email...");
        const result = await sendEmail({
            to: process.env.GMAIL_USER || "barrymohamadou98@gmail.com",
            subject: "Test Facture (Repro Script) - Avec Pièce Jointe",
            html: "<p>Ceci est un test de génération de facture avec emojis et pièce jointe.</p>",
            attachments: [
                {
                    filename: "test-invoice-emoji.pdf",
                    content: pdfBuffer,
                    contentType: "application/pdf",
                },
            ],
        });

        console.log("✅ Email result:", result);

    } catch (error: any) {
        console.error("❌ Error:", error);
        fs.writeFileSync("error.txt", error.stack || String(error));
    }
}

main();
