/**
 * Script de test pour les nouveaux templates d'emails de gestion
 * Usage: npx tsx scripts/test-management-emails.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import React from "react";

// Charger .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { sendEmail } from "../lib/mail";
import { ReceiptEmail } from "../emails/ReceiptEmail";
import { WelcomePackEmail } from "../emails/WelcomePackEmail";
import { LegalNoticeEmail } from "../emails/LegalNoticeEmail";
import { LeaseRenewalEmail } from "../emails/LeaseRenewalEmail";
import { MaintenanceUpdateEmail } from "../emails/MaintenanceUpdateEmail";
import { TenantInvitationEmail } from "../emails/TenantInvitationEmail";
import { StandardNotificationEmail } from "../emails/StandardNotificationEmail";


async function runTests() {
    const testEmail = process.env.TEST_EMAIL || process.env.GMAIL_USER;

    if (!testEmail) {
        console.error("❌ TEST_EMAIL ou GMAIL_USER manquant");
        process.exit(1);
    }

    console.log(`🧪 Début des tests d'envoi d'emails vers: ${testEmail}\n`);

    const tests = [
        {
            name: "ReceiptEmail (Quittance)",
            subject: "🧪 Test ReceiptEmail - Dousel",
            component: React.createElement(ReceiptEmail, {
                tenantName: "Moussa Diop",
                receiptNumber: "QUITT-2026-001",
                periodDisplay: "Mars 2026",
                amountFormatted: "175 000",
                ownerName: "Agence Immobilier Pro",
                ownerAddress: "Dakar Plateau, Sénégal"
            })
        },
        {
            name: "WelcomePackEmail",
            subject: "🧪 Test WelcomePackEmail - Dousel",
            component: React.createElement(WelcomePackEmail, {
                tenantName: "Awa Ndiaye",
                propertyAddress: "Villa 45, Almadies, Dakar",
                monthlyAmount: "450 000",
                startDate: "01/04/2026",
                billingDay: 5,
                inviteLink: "https://dousel.com/invite/test",
                documentsList: ["Contrat de bail", "Quittance 1 mois de loyer", "Reçu de caution"],
                ownerName: "M. Thiam"
            })
        },
        {
            name: "LegalNoticeEmail (Préavis)",
            subject: "🧪 Test LegalNoticeEmail - Dousel",
            component: React.createElement(LegalNoticeEmail, {
                tenantName: "Jean Dupont",
                propertyAddress: "Appartement B3, Hann Mariste",
                noticeType: "termination",
                noticeTitle: "Préavis de fin de bail",
                mainContent: "Nous vous informons de la fin de votre bail pour reprise personnelle du bien.",
                effectiveDate: "30/09/2026",
                senderName: "Service Gestion Dousel"
            })
        },
        {
            name: "LeaseRenewalEmail",
            subject: "🧪 Test LeaseRenewalEmail - Dousel",
            component: React.createElement(LeaseRenewalEmail, {
                tenantName: "Fatou Sow",
                propertyAddress: "Immeuble Horizon, Bel-Air",
                currentEndDate: "31/12/2025",
                newEndDate: "31/12/2026",
                newMonthlyAmount: "220 000",
                acceptanceLink: "https://dousel.com/renew/test",
                ownerName: "Immo Horizon SARL"
            })
        },
        {
            name: "MaintenanceUpdateEmail",
            subject: "🧪 Test MaintenanceUpdateEmail - Dousel",
            component: React.createElement(MaintenanceUpdateEmail, {
                tenantName: "Omar Kane",
                description: "Réparation climatisation salon",
                artisanName: "ElectroTech Sénégal",
                artisanPhone: "+221 33 800 00 00",
                interventionDate: "05/03/2026 à 14h30",
                status: "approved"
            })
        },
        {
            name: "TenantInvitationEmail",
            subject: "🧪 Test TenantInvitationEmail - Dousel",
            component: React.createElement(TenantInvitationEmail, {
                tenantName: "Ibrahima Fall",
                propertyAddress: "Résidence de la Paix, Bloc C",
                magicLink: "https://dousel.com/login/magic-test",
                ownerName: "Cabinet Immobilier Excellence"
            })
        },
        {
            name: "StandardNotificationEmail",
            subject: "🧪 Test StandardNotificationEmail - Dousel",
            component: React.createElement(StandardNotificationEmail, {
                title: "Notification de Test",
                previewText: "Ceci est une notification de test générique",
                mainContent: "Le système de notification a été mis à jour avec succès. Ce template est désormais utilisé pour les messages et les confirmations de paiement.",
                ctaText: "Vérifier le dashboard",
                ctaUrl: "https://dousel.com/gestion",
                footerText: "Équipe Technique Dousel"
            })
        }

    ];

    for (const t of tests) {
        console.log(`📤 Envoi de: ${t.name}...`);
        try {
            const result = await sendEmail({
                to: testEmail,
                subject: t.subject,
                react: t.component
            });

            if (result.success) {
                console.log(`✅ ${t.name} envoyé ! (ID: ${result.messageId})`);
            } else {
                console.error(`❌ Erreur ${t.name}:`, result.error);
            }
        } catch (e) {
            console.error(`❌ Exception ${t.name}:`, e);
        }
        console.log("-".repeat(30));
    }

    console.log("\n✨ Tous les tests sont terminés !");
}

runTests().catch(console.error);
