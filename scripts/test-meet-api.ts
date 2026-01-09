import { google } from "googleapis";
import dotenv from "dotenv";
import path from "path";

// Charger .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function testMeetApi() {
    const email = process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, "\n");

    console.log("🔍 Checking Google Meet API access...");

    if (!email || !key) {
        console.error("❌ Missing credentials in .env.local");
        return;
    }

    const auth = new google.auth.JWT({
        email,
        key,
        // Note: Scopes for Meet API
        scopes: ["https://www.googleapis.com/auth/meetings.space.created"],
    });

    try {
        const meet = google.meet({ version: "v2", auth });

        console.log("📡 Creating a Meet Space...");
        const response = await meet.spaces.create({
            requestBody: {
                // Empty body is usually enough to create a default space
            }
        });

        console.log("✅ Space created successfully!");
        console.log("Meeting URI:", response.data.meetingUri);
        console.log("Name:", response.data.name);

    } catch (error: any) {
        console.error("❌ Error creating Meet Space:", error.message);
        if (error.code === 403) {
            console.log("👉 Suggestion: Enable 'Google Meet API' in Google Cloud Console.");
        }
    }
}

testMeetApi();
