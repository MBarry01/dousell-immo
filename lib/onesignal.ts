import axios from "axios";

const ONESIGNAL_APP_ID = "a7fba1dc-348a-4ee5-9647-3e7253c13cb8";
// IMPORTANT: Cette clé doit être dans .env.local
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || "os_v2_app_u752dxburjholfshhzzfhqj4xdxkbz7nicmuww57y4bsh4fkda6zyb5zmxofhhr72eyd4vh3ez7jofw22fydwjxbbovn45vcofvobby";

type SendNotificationParams = {
    userIds: string[]; // External User IDs (Supabase Auth ID ou Lease ID)
    title?: string;
    content: string;
    url?: string;
    data?: Record<string, any>;
};

/**
 * Envoie une notification via OneSignal REST API
 * Utilise "include_aliases" pour cibler par External User ID
 */
export async function sendOneSignalNotification({
    userIds,
    title = "Dousell Immo",
    content,
    url,
    data,
}: SendNotificationParams) {
    if (!ONESIGNAL_REST_API_KEY) {
        console.warn("⚠️ ONESIGNAL_REST_API_KEY manquant. Notification ignorée.");
        return;
    }

    const payload = {
        app_id: ONESIGNAL_APP_ID,
        include_aliases: {
            external_id: userIds,
        },
        target_channel: "push",
        contents: { en: content, fr: content },
        headings: { en: title, fr: title },
        url: url,
        data: data,
        // Configuration spécifique Web Push
        web_url: url,
    };

    try {
        const response = await axios.post(
            "https://onesignal.com/api/v1/notifications",
            payload,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
                },
            }
        );
        console.log("✅ OneSignal Push Sent:", response.data);
        return response.data;
    } catch (error: any) {
        console.error(
            "❌ OneSignal Push Error:",
            error.response?.data || error.message
        );
    }
}
