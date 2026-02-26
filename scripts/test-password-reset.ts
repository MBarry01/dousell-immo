/**
 * Script de test pour le template PasswordResetEmail.tsx
 * Usage: npx tsx scripts/test-password-reset.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import React from "react";

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), ".env.local") });

import { sendEmail } from "../lib/mail";
import { PasswordResetEmail } from "../emails/password-reset-email";

async function testPasswordReset() {
    const testEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;

    if (!testEmail) {
        console.error("❌ Aucun email de test trouvé (ADMIN_EMAIL ou GMAIL_USER)");
        process.exit(1);
    }

    console.log(`📨 Envoi de l'email de test (PasswordReset) à : ${testEmail}`);

    try {
        const result = await sendEmail({
            to: testEmail,
            subject: "🔒 Réinitialisation de votre mot de passe - Dousel",
            react: React.createElement(PasswordResetEmail, {
                userName: "Barry",
                resetUrl: "https://dousel.com/auth/choose-password?token=test-token-reset",
                teamName: "Dousel",
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

testPasswordReset().catch(console.error);
