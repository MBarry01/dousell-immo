
import { getPayDunyaConfig, createPayDunyaInvoice } from '../lib/paydunya';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function generateDebugUrl() {
    console.log("🔄 Generating DEBUG Invoice...");

    const config = getPayDunyaConfig();
    console.log(`Config: Mode=${config.mode}, MasterKey=${config.masterKey.substring(0, 5)}...`);

    const payload = {
        invoice: {
            total_amount: 1000, // Small amount
            description: "Debug Payment Options",
            items: [
                {
                    name: "Debug Item",
                    quantity: 1,
                    unit_price: 1000,
                    total_price: 1000,
                    description: "Debugging Payment Channels"
                }
            ],
            // Explicitly requesting channels to see if it forces them
            channels: ['wave-senegal', 'orange-money-senegal', 'card']
        },
        store: {
            name: "Titre Foncier", // Using a generic name
            tagline: "Test",
            website_url: "https://google.com"
        },
        custom_data: {
            debug_id: randomUUID()
        },
        actions: {
            return_url: "https://google.com?status=success",
            cancel_url: "https://google.com?status=cancel",
            callback_url: "https://google.com/webhook"
        },
        // Providing verified dummy data for sandbox
        customer: {
            name: "Amadou Diallo",
            email: "amadou.diallo@example.com",
            phone: "776000000" // Clean format
        }
    };

    try {
        const response = await createPayDunyaInvoice(payload);
        console.log("\n✅ Invoice Created!");
        console.log("------------------------------------------------");
        console.log("Token:", response.token);
        console.log("URL:", response.response_text);
        console.log("------------------------------------------------");
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

generateDebugUrl();
