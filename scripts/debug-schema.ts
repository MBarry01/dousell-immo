
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
    const { data: m } = await supabase.from('maintenance_requests').select('*').limit(1);
    console.log("maintenance_requests keys:", Object.keys(m?.[0] || {}));

    const { data: i } = await supabase.from('inspection_reports').select('*').limit(1);
    console.log("inspection_reports keys:", Object.keys(i?.[0] || {}));
}

check();
