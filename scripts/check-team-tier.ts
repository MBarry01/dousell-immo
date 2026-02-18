
import { createClient } from "@/utils/supabase/server";
import { getUserTeamContext } from "@/lib/team-context";

async function main() {
    try {
        const context = await getUserTeamContext();
        console.log("Team Context:", JSON.stringify(context, null, 2));
    } catch (error) {
        console.error("Error fetching team context:", error);
    }
}

main();
