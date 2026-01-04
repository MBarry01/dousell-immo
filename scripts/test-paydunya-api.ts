/**
 * Script de test de l'API PayDunya
 * Teste l'initialisation d'un paiement et affiche la réponse complète
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Charger .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function testPayDunyaAPI() {
  console.log('🧪 Test API PayDunya...\n');

  const masterKey = process.env.PAYDUNYA_MASTER_KEY;
  const privateKey = process.env.PAYDUNYA_PRIVATE_KEY;
  const token = process.env.PAYDUNYA_TOKEN;
  const mode = process.env.PAYDUNYA_MODE || 'test';

  console.log('Configuration:');
  console.log('- Mode:', mode);
  console.log('- Master Key:', masterKey?.substring(0, 10) + '...');
  console.log('- Private Key:', privateKey?.substring(0, 20) + '...');
  console.log('- Token:', token?.substring(0, 10) + '...');
  console.log('');

  const baseUrl = mode === 'test'
    ? 'https://app.paydunya.com/sandbox-api/v1'
    : 'https://app.paydunya.com/api/v1';

  const url = `${baseUrl}/checkout-invoice/create`;

  const payload = {
    invoice: {
      total_amount: 25000,
      description: "Test Loyer janvier 2026",
      items: [
        {
          name: "Loyer 1/2026",
          quantity: 1,
          unit_price: 25000,
          total_price: 25000,
          description: "Test paiement loyer"
        }
      ],
      channels: ['wave-senegal', 'orange-money-senegal']
    },
    store: {
      name: "Doussel Immo",
      tagline: "Test",
      website_url: "http://localhost:3000",
    },
    custom_data: {
      type: 'rent',
      lease_id: 'test-123'
    },
    actions: {
      return_url: "http://localhost:3000/portal?status=success",
      cancel_url: "http://localhost:3000/portal?status=cancel",
      callback_url: process.env.PAYDUNYA_CALLBACK_URL || "http://localhost:3000/api/paydunya/webhook",
    },
    customer: {
      name: "Test User",
      email: "test@example.com",
      phone: "221776000000"
    }
  };

  console.log('📤 Requête PayDunya:');
  console.log('URL:', url);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('');

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PAYDUNYA-MASTER-KEY": masterKey!,
        "PAYDUNYA-PRIVATE-KEY": privateKey!,
        "PAYDUNYA-TOKEN": token!,
      },
      body: JSON.stringify(payload),
    });

    console.log('📥 Réponse HTTP Status:', response.status, response.statusText);
    console.log('');

    const responseText = await response.text();

    console.log('📥 Réponse brute:');
    console.log(responseText);
    console.log('');

    try {
      const data = JSON.parse(responseText);
      console.log('📥 Réponse JSON parsée:');
      console.log(JSON.stringify(data, null, 2));
      console.log('');

      if (data.response_code === "00") {
        console.log('✅ Succès !');
        console.log('Token:', data.token);
        console.log('Checkout URL:', `https://app.paydunya.com/sandbox-checkout-invoice?token=${data.token}`);
      } else {
        console.log('❌ Erreur PayDunya:');
        console.log('Code:', data.response_code);
        console.log('Text:', data.response_text);
        console.log('Description:', data.description);
      }
    } catch (parseError) {
      console.log('⚠️ Impossible de parser la réponse JSON');
    }
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
  }
}

testPayDunyaAPI();
