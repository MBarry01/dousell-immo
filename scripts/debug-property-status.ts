
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function debugStatuses() {
    const { data: properties, error } = await supabase
        .from("properties")
        .select("id, title, status, validation_status");

    if (error) {
        console.error(error);
        return;
    }

    console.log("Property Statuses:");
    properties.forEach(p => {
        console.log(`- [${p.id}] ${p.title}: status=${p.status}, validation=${p.validation_status}`);
    });
}

debugStatuses();
