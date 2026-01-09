
import { createClient } from "@supabase/supabase-js";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMassamba() {
    console.log("Verifying Massamba Dikhité transaction...");

    // Find Lease ID first
    const { data: leases } = await supabase
        .from('leases')
        .select('id, tenant_name')
        .ilike('tenant_name', '%Massamba%');

    if (!leases || leases.length === 0) {
        console.log("Lease not found?");
        return;
    }

    const lease = leases[0];
    console.log(`Found Lease: ${lease.tenant_name} (${lease.id})`);

    // Check Transaction
    const { data: tx } = await supabase
        .from('rental_transactions')
        .select('*')
        .eq('lease_id', lease.id)
        .eq('period_month', 1)
        .eq('period_year', 2026);

    if (tx && tx.length > 0) {
        console.log(`✅ Transaction found for Jan 2026! ID: ${tx[0].id}, Status: ${tx[0].status}`);
    } else {
        console.log(`❌ No transaction found for Jan 2026.`);
    }
}

verifyMassamba();
