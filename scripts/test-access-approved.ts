/**
 * Script de test pour le template AccessApproved.tsx
 * Usage: npx tsx scripts/test-access-approved.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import React from "react";

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), ".env.local") });

import { sendEmail } from "../lib/mail";
import { AccessApproved } from "../emails/AccessApproved";

async function testAccessApproved() {
    const testEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;

    if (!testEmail) {
        console.error("❌ Aucun email de test trouvé (ADMIN_EMAIL ou GMAIL_USER)");
        process.exit(1);
    }

    console.log(`📨 Envoi de l'email de test (AccessApproved) à : ${testEmail}`);

    try {
        const result = await sendEmail({
            to: testEmail,
            subject: "✅ Accès temporaire accordé - Nouveau Design",
            react: React.createElement(AccessApproved, {
                userName: "Barry",
                permissionLabel: "Édition des baux",
                expiresAt: "25 Février 2026 à 18:00",
                reviewerName: "M. Barry (Admin)",
                reviewNotes: "Accès accordé pour la session de cet après-midi. N'oubliez pas de sauvegarder vos modifications.",
                teamName: "Doussel Immo",
                dashboardUrl: "https://dousel.com/gestion",
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

testAccessApproved().catch(console.error);
