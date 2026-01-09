import { google } from "googleapis";
import dotenv from "dotenv";
import path from "path";

// Charger .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function checkCalendars() {
    const email = process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, "\n");

    console.log("🔍 Checking access for Service Account:", email);

    if (!email || !key) {
        console.error("❌ Missing credentials in .env.local");
        return;
    }

    const auth = new google.auth.JWT({
        email,
        key,
        scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    const calendar = google.calendar({ version: "v3", auth });

    try {
        console.log("📡 Listing calendars...");
        const res = await calendar.calendarList.list();

        console.log("\n✅ Accessible Calendars:");
        res.data.items?.forEach(cal => {
            console.log(`- ID: ${cal.id}`);
            console.log(`  Summary: ${cal.summary}`);
            console.log(`  AccessRole: ${cal.accessRole}`); // We need 'writer' or 'owner'
            console.log("---");
        });

        if (!res.data.items || res.data.items.length === 0) {
            console.log("⚠️ No calendars found (besides default hidden ones).");
        }

    } catch (error) {
        console.error("❌ Error listing calendars:", error);
    }
}

checkCalendars();
