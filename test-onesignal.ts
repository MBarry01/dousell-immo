import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testOneSignal() {
    const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "";
    const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || "";

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
        console.error("Missing credentials");
        return;
    }

    const cleanUserIds = ["test-user-id"];

    const payload = {
        app_id: ONESIGNAL_APP_ID,
        // Current implementation uses both
        include_external_user_ids: cleanUserIds,
        include_aliases: {
            external_id: cleanUserIds
        },
        contents: { en: "Test message", fr: "Message test" },
        headings: { en: "Test", fr: "Test" },
        target_channel: "push"
    };

    console.log("Payload:", JSON.stringify(payload, null, 2));

    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response:", data);
    } catch (e) {
        console.error(e);
    }
}

testOneSignal();
