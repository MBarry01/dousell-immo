/**
 * Script de test pour le template ListingApprovedEmail.tsx
 * Usage: npx tsx scripts/test-listing-approved.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import React from "react";

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), ".env.local") });

import { sendEmail } from "../lib/mail";
import { ListingApprovedEmail } from "../emails/listing-approved-email";

async function testListingApproved() {
    const testEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;

    if (!testEmail) {
        console.error("❌ Aucun email de test trouvé (ADMIN_EMAIL ou GMAIL_USER)");
        process.exit(1);
    }

    console.log(`📨 Envoi de l'email de test (ListingApproved) à : ${testEmail}`);

    try {
        const result = await sendEmail({
            to: testEmail,
            subject: "🎉 Votre annonce est en ligne ! - Doussel Immo",
            react: React.createElement(ListingApprovedEmail, {
                propertyTitle: "Superbe Villa aux Almadies avec Piscine",
                propertyUrl: "https://dousell-immo.app/biens/villa-almadies-piscine",
                isPaid: true,
                invoiceNumber: "INV-2026-001",
                hasInvoice: true,
                propertyType: "Villa",
                transactionType: "Vente",
                price: 350000000,
                city: "Dakar",
                region: "Almadies",
                paymentAmount: 15000,
                serviceName: "Boost Visibilité (7 jours)",
                teamName: "Doussel Immo",
            }),
        });

        if (result.error) {
            console.error(`❌ Erreur: ${result.error}`);
        } else {
            console.log(`✅ Email envoyé avec succès ! Message ID: ${result.messageId}`);
        }
    } catch (error) {
        console.error(`❌ Erreur lors de l'envoi:`, error);
    }
}

testListingApproved().catch(console.error);
