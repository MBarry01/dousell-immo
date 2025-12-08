import { generateInvoicePdf } from "../lib/invoice";
import fs from "fs";
import path from "path";

async function testInvoiceGeneration() {
    console.log("🚀 Testing Invoice Generation...");

    const invoiceData = {
        invoiceNumber: "FAC-TEST-2024-001",
        date: new Date(),
        clientName: "Test Client 🚀 éèà ç ñ ø",
        clientEmail: "test@example.com",
        items: [
            {
                description: "Test Item - Boost Visibilité 🏠✨",
                amount: 5000,
            },
        ],
        total: 5000,
    };

    try {
        const buffer = await generateInvoicePdf(invoiceData);
        console.log(`✅ Invoice generated successfully! Size: ${buffer.length} bytes`);

        const outputPath = path.join(process.cwd(), "test-invoice.pdf");
        fs.writeFileSync(outputPath, buffer);
        console.log(`📄 Saved to ${outputPath}`);
    } catch (error) {
        console.error("❌ Error generating invoice:", error);
    }
}

testInvoiceGeneration();
