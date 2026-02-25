/**
 * Script de test pour les templates de services (Expiration et Relance)
 * Usage: npx tsx scripts/test-service-templates.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import React from "react";

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), ".env.local") });

import { sendEmail } from "../lib/mail";
import { LeaseExpirationEmail } from "../emails/lease-expiration-email";
import { PaymentReminderEmail } from "../emails/payment-reminder-email";

async function testServiceTemplates() {
    const testEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;

    if (!testEmail) {
        console.error("❌ Aucun email de test trouvé (ADMIN_EMAIL ou GMAIL_USER)");
        process.exit(1);
    }

    console.log(`📨 Envoi des emails de test de service à : ${testEmail}`);

    try {
        // 1. Test Expiration (6 mois)
        console.log("--- Envoi Expiration (6 mois) ---");
        await sendEmail({
            to: testEmail,
            subject: "📅 TEST : Fin de bail dans 6 mois",
            react: React.createElement(LeaseExpirationEmail, {
                monthsRemaining: 6,
                endDateStr: "15 Août 2026",
                tenantName: "Cheikh Tidiane",
                propertyName: "Villa Fann Résidence",
                monthlyAmountFormatted: "1 200 000",
            }),
        });

        // 2. Test Expiration (3 mois)
        console.log("--- Envoi Expiration (3 mois) ---");
        await sendEmail({
            to: testEmail,
            subject: "🔔 TEST : Fin de bail dans 3 mois",
            react: React.createElement(LeaseExpirationEmail, {
                monthsRemaining: 3,
                endDateStr: "15 Mai 2026",
                tenantName: "Cheikh Tidiane",
                propertyName: "Villa Fann Résidence",
                monthlyAmountFormatted: "1 200 000",
            }),
        });

        // 3. Test Relance Paiement
        console.log("--- Envoi Relance Paiement ---");
        await sendEmail({
            to: testEmail,
            subject: "💳 TEST : Rappel de paiement de loyer",
            react: React.createElement(PaymentReminderEmail, {
                tenantName: "Amadou Gallo",
                amountFormatted: "350 000",
                dueDateStr: "05 Février 2026",
            }),
        });

        console.log("✅ Tests de services terminés !");
    } catch (error) {
        console.error(`❌ Erreur lors de l'envoi:`, error);
    }
}

testServiceTemplates().catch(console.error);
