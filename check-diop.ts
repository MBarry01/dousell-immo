import { createClient } from "@supabase/supabase-js";
import * as fs from 'fs';

// Load env vars
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data: leases } = await supabase.from('leases').select('id, tenant_name, start_date').ilike('tenant_name', '%diop%');

    if (leases && leases.length > 0) {
        const leaseId = leases[0].id;
        const { data: txs } = await supabase.from('rental_transactions')
            .select('id, period_month, period_year, status, amount_due, amount_paid')
            .eq('lease_id', leaseId)
            .order('period_year', { ascending: false })
            .order('period_month', { ascending: false });

        const output = { leases, txs };
        fs.writeFileSync('diop-debug.json', JSON.stringify(output, null, 2), 'utf-8');
    }
}

main().catch(console.error);
