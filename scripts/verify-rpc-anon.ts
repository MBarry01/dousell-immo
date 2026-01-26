
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// FORCE USE OF ANON KEY ONLY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log("Using Anon Key:", anonKey ? "YES (Found)" : "NO");

const supabase = createClient(supabaseUrl, anonKey);

async function testRpc() {
    console.log("--- TESTING RPC WITH ANON KEY ---");
    const { data, error } = await supabase.rpc('get_active_cities_and_types', { min_count: 1 });

    if (error) {
        console.error("RPC FAILED:", error);
    } else {
        console.log("RPC SUCCESS. Rows:", data?.length);
        if (data && data.length > 0) {
            const first = data[0];
            console.log("First City:", JSON.stringify(first.city));
            console.log("First City Codes:", first.city.split('').map((c: any) => c.charCodeAt(0)));
        }
    }
}

testRpc();
