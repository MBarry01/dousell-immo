
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRentedStatus() {
    console.log("Starting fix for rented properties...");

    // 1. Find properties that are 'loué' but still 'approved' (online)
    const { data: properties, error } = await supabase
        .from("properties")
        .select("id, title, status, validation_status")
        .eq("status", "loué")
        .eq("validation_status", "approved");

    if (error) {
        console.error("Error fetching properties:", error);
        return;
    }

    console.log(`Found ${properties.length} properties to fix.`);

    if (properties.length === 0) {
        console.log("No inconsistencies found.");
        return;
    }

    // 2. Update them to 'pending'
    const { error: updateError } = await supabase
        .from("properties")
        .update({ validation_status: "pending" })
        .in("id", properties.map((p) => p.id));

    if (updateError) {
        console.error("Error updating properties:", updateError);
    } else {
        console.log("Successfully updated properties to 'pending'.");
    }
}

fixRentedStatus();
