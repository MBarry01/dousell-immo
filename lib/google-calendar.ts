"use server";

import { google } from "googleapis";

// Configuration du Service Account
const GOOGLE_CALENDAR_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_CALENDAR_PRIVATE_KEY = process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, "\n");
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";

/**
 * Créer un événement Google Calendar avec lien Google Meet
 */
export async function createCalendarEventWithMeet({
    summary,
    description,
    startTime,
    endTime,
    // attendees argument removed
}: {
    summary: string;
    description: string;
    startTime: Date;
    endTime: Date;
    // attendees argument removed
}): Promise<{ success: boolean; meetLink?: string; eventLink?: string; error?: string }> {

    // Vérifier la configuration
    if (!GOOGLE_CALENDAR_SERVICE_ACCOUNT_EMAIL || !GOOGLE_CALENDAR_PRIVATE_KEY) {
        console.warn("⚠️ Google Calendar non configuré - génération de lien Meet désactivée");
        return {
            success: false,
            error: "Google Calendar non configuré"
        };
    }

    // Debug logs
    console.log("🔍 Google Calendar Config:");
    console.log("- Email:", GOOGLE_CALENDAR_SERVICE_ACCOUNT_EMAIL);
    console.log("- Key Length:", GOOGLE_CALENDAR_PRIVATE_KEY?.length);
    console.log("- Calendar ID:", GOOGLE_CALENDAR_ID);

    // eventBody removed as we construct it directly now

    // Authentification avec le Service Account
    const auth = new google.auth.JWT({
        email: GOOGLE_CALENDAR_SERVICE_ACCOUNT_EMAIL,
        key: GOOGLE_CALENDAR_PRIVATE_KEY,
        scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    const calendar = google.calendar({ version: "v3", auth });

    // Lien Meet statique fourni par l'utilisateur
    const STATIC_MEET_LINK = "https://meet.google.com/gbe-bayp-gct";

    try {
        console.log("🔄 Création événement avec lien statique:", STATIC_MEET_LINK);

        const event = await calendar.events.insert({
            calendarId: GOOGLE_CALENDAR_ID,
            requestBody: {
                summary,
                description: `${description}\n\n🔗 LIEN VISIOCONFÉRENCE :\n${STATIC_MEET_LINK}`,
                location: STATIC_MEET_LINK, // Le lien sera cliquable dans le champ "Lieu"
                start: {
                    dateTime: startTime.toISOString(),
                    timeZone: "Africa/Dakar",
                },
                end: {
                    dateTime: endTime.toISOString(),
                    timeZone: "Africa/Dakar",
                },
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: "email", minutes: 60 },
                        { method: "popup", minutes: 30 },
                    ],
                },
            },
        });

        console.log("✅ Événement Calendar créé:", event.data.htmlLink);
        console.log("🔗 Lien Google Meet (statique):", STATIC_MEET_LINK);

        return {
            success: true,
            meetLink: STATIC_MEET_LINK,
            eventLink: event.data.htmlLink || undefined,
        };
    } catch (error) {
        console.error("❌ Erreur création événement Calendar:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
