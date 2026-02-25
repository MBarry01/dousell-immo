/**
 * Script de test pour le template ListingSubmittedEmail.tsx
 * Usage: npx tsx scripts/test-listing-submitted.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import React from "react";

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), ".env.local") });

import { sendEmail } from "../lib/mail";
import { ListingSubmittedEmail } from "../emails/listing-submitted-email";

async function testListingSubmitted() {
    const testEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;

    if (!testEmail) {
        console.error("❌ Aucun email de test trouvé (ADMIN_EMAIL ou GMAIL_USER)");
        process.exit(1);
    }

    console.log(`📨 Envoi de l'email de test (ListingSubmitted) à : ${testEmail}`);

    try {
        const result = await sendEmail({
            to: testEmail,
            subject: "🔔 Nouvelle annonce en attente de modération",
            react: React.createElement(ListingSubmittedEmail, {
                propertyTitle: "Appartement F4 à Mermoz",
                propertyPrice: 120000000,
                ownerEmail: "test-proprietaire@gmail.com",
                serviceType: "Pack Premium",
                adminUrl: "https://dousell-immo.app/admin/listings/test-id",
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

testListingSubmitted().catch(console.error);
