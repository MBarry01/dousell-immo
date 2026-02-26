const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "";
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || "";
const BASE_URL =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://dousel.com");

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
    // Clean userIds (remove nulls, undefined, and empty strings)
    const cleanUserIds = userIds.filter(id => !!id && typeof id === 'string');

    if (cleanUserIds.length === 0) {
        console.warn("⚠️ No valid userIds provided for OneSignal push. Skipping.");
        return;
    }

    if (!ONESIGNAL_REST_API_KEY || !ONESIGNAL_APP_ID) {
        console.warn("⚠️ ONESIGNAL config manquante. Notification ignorée.");
        return;
    }

    const payload: Record<string, unknown> = {
        app_id: ONESIGNAL_APP_ID,
        // Targets
        include_aliases: {
            external_id: cleanUserIds
        },
        // Content
        contents: { en: content, fr: content },
        headings: { en: title, fr: title },
        // Metadata
        target_channel: "push",
        web_url: url ? (url.startsWith("http") ? url : `${BASE_URL}${url}`) : undefined,
        data: data,
    };

    console.log(`📡 Sending OneSignal push to ${cleanUserIds.length} recipients:`, cleanUserIds);

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
            console.error("❌ OneSignal Push Error (API):", responseData);
            return;
        }

        if (responseData.errors && responseData.errors.length > 0) {
            console.warn("⚠️ OneSignal Push warning:", responseData.errors);
        }

        console.log(`✅ OneSignal Push Sent for "${title}":`, {
            recipients: responseData.recipients,
            id: responseData.id
        });

        return responseData;
    } catch (error: unknown) {
        console.error("❌ OneSignal Push Error (Network):", (error as Error).message);
    }
}
