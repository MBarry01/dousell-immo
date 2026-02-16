import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.error("❌ Mising OneSignal Cloud Config");
    process.exit(1);
}

async function testPayload(name: string, payload: any) {
    console.log(`\nTesting ${name}...`);
    try {
        const response = await fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        console.log(`Status: ${response.status}`);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

async function run() {
    const testUserId = "test-user-id-" + Date.now();

    // 1. Legacy Payload
    await testPayload("Legacy (include_external_user_ids)", {
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: [testUserId],
        contents: { en: "Test Legacy" },
    });

    // 2. New Payload
    await testPayload("New (include_aliases)", {
        app_id: ONESIGNAL_APP_ID,
        include_aliases: {
            external_id: [testUserId]
        },
        target_channel: "push",
        contents: { en: "Test New" },
    });
}

run();
