
import { createClient } from "@supabase/supabase-js";
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log("Inspecting rental_transactions schema...");

    const { data: tx, error } = await supabase
        .from('rental_transactions')
        .select('*')
        .limit(1);

    if (error) { console.error(error); return; }

    if (tx && tx.length > 0) {
        const cols = Object.keys(tx[0]);
        console.log("Columns found:", cols);
        fs.writeFileSync('schema_log.txt', JSON.stringify(cols, null, 2));
    } else {
        console.log("No rows found to inspect.");
        fs.writeFileSync('schema_log.txt', "No rows found.");
    }
}

inspectSchema();
