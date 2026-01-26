
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function inspect() {
    console.log("--- INSPECTING THIES PROPERTIES ---");

    // 1. Fetch properties that look like Thies
    const { data: props, error } = await supabase
        .from('properties')
        .select('id, location')
        .or('location->>city.ilike.%thies%,location->>city.ilike.%thiès%')
        .limit(5);

    if (error) {
        console.error("Error fetching properties:", error);
        return;
    }

    console.log(`Found ${props?.length} properties.`);

    if (props && props.length > 0) {
        const p = props[0];
        const city = p.location?.city;
        console.log("First Property ID:", p.id);
        console.log("City Value (Raw):", `'${city}'`);
        console.log("City Value (JSON):", JSON.stringify(city));
        console.log("City Length:", city.length);
        console.log("Char Codes:", city.split('').map((c: string) => c.charCodeAt(0)));

        // Test matching queries from JS
        console.log("\n--- TESTING MATCHING ---");

        const testValues = [
            "Thiès Region",
            "thiès region",
            "Thies Region",
            "thies region",
            "Thiès region"
        ];

        for (const val of testValues) {
            const { count, error: matchError } = await supabase
                .from('properties')
                .select('*', { count: 'exact', head: true })
                .eq('id', p.id)
                .ilike('location->>city', val);

            console.log(`Match ILIKE '${val}': ${matchError ? 'Error' : count === 1 ? 'YES' : 'NO'}`);
        }
    } else {
        console.log("No properties found with broad search!");
    }
}

inspect();
