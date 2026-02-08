import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const LEASE_ID = '836025ed-bc27-454b-ae4d-5dd3f983b89f';

async function checkAndFixGuarantee() {
    const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Get all transactions for this lease
    const { data: transactions, error } = await client
        .from('rental_transactions')
        .select('*')
        .eq('lease_id', LEASE_ID)
        .order('period_year')
        .order('period_month');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`\n=== Transactions for lease ${LEASE_ID} ===\n`);
    transactions?.forEach((t, i) => {
        const label = t.period_month === 0 ? 'GARANTIE' : `Mois ${t.period_month}`;
        console.log(`${i + 1}. ${label}/${t.period_year} | ${t.amount_due} FCFA | ${t.status} | paid_at: ${t.paid_at || 'null'}`);
    });

    // 2. Find the guarantee (month 0) if pending
    const guarantee = transactions?.find(t => t.period_month === 0 && t.status !== 'paid');

    if (guarantee) {
        console.log(`\n⚠️ Garantie trouvée en attente: ${guarantee.id}`);
        console.log('Mise à jour vers "paid"...\n');

        const { error: updateError } = await client
            .from('rental_transactions')
            .update({
                status: 'paid',
                paid_at: new Date().toISOString(),
                payment_method: 'manual',
                payment_ref: 'MANUAL_FIX_GARANTIE',
                amount_paid: guarantee.amount_due
            })
            .eq('id', guarantee.id);

        if (updateError) {
            console.error('❌ Erreur mise à jour:', updateError);
        } else {
            console.log('✅ Garantie marquée comme payée!');
        }
    } else {
        console.log('\n✅ Aucune garantie en attente.');
    }

    // Write to file
    fs.writeFileSync('LEASE_836025.txt', JSON.stringify(transactions, null, 2));
    console.log('\nDétails écrits dans LEASE_836025.txt');
}

checkAndFixGuarantee();
