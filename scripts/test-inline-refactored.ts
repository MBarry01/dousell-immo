/**
 * Script de test pour les nouveaux templates Invoice et Activation
 * Usage: npx tsx scripts/test-inline-refactored.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import React from "react";

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), ".env.local") });

import { sendEmail } from "../lib/mail";
import { InvoiceEmail } from "../emails/invoice-email";
import { ActivationApprovedEmail } from "../emails/activation-approved-email";
import { ActivationRejectedEmail } from "../emails/activation-rejected-email";

async function testRefactoredTemplates() {
    const testEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;

    if (!testEmail) {
        console.error("❌ Aucun email de test trouvé (ADMIN_EMAIL ou GMAIL_USER)");
        process.exit(1);
    }

    console.log(`📨 Envoi des emails de test à : ${testEmail}`);

    try {
        // 1. Test Invoice
        console.log("--- Envoi Facture ---");
        await sendEmail({
            to: testEmail,
            subject: "🧾 TEST : Votre facture Dousel",
            react: React.createElement(InvoiceEmail, {
                clientName: "Barry",
                invoiceNumber: "INV-2026-TEST",
                amount: 350000,
            }),
        });

        // 2. Test Activation Approved
        console.log("--- Envoi Activation Approuvée ---");
        await sendEmail({
            to: testEmail,
            subject: "🎉 TEST : Gestion Locative Activée",
            react: React.createElement(ActivationApprovedEmail, {
                firstName: "Barry",
            }),
        });

        // 3. Test Activation Rejected
        console.log("--- Envoi Activation Refusée ---");
        await sendEmail({
            to: testEmail,
            subject: "⚖️ TEST : Mise à jour de votre demande",
            react: React.createElement(ActivationRejectedEmail, {
                firstName: "Barry",
                reason: "Le Kbis fourni n'est pas à jour (plus de 3 mois).",
            }),
        });

        console.log("✅ Tous les tests terminés !");
    } catch (error) {
        console.error(`❌ Erreur lors de l'envoi:`, error);
    }
}

testRefactoredTemplates().catch(console.error);
