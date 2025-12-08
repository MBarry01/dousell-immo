
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findProperty() {
    const paymentRef = "NJVUZQ"; // From user screenshot
    console.log(`🔍 Searching for property with payment_ref containing '${paymentRef}'...`);

    const { data: properties, error } = await supabase
        .from("properties")
        .select("id, title, service_type, validation_status, owner_id, payment_ref")
        .ilike("payment_ref", `%${paymentRef}%`)
        .limit(1);

    if (error) {
        console.error("❌ Error fetching property:", error);
        return;
    }

    if (!properties || properties.length === 0) {
        console.log("⚠️ No property found.");
        return;
    }

    const property = properties[0];
    console.log("✅ Found Property:");
    console.log(JSON.stringify(property, null, 2));

    // Also fetch owner details to see if there's anything weird with the name/email
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(property.owner_id);

    if (userError) {
        console.error("❌ Error fetching owner:", userError);
    } else {
        console.log("👤 Owner Details:");
        console.log(`Email: ${user?.email}`);
        console.log(`Metadata:`, user?.user_metadata);
    }
}

findProperty();
