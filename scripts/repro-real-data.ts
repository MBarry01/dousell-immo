
import { generateInvoicePdf } from "../lib/invoice";
import fs from "fs";

async function repro() {
    console.log("🚀 Starting reproduction with REAL data...");

    // Data from the database query
    const invoiceData = {
        invoiceNumber: "FAC-2025-NJVUZQ",
        date: new Date(),
        clientName: "Barry Mohamadou", // From user metadata
        clientEmail: "barrymohamadou98@gmail.com",
        items: [
            {
                description: "Boost Visibilité - Annonce : Villa",
                amount: 5000,
            },
        ],
        total: 5000,
    };

    try {
        const buffer = await generateInvoicePdf(invoiceData);
        console.log(`✅ Invoice generated successfully! Size: ${buffer.length} bytes`);
        fs.writeFileSync("repro-real-data.pdf", buffer);
        console.log("💾 Saved to repro-real-data.pdf");
    } catch (error) {
        console.error("❌ Error generating invoice:", error);
    }
}

repro();
