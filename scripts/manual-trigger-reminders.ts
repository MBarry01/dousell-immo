import { internalProcessReminders } from "../lib/reminders-service";
import { createAdminClient } from "../lib/supabase-admin";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function main() {
    console.log("🚀 Starting manual reminder trigger...");

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("❌ Error: SUPABASE_SERVICE_ROLE_KEY is missing in .env.local");
        process.exit(1);
    }

    try {
        // 1. Initialize Admin Client
        const supabase = createAdminClient();

        // 2. Run the logic
        console.log("🔄 Calling internalProcessReminders...");
        const result = await internalProcessReminders(supabase);

        // 3. Output results
        console.log("\n✅ Result:", result);

    } catch (error) {
        console.error("\n❌ Failed:", error);
    }
}

main();
