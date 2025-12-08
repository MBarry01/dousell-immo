import { generateInvoicePdf } from "../lib/invoice";
import { sendEmail } from "../lib/mail";
import { ListingApprovedEmail } from "../emails/listing-approved-email";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

// Load env vars
dotenv.config({ path: ".env.local" });

async function main() {
    console.log("Starting test email send...");

    const userEmail = "mb3186802@gmail.com";

    // 1. Generate Invoice
    const invoiceData = {
        invoiceNumber: "TEST-INV-001",
        date: new Date(),
        clientName: "Mohamadou Barry",
        clientEmail: userEmail,
        items: [
            {
                description: "Boost Visibilité - Annonce : Test Property",
                amount: 1500,
            },
        ],
        total: 1500,
    };

    console.log("Generating PDF...");
    const pdfBuffer = await generateInvoicePdf(invoiceData);

    if (!pdfBuffer) {
        console.error("Failed to generate PDF");
        return;
    }
    console.log("PDF generated, size:", pdfBuffer.length);

    // 2. Send Email
    console.log("Sending email...");

    const result = await sendEmail({
        to: userEmail,
        subject: "TEST: Votre annonce est en ligne (avec facture)",
        react: ListingApprovedEmail({
            propertyTitle: "Appartement Test Dakar",
            propertyUrl: "https://dousell-immo.app/biens/test",
            isPaid: true,
            invoiceNumber: "TEST-INV-001",
            hasInvoice: true,
            propertyType: "Appartement",
            transactionType: "Location",
            price: 150000,
            region: "Dakar",
            city: "Plateau",
            address: "123 Rue de Test",
            paymentAmount: 1500,
            serviceName: "Boost Visibilité",
        }),
        attachments: [
            {
                filename: "Facture-TEST-INV-001.pdf",
                content: pdfBuffer,
                contentType: "application/pdf",
            },
        ],
    });

    if (result.error) {
        console.error("Error sending email:", result.error);
    } else {
        console.log("Email sent successfully!", result.data);
    }
}

main().catch(console.error);
