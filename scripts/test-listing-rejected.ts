/**
 * Script de test pour le template ListingRejectedEmail.tsx
 * Usage: npx tsx scripts/test-listing-rejected.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import React from "react";

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), ".env.local") });

import { sendEmail } from "../lib/mail";
import { ListingRejectedEmail } from "../emails/listing-rejected-email";

async function testListingRejected() {
    const testEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;

    if (!testEmail) {
        console.error("❌ Aucun email de test trouvé (ADMIN_EMAIL ou GMAIL_USER)");
        process.exit(1);
    }

    console.log(`📨 Envoi de l'email de test (ListingRejected) à : ${testEmail}`);

    try {
        const result = await sendEmail({
            to: testEmail,
            subject: "⚠️ Action requise : Votre annonce a été refusée",
            react: React.createElement(ListingRejectedEmail, {
                propertyTitle: "Appartement F4 à Mermoz",
                rejectionReason: "La description est trop courte et ne mentionne pas les charges de copropriété. De plus, les photos du salon sont floues.",
                editUrl: "https://dousel.com/gestion/biens/edit/test-id",
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

testListingRejected().catch(console.error);
