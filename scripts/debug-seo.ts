
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { slugify } from '../lib/slugs';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Try to get service role key for better access if possible, or fall back to Anon
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

const log = (msg: any) => {
    const text = typeof msg === 'object' ? JSON.stringify(msg, null, 2) : String(msg);
    fs.appendFileSync('debug_output.txt', text + '\n');
    console.log(text);
};

async function debug() {
    fs.writeFileSync('debug_output.txt', ''); // Clear file
    log("--- DEBUGGING SEO SEARCH ---");

    // 1. Check RPC output
    log("\n1. Testing RPC 'get_active_cities_and_types'...");
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_active_cities_and_types');

    if (rpcError) {
        log({ error: "RPC Error", details: rpcError });
    } else {
        log(`RPC returned ${rpcData?.length} rows.`);
        const cities = rpcData as any[];
        // Log all cities to see what we have
        log("All Cities from RPC:");
        cities.forEach(c => {
            log(`City: "${c.city}", Slug: "${slugify(c.city)}"`);
        });
    }

    // 2. Check Raw Properties for Thies
    log("\n2. Checking Raw Properties for 'Thies'...");
    const { data: props, error: propsError } = await supabase
        .from('properties')
        .select('id, location')
        .ilike('location->>city', '%thies%')
        .limit(5);

    if (propsError) log({ error: "Properties Error", details: propsError });
    else {
        log("Found properties matching %thies%:");
        log(props);
    }
}

debug();
