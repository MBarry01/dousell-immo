/**
 * Script de test du webhook n8n - Baraka Immo
 *
 * Usage:
 *   npx tsx scripts/test-n8n-webhook.ts
 *
 * Ce script teste l'envoi d'une quittance au workflow n8n
 */

import { createCanvas } from 'canvas';

// Couleurs du design system
const COLORS = {
  primary: '#F4C430',
  dark: '#000000',
  darkGray: '#121212',
  lightGray: '#f8f8f8',
  text: '#333333',
};

/**
 * Génère une quittance de test en base64
 */
function generateTestReceipt(): string {
  const canvas = createCanvas(800, 1000);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 800, 1000);

  // Header - Gradient
  const gradient = ctx.createLinearGradient(0, 0, 800, 150);
  gradient.addColorStop(0, COLORS.dark);
  gradient.addColorStop(1, COLORS.darkGray);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 150);

  // Logo/Title
  ctx.fillStyle = COLORS.primary;
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('BARAKA IMMO', 400, 70);

  ctx.font = '20px Arial';
  ctx.fillText('Gestion Locative Premium', 400, 110);

  // Document Title
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 36px Arial';
  ctx.fillText('QUITTANCE DE LOYER', 400, 220);

  // Receipt Info
  ctx.textAlign = 'left';
  ctx.font = '16px Arial';
  ctx.fillStyle = '#666';

  const details = [
    { label: 'N° de quittance', value: 'TEST-2025-001', y: 280 },
    { label: 'Date d\'émission', value: new Date().toLocaleDateString('fr-FR'), y: 320 },
    { label: 'Période', value: 'Janvier 2025', y: 360 },
  ];

  details.forEach(({ label, value, y }) => {
    ctx.fillStyle = '#666';
    ctx.fillText(label.toUpperCase(), 80, y);
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 18px Arial';
    ctx.fillText(value, 80, y + 25);
    ctx.font = '16px Arial';
  });

  // Tenant Info Box
  ctx.fillStyle = COLORS.lightGray;
  ctx.fillRect(60, 420, 680, 150);
  ctx.strokeStyle = COLORS.primary;
  ctx.lineWidth = 4;
  ctx.strokeRect(60, 420, 680, 150);

  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 20px Arial';
  ctx.fillText('LOCATAIRE', 80, 455);
  ctx.font = '18px Arial';
  ctx.fillText('Test Utilisateur', 80, 490);
  ctx.font = '16px Arial';
  ctx.fillStyle = '#666';
  ctx.fillText('Villa Test, Dakar', 80, 520);
  ctx.fillText('Tél: +221 77 123 45 67', 80, 545);

  // Amount Box
  ctx.fillStyle = COLORS.primary;
  ctx.fillRect(60, 600, 680, 120);

  ctx.fillStyle = COLORS.dark;
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('MONTANT RÉGLÉ', 400, 635);
  ctx.font = 'bold 48px Arial';
  ctx.fillText('250 000 FCFA', 400, 690);

  // Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = '#666';
  ctx.font = '14px Arial';
  ctx.fillText('Document généré automatiquement par Baraka Immo', 400, 850);
  ctx.fillText('Conservez ce document comme justificatif de paiement', 400, 880);

  // Signature area
  ctx.fillStyle = COLORS.text;
  ctx.font = 'italic 16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Propriétaire: Test Owner', 80, 950);

  ctx.beginPath();
  ctx.moveTo(500, 950);
  ctx.lineTo(720, 950);
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.font = '12px Arial';
  ctx.fillStyle = '#999';
  ctx.fillText('Signature', 590, 970);

  return canvas.toDataURL('image/png');
}

/**
 * Test du webhook n8n
 */
async function testN8nWebhook() {
  console.log('🧪 Test du webhook n8n - Baraka Immo\n');

  // Vérifier que l'URL est configurée
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_URL;

  if (!webhookUrl || webhookUrl.includes('votre-instance-n8n.com')) {
    console.error('❌ ERREUR: NEXT_PUBLIC_N8N_URL n\'est pas configurée dans .env.local');
    console.log('\n📝 Configurez d\'abord votre URL n8n:');
    console.log('   NEXT_PUBLIC_N8N_URL="https://votre-instance.app.n8n.cloud/webhook/auto-receipt-flow"');
    process.exit(1);
  }

  console.log(`🔗 URL du webhook: ${webhookUrl}`);
  console.log('📸 Génération d\'une quittance de test...\n');

  // Générer une quittance de test
  const receiptImage = generateTestReceipt();

  // Payload de test
  const payload = {
    tenantName: 'Amadou Diallo',
    tenantPhone: '0778451234',
    tenantEmail: 'test@example.com',
    propertyAddress: 'Villa Almadies, Dakar',
    monthPeriod: 'Janvier 2025',
    amount: 350000,
    receiptNumber: 'TEST-2025-001',
    ownerName: 'Fatou Seck',
    receiptImage: receiptImage,
  };

  console.log('📤 Envoi de la quittance au webhook...');
  console.log(`   Locataire: ${payload.tenantName}`);
  console.log(`   Téléphone: ${payload.tenantPhone}`);
  console.log(`   Montant: ${payload.amount.toLocaleString('fr-FR')} FCFA`);
  console.log(`   Période: ${payload.monthPeriod}\n`);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body: payload }),
    });

    const responseData = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS!\n');
      console.log('📊 Réponse du webhook:');
      console.log(JSON.stringify(responseData, null, 2));

      if (responseData.success) {
        console.log('\n🎉 La quittance a été envoyée avec succès!');
        if (responseData.sentTo) {
          console.log(`   📱 WhatsApp: ${responseData.sentTo.whatsapp || 'N/A'}`);
          console.log(`   📧 Email: ${responseData.sentTo.email || 'N/A'}`);
        }
      }
    } else {
      console.log('❌ ERREUR lors de l\'envoi\n');
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log('Réponse:', JSON.stringify(responseData, null, 2));

      if (response.status === 404) {
        console.log('\n💡 Le webhook n\'existe pas ou n\'est pas actif.');
        console.log('   Vérifiez que le workflow n8n est bien déployé et activé.');
      } else if (response.status === 400) {
        console.log('\n💡 Données invalides.');
        console.log('   Vérifiez le payload envoyé.');
      }
    }
  } catch (error) {
    console.error('❌ ERREUR de connexion:\n');

    if (error instanceof Error) {
      console.error(error.message);

      if (error.message.includes('fetch failed')) {
        console.log('\n💡 Impossible de se connecter au webhook.');
        console.log('   Vérifiez:');
        console.log('   - L\'URL du webhook est correcte');
        console.log('   - Le workflow n8n est actif');
        console.log('   - Votre connexion internet fonctionne');
      }
    } else {
      console.error(error);
    }
  }

  console.log('\n---\n');
  console.log('📚 Pour plus d\'informations, consultez:');
  console.log('   docs/GUIDE-N8N-CONFIGURATION.md');
}

// Exécution
testN8nWebhook().catch(console.error);
