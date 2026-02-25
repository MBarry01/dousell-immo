/**
 * Script de test pour le template VerificationEmail.tsx
 * Usage: npx tsx scripts/test-verification.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import React from "react";

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), ".env.local") });

import { sendEmail } from "../lib/mail";
import { VerificationEmail } from "../emails/verification-email";

async function testVerification() {
    const testEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;

    if (!testEmail) {
        console.error("❌ Aucun email de test trouvé (ADMIN_EMAIL ou GMAIL_USER)");
        process.exit(1);
    }

    console.log(`📨 Envoi de l'email de test (VerificationEmail) à : ${testEmail}`);

    try {
        const result = await sendEmail({
            to: testEmail,
            subject: "👋 Bienvenue ! Confirmez votre adresse email",
            react: React.createElement(VerificationEmail, {
                userName: "Barry",
                verificationUrl: "https://dousell-immo.app/auth/callback?token_hash=test_token_123&type=email&next=/",
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

testVerification().catch(console.error);
