
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function audit() {
    console.log("--- AUDIT USER DOCUMENTS START ---");
    const { data: docs, error: docsError } = await supabase
        .from('user_documents')
        .select('id, name, type, entity_type, entity_id, lease_id, category')
        .order('created_at', { ascending: false })
        .limit(30);

    if (docsError) {
        console.error("Error fetching docs:", docsError);
        return;
    }

    console.log(`Found ${docs?.length || 0} documents.`);

    for (const doc of docs || []) {
        console.log(`Doc: "${doc.name}" | ID: ${doc.id}`);
        console.log(`  Type: ${doc.type} | EntityType: ${doc.entity_type} | Category: ${doc.category}`);
        console.log(`  IDs: lease_id=${doc.lease_id}, entity_id=${doc.entity_id}`);

        if (doc.lease_id) {
            const { data: lease } = await supabase.from('leases').select('id, tenant_name').eq('id', doc.lease_id).maybeSingle();
            if (!lease) {
                console.log(`  ⚠️ LEASE ID ${doc.lease_id} NOT FOUND IN LEASES TABLE`);
            } else {
                console.log(`  ✅ Lease found: ${lease.tenant_name}`);
            }
        } else {
            console.log(`  ℹ️ No lease_id`);
        }

        if (doc.entity_type === 'payment' && doc.entity_id) {
            const { data: tx } = await supabase.from('rental_transactions').select('id, status').eq('id', doc.entity_id).maybeSingle();
            if (!tx) {
                console.log(`  ⚠️ TRANSACTION ID ${doc.entity_id} NOT FOUND`);
            } else {
                console.log(`  ✅ Transaction found: status=${tx.status}`);
            }
        }
        console.log("-".repeat(40));
    }
    console.log("--- AUDIT USER DOCUMENTS END ---");
}

audit();
