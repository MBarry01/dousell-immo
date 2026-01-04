
import { initializeRentalPayment } from '../lib/paydunya';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testSDK() {
    console.log("🧪 Testing PayDunya SDK initialization...");
    try {
        const result = await initializeRentalPayment(
            "lease-123",
            5000,
            1,
            2026,
            "test@example.com",
            "Test Tenant"
        );
        console.log("✅ Custom SDK Success:", result);
    } catch (error) {
        console.error("❌ SDK Error:", error);
        if (error instanceof Error) {
            console.error("Message:", error.message);
            console.error("Stack:", error.stack);
        }
    }
}

testSDK();
