/**
 * Script de test pour le template AccessRequestNotification.tsx
 * Usage: npx tsx scripts/test-access-request.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import React from "react";

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), ".env.local") });

import { sendEmail } from "../lib/mail";
import { AccessRequestNotification } from "../emails/AccessRequestNotification";

async function testAccessRequest() {
    const testEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;

    if (!testEmail) {
        console.error("❌ Aucun email de test trouvé (ADMIN_EMAIL ou GMAIL_USER)");
        process.exit(1);
    }

    console.log(`📨 Envoi de l'email de test (AccessRequestNotification) à : ${testEmail}`);

    try {
        const result = await sendEmail({
            to: testEmail,
            subject: "🔑 Nouvelle demande d'accès de Barry",
            react: React.createElement(AccessRequestNotification, {
                requesterName: "Mohamadou Barry",
                requesterEmail: "barrymohamadou98@gmail.com",
                permissionLabel: "Édition des baux",
                reason: "Je dois mettre à jour le montant du loyer sur le contrat de la villa A1.",
                teamName: "Doussel Immo",
                reviewUrl: "https://dousel.com/gestion/access-control",
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

testAccessRequest().catch(console.error);
