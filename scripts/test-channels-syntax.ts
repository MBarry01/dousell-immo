/**
 * Test de différentes syntaxes pour le paramètre channels PayDunya
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function testChannelsSyntax() {
  const masterKey = process.env.PAYDUNYA_MASTER_KEY!;
  const privateKey = process.env.PAYDUNYA_PRIVATE_KEY!;
  const token = process.env.PAYDUNYA_TOKEN!;
  const baseUrl = 'https://app.paydunya.com/sandbox-api/v1';
  const url = `${baseUrl}/checkout-invoice/create`;

  const basePayload = {
    invoice: {
      total_amount: 1000,
      description: "Test Channels Syntax"
    },
    store: {
      name: "Test Store",
      website_url: "http://test.com"
    },
    actions: {
      return_url: "http://test.com/return",
      cancel_url: "http://test.com/cancel",
      callback_url: "http://test.com/callback"
    }
  };

  const testCases = [
    {
      name: "Array syntax",
      channels: ['wave-senegal', 'orange-money-senegal']
    },
    {
      name: "String comma-separated",
      channels: "wave-senegal,orange-money-senegal"
    },
    {
      name: "Object syntax",
      channels: {
        wave: 'wave-senegal',
        orange: 'orange-money-senegal'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n\n🧪 Test: ${testCase.name}`);
    console.log('━'.repeat(60));

    const payload = {
      ...basePayload,
      invoice: {
        ...basePayload.invoice,
        channels: testCase.channels
      }
    };

    console.log('Payload channels:', JSON.stringify(testCase.channels, null, 2));

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "PAYDUNYA-MASTER-KEY": masterKey,
          "PAYDUNYA-PRIVATE-KEY": privateKey,
          "PAYDUNYA-TOKEN": token,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.response_code === "00") {
        console.log('✅ SUCCÈS');
        console.log('Token:', data.token);
        console.log('URL:', data.response_text);
      } else {
        console.log('❌ ÉCHEC');
        console.log('Code:', data.response_code);
        console.log('Message:', data.response_text);
        console.log('Description:', data.description);
      }
    } catch (error: any) {
      console.log('❌ ERREUR:', error.message);
    }
  }

  console.log('\n\n━'.repeat(60));
  console.log('Tests terminés');
}

testChannelsSyntax();
