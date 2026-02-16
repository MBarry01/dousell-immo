const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "";
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || "";
const BASE_URL =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://dousell-immo.vercel.app");

type SendNotificationParams = {
    userIds: string[]; // External User IDs (Supabase Auth ID ou Lease ID)
    title?: string;
    content: string;
    url?: string;
    data?: Record<string, string>;
};

/**
 * Envoie une notification via OneSignal REST API
 * Utilise "include_aliases" pour cibler par External User ID
 */
export async function sendOneSignalNotification({
    userIds,
    title = "Notification",
    content,
    url,
    data,
}: SendNotificationParams) {
    if (!ONESIGNAL_REST_API_KEY || !ONESIGNAL_APP_ID) {
        console.warn("⚠️ ONESIGNAL config manquante. Notification ignorée.");
        return;
    }

    const payload: any = {
        app_id: ONESIGNAL_APP_ID,
        // use both legacy and new targeting for maximum compatibility
        include_external_user_ids: userIds,
        include_aliases: {
            external_id: userIds
        },
        target_channel: "push",
        contents: { en: content, fr: content },
        headings: { en: title, fr: title },
        web_url: url ? (url.startsWith("http") ? url : `${BASE_URL}${url}`) : undefined,
        data: data,
    };

    try {
        const response = await fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
            },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error("❌ OneSignal Push Error:", responseData);
            return;
        }

        console.log("✅ OneSignal Push Sent:", responseData);
        return responseData;
    } catch (error: unknown) {
        console.error("❌ OneSignal Push Error:", (error as Error).message);
    }
}
