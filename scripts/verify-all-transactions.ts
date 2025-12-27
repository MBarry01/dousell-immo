import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

(async () => {
    const { data } = await supabase
        .from('rental_transactions')
        .select('period_month, period_year, status, amount_due, leases(tenant_name)')
        .in('period_month', [12, 1])
        .in('period_year', [2025, 2026])
        .order('period_year')
        .order('period_month');

    console.log('\n📊 RÉCAPITULATIF DES TRANSACTIONS:\n');

    const dec2025 = data?.filter(t => t.period_month === 12 && t.period_year === 2025) || [];
    const jan2026 = data?.filter(t => t.period_month === 1 && t.period_year === 2026) || [];

    console.log('✅ DÉCEMBRE 2025 (payé):');
    dec2025.forEach((t: { leases?: { tenant_name?: string }; amount_due: number; status: string }, i) =>
        console.log(`   ${i+1}. ${t.leases?.tenant_name} - ${t.amount_due} FCFA (${t.status})`)
    );

    console.log('\n🆕 JANVIER 2026 (en attente):');
    jan2026.forEach((t: { leases?: { tenant_name?: string }; amount_due: number; status: string }, i) =>
        console.log(`   ${i+1}. ${t.leases?.tenant_name} - ${t.amount_due} FCFA (${t.status})`)
    );

    console.log('\n');
})();
