/**
 * Script de test pour le template VisitRequestEmail.tsx
 * Usage: npx tsx scripts/test-visit-request.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import React from "react";

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), ".env.local") });

import { sendEmail } from "../lib/mail";
import VisitRequestEmail from "../emails/visit-request-email";

async function testVisitRequest() {
    const testEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;

    if (!testEmail) {
        console.error("❌ Aucun email de test trouvé (ADMIN_EMAIL ou GMAIL_USER)");
        process.exit(1);
    }

    console.log(`📨 Envoi de l'email de test (VisitRequest) à : ${testEmail}`);

    try {
        const result = await sendEmail({
            to: testEmail,
            subject: "🏠 Nouvelle demande de visite - Doussel Immo",
            react: React.createElement(VisitRequestEmail, {
                fullName: "Moussa Sarr",
                phone: "+221 78 123 45 67",
                projectType: "achat",
                availability: "En semaine après 17h",
                message: "Bonjour, je voudrais visiter le terrain à Diamniadio dès que possible.",
                teamName: "Doussel Immo",
                adminUrl: "https://dousel.com/admin/visits/test-id",
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

testVisitRequest().catch(console.error);
