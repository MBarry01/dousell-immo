/**
 * Script de test pour le template AppointmentConfirmationEmail.tsx
 * Usage: npx tsx scripts/test-appointment-confirmation.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import React from "react";

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), ".env.local") });

import { sendEmail } from "../lib/mail";
import AppointmentConfirmationEmail from "../emails/appointment-confirmation-email";

async function testAppointmentConfirmation() {
    const testEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;

    if (!testEmail) {
        console.error("❌ Aucun email de test trouvé (ADMIN_EMAIL ou GMAIL_USER)");
        process.exit(1);
    }

    console.log(`📨 Envoi de l'email de test (AppointmentConfirmation) à : ${testEmail}`);

    try {
        const result = await sendEmail({
            to: testEmail,
            subject: "📅 Votre rendez-vous est confirmé - Dousel",
            react: React.createElement(AppointmentConfirmationEmail, {
                userName: "Barry",
                date: "Mercredi 25 Février 2026",
                time: "15:30",
                meetingType: "Visite de la Villa Almadies",
                location: "Almadies, Dakar",
                phone: "+221 77 XXX XX XX",
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

testAppointmentConfirmation().catch(console.error);
