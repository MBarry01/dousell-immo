
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

async function checkProperty() {
    console.log("🔍 Searching for property 'Villa'...");

    const { data: properties, error } = await supabase
        .from("properties")
        .select("id, title, service_type, validation_status, owner_id")
        .ilike("title", "%Villa%")
        .order("created_at", { ascending: false })
        .limit(5);

    if (error) {
        console.error("❌ Error fetching properties:", error);
        return;
    }

    if (!properties || properties.length === 0) {
        console.log("⚠️ No property found with title containing 'Villa'");
        return;
    }

    console.log(`✅ Found ${properties.length} properties:`);
    properties.forEach((p) => {
        console.log("------------------------------------------------");
        console.log(`ID: ${p.id}`);
        console.log(`Title: ${p.title}`);
        console.log(`Service Type: ${p.service_type}`);
        console.log(`Status: ${p.validation_status}`);
        console.log(`Is Paid? ${p.service_type === "boost_visibilite" ? "YES ✅" : "NO ❌"}`);
    });
}

checkProperty();
