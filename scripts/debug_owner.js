
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ownerId = '8f06546d-18bb-4327-abdf-6a9401f396c8';

async function debug() {
    console.log(`--- DEBUG FOR OWNER ${ownerId} ---`);

    // 1. Leases
    const { data: leases } = await supabase.from('leases').select('id, tenant_name, status').eq('owner_id', ownerId);
    console.log(`\nLEASES (${leases?.length || 0}):`);
    leases?.forEach(l => console.log(`  - ${l.tenant_name} (ID: ${l.id}) [${l.status}]`));

    // 2. Transactions
    const { data: txs } = await supabase.from('rental_transactions').select('id, lease_id, status, period_month, period_year')
        .eq('status', 'paid')
        .limit(10);
    console.log(`\nPAID TRANSACTIONS (Top 10):`);
    txs?.forEach(t => console.log(`  - TX: ${t.id} | Lease: ${t.lease_id} | ${t.period_month}/${t.period_year}`));

    // 3. User Documents
    const { data: docs } = await supabase.from('user_documents').select('*')
        .or(`user_id.eq.${ownerId},lease_id.in.(${leases?.map(l => l.id).join(',') || ''})`)
        .order('created_at', { ascending: false })
        .limit(20);

    console.log(`\nUSER DOCUMENTS (Top 20):`);
    docs?.forEach(d => {
        console.log(`  - Doc: "${d.name}" (ID: ${d.id})`);
        console.log(`    Type: ${d.type} | Entity: ${d.entity_type}:${d.entity_id}`);
        console.log(`    Path: ${d.file_path}`);
        console.log(`    LeaseID: ${d.lease_id}`);
    });
}

debug();
