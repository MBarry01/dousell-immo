/**
 * Script de test pour le template AccessRejected.tsx
 * Usage: npx tsx scripts/test-access-rejected.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import React from "react";

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), ".env.local") });

import { sendEmail } from "../lib/mail";
import { AccessRejected } from "../emails/AccessRejected";

async function testAccessRejected() {
    const testEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;

    if (!testEmail) {
        console.error("❌ Aucun email de test trouvé (ADMIN_EMAIL ou GMAIL_USER)");
        process.exit(1);
    }

    console.log(`📨 Envoi de l'email de test (AccessRejected) à : ${testEmail}`);

    try {
        const result = await sendEmail({
            to: testEmail,
            subject: "❌ Mise à jour concernant votre demande d'accès",
            react: React.createElement(AccessRejected, {
                userName: "Barry",
                permissionLabel: "Édition des baux",
                reviewerName: "Responsable Sécurité",
                reviewNotes: "Cette permission nécessite une formation préalable ou une validation de niveau 2.",
                teamName: "Doussel Immo",
                contactUrl: "https://dousell-immo.app/gestion/equipe",
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

testAccessRejected().catch(console.error);
