import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('SUPABASE URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('SUPABASE KEY:', supabaseAnonKey ? 'Set' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const FRESHNESS_TTL_DAYS = 14;

async function run() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - FRESHNESS_TTL_DAYS);
    console.log('Cutoff date:', cutoffDate.toISOString());

    const { data, error } = await supabase
        .from('external_listings')
        .select('*')
        .gt('last_seen_at', cutoffDate.toISOString())
        .not('image_url', 'is', null)
        .neq('image_url', '')
        .ilike('type', '%location%')
        .range(0, 9);

    if (error) {
        console.error('Supabase Error:', error);
        return;
    }

    console.log(`Found ${data.length} listings!`);
    if (data.length > 0) {
        console.log('First listing:', data[0].title, '| Image:', data[0].image_url);
    }
}
run();
