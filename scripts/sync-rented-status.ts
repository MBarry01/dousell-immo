
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function syncRentedStatus() {
    console.log("Fetching active leases...");
    const { data: leases, error: leaseError } = await supabase
        .from("leases")
        .select("property_id")
        .eq("status", "active");

    if (leaseError) {
        console.error(leaseError);
        return;
    }

    const propertyIdsWithActiveLease = Array.from(new Set(leases.map(l => l.property_id).filter(Boolean)));
    console.log(`Found ${propertyIdsWithActiveLease.length} properties with active leases.`);

    if (propertyIdsWithActiveLease.length === 0) return;

    // Find those that are NOT 'loué' or ARE 'approved' in the DB
    const { data: propertiesToFix, error: propError } = await supabase
        .from("properties")
        .select("id, title, status, validation_status")
        .in("id", propertyIdsWithActiveLease)
        .or("status.neq.loué,validation_status.eq.approved");

    if (propError) {
        console.error(propError);
        return;
    }

    console.log(`Found ${propertiesToFix.length} properties to reconcile in DB.`);

    for (const property of propertiesToFix) {
        console.log(`Fixing [${property.id}] ${property.title}: status=${property.status} -> loué, validation=${property.validation_status} -> pending`);
        const { error: updateError } = await supabase
            .from("properties")
            .update({
                status: "loué",
                validation_status: "pending"
            })
            .eq("id", property.id);

        if (updateError) {
            console.error(`Error updating ${property.id}:`, updateError);
        }
    }

    console.log("Sync complete.");
}

syncRentedStatus();
