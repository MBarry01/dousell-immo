import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
import fs from 'fs';

loadEnvConfig(process.cwd());

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkDates() {
    const sources = ['CoinAfrique', 'Expat-Dakar', 'Facebook Marketplace'];
    const res = [];

    for (const source of sources) {
        const { data } = await supabase
            .from('external_listings')
            .select('last_seen_at, source_url')
            .eq('source_site', source)
            .order('last_seen_at', { ascending: false })
            .limit(1);


        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 14);
        const { count } = await supabase
            .from('external_listings')
            .select('*', { count: 'exact', head: true })
            .eq('source_site', source)
            .gt('last_seen_at', cutoff.toISOString());

        res.push({
            source,
            maxLastSeenAt: data && data.length > 0 ? data[0].last_seen_at : null,
            validCount: count
        });
    }
    fs.writeFileSync('dates.json', JSON.stringify(res, null, 2));
}

checkDates();
