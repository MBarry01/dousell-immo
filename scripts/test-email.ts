/**
 * Script de test pour le service d'envoi d'emails Gmail
 * Usage: npx tsx scripts/test-email.ts
 */

// IMPORTANT: Charger dotenv AVANT tout autre import
import { config } from "dotenv";
import { resolve } from "path";

// Charger les variables d'environnement depuis .env.local
const envResult = config({ path: resolve(process.cwd(), ".env.local") });

if (envResult.error) {
  console.warn("⚠️  Impossible de charger .env.local:", envResult.error.message);
}

// Vérifier que les variables sont chargées
if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  console.error("❌ Variables d'environnement manquantes dans .env.local");
  console.error("   GMAIL_USER:", process.env.GMAIL_USER ? "✅" : "❌");
  console.error("   GMAIL_APP_PASSWORD:", process.env.GMAIL_APP_PASSWORD ? "✅" : "❌");
  process.exit(1);
}

// Maintenant on peut importer le service mail
import { sendEmail, sendInvoiceEmail } from "../lib/mail";

async function testEmailService() {
  console.log("🧪 Test du service d'envoi d'emails Gmail\n");
  console.log("=".repeat(50));

  // Vérifier les variables d'environnement
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;
  const testEmail = process.env.TEST_EMAIL || gmailUser;

  if (!gmailUser || !gmailPassword) {
    console.error("❌ Variables d'environnement manquantes !");
    console.error("   Assurez-vous d'avoir GMAIL_USER et GMAIL_APP_PASSWORD dans .env.local");
    process.exit(1);
  }

  console.log(`📧 Configuration:`);
  console.log(`   Gmail User: ${gmailUser}`);
  console.log(`   Email de test: ${testEmail}`);
  console.log("");

  // Test 1: Email simple HTML
  console.log("📨 Test 1: Envoi d'un email simple HTML");
  console.log("-".repeat(50));

  if (!testEmail) {
    console.error("❌ TEST_EMAIL ou GMAIL_USER doit être défini");
    process.exit(1);
  }

  try {
    const result1 = await sendEmail({
      to: testEmail,
      subject: "🧪 Test Email - Dousel",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Dousel</h1>
              <p>Test d'envoi d'email</p>
            </div>
            <div class="content">
              <h2>Bonjour ! 👋</h2>
              <p>Ceci est un email de test pour vérifier que le service Gmail fonctionne correctement.</p>
              <p><strong>Détails du test:</strong></p>
              <ul>
                <li>✅ Configuration SMTP Gmail</li>
                <li>✅ Nom d'expéditeur professionnel</li>
                <li>✅ Support HTML</li>
              </ul>
              <p>Si vous recevez cet email, le service fonctionne parfaitement ! 🎉</p>
              <p style="margin-top: 30px; color: #666; font-size: 12px;">
                Email envoyé depuis le script de test à ${new Date().toLocaleString("fr-FR")}
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (result1.error) {
      console.error(`❌ Erreur: ${result1.error}`);
    } else {
      console.log(`✅ Email envoyé avec succès !`);
      console.log(`   Message ID: ${result1.messageId}`);
      if ('accepted' in result1) {
        console.log(`   Destinataires acceptés: ${(result1 as any).accepted?.join(", ")}`);
      }
    }
  } catch (error) {
    console.error(`❌ Erreur lors de l'envoi:`, error);
  }

  console.log("\n");

  // Test 2: Email avec React component (simulation)
  console.log("📨 Test 2: Envoi d'un email avec template React");
  console.log("-".repeat(50));

  try {
    const result2 = await sendEmail({
      to: testEmail,
      subject: "🧪 Test Email React - Dousel",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
            .card { background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 3px solid #f59e0b; padding-bottom: 20px; margin-bottom: 20px; }
            .badge { display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <h1 style="color: #05080c; margin: 0;">Dousel</h1>
                <p style="color: #666; margin: 5px 0 0 0;">Votre partenaire immobilier</p>
              </div>
              <h2>Test de template React Email</h2>
              <p>Ceci simule un email généré avec React Email.</p>
              <p><span class="badge">✅ Test réussi</span></p>
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Template généré à ${new Date().toLocaleString("fr-FR")}
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (result2.error) {
      console.error(`❌ Erreur: ${result2.error}`);
    } else {
      console.log(`✅ Email envoyé avec succès !`);
      console.log(`   Message ID: ${result2.messageId}`);
    }
  } catch (error) {
    console.error(`❌ Erreur lors de l'envoi:`, error);
  }

  console.log("\n");

  // Test 3: Email de facture avec PDF (simulation)
  console.log("📨 Test 3: Envoi d'une facture avec PDF");
  console.log("-".repeat(50));

  try {
    // Créer un PDF factice pour le test
    // En production, vous utiliseriez une vraie bibliothèque PDF comme pdfkit
    const fakePdfContent = Buffer.from(
      `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Invoice - Dousel) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000306 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
390
%%EOF`
    );

    const result3 = await sendInvoiceEmail({
      to: testEmail,
      clientName: "Test Client",
      pdfBuffer: fakePdfContent,
      invoiceNumber: "TEST-2025-001",
      amount: 1500,
    });

    if (result3.error) {
      console.error(`❌ Erreur: ${result3.error}`);
    } else {
      console.log(`✅ Facture envoyée avec succès !`);
      console.log(`   Message ID: ${result3.messageId}`);
      console.log(`   Facture: TEST-2025-001`);
      console.log(`   Montant: 1 500 FCFA`);
    }
  } catch (error) {
    console.error(`❌ Erreur lors de l'envoi:`, error);
  }

  console.log("\n");
  console.log("=".repeat(50));
  console.log("✅ Tests terminés !");
  console.log(`📧 Vérifiez votre boîte de réception: ${testEmail}`);
  console.log("   (Vérifiez aussi les spams si nécessaire)");
}

// Exécuter les tests
testEmailService().catch((error) => {
  console.error("❌ Erreur fatale:", error);
  process.exit(1);
});
