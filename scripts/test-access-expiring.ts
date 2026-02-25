/**
 * Script de test pour le template AccessExpiring.tsx
 * Usage: npx tsx scripts/test-access-expiring.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import React from "react";

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), ".env.local") });

import { sendEmail } from "../lib/mail";
import { AccessExpiring } from "../emails/AccessExpiring";

async function testAccessExpiring() {
    const testEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;

    if (!testEmail) {
        console.error("❌ Aucun email de test trouvé (ADMIN_EMAIL ou GMAIL_USER)");
        process.exit(1);
    }

    console.log(`📨 Envoi de l'email de test (AccessExpiring) à : ${testEmail}`);

    try {
        const result = await sendEmail({
            to: testEmail,
            subject: "⏰ Rappel : Votre accès expire bientôt",
            react: React.createElement(AccessExpiring, {
                userName: "Barry",
                permissionLabel: "Édition des baux",
                expiresAt: "25 Février 2026 à 18:00",
                hoursRemaining: 1,
                teamName: "Doussel Immo",
                requestUrl: "https://dousell-immo.app/gestion",
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

testAccessExpiring().catch(console.error);
