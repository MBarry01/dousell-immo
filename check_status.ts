import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function check() {
    const { data, error } = await supabase
        .from('rental_transactions')
        .select('status')
        .limit(10);

    if (error) {
        console.log("Error:", error.message);
    } else {
        console.log("Statuses:", data.map(d => d.status));
    }
}

check();
