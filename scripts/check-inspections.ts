
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkInspections() {
    const { count, error } = await supabase
        .from('inspection_reports')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error("Error fetching inspections:", error);
        return;
    }

    console.log(`Total inspection reports: ${count}`);
}

checkInspections();
