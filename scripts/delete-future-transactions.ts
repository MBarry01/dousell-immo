import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function deleteFutureTransactions() {
    console.log("🗑️  === DELETING FUTURE TRANSACTIONS (2026+) ===\n");

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    console.log(`Current period: ${currentMonth}/${currentYear}\n`);

    // Find future transactions
    const { data: futureTransactions, error: fetchError } = await supabase
        .from("rental_transactions")
        .select(`
            id,
            amount_due,
            status,
            period_month,
            period_year,
            leases (
                tenant_name,
                property_address
            )
        `)
        .or(`period_year.gt.${currentYear},and(period_year.eq.${currentYear},period_month.gt.${currentMonth})`);

    if (fetchError) {
        console.error("❌ Error fetching future transactions:", fetchError);
        return;
    }

    console.log(`Found ${futureTransactions?.length || 0} future transactions:\n`);

    if (futureTransactions && futureTransactions.length > 0) {
        for (const tx of futureTransactions) {
            const lease = Array.isArray(tx.leases) ? tx.leases[0] : tx.leases;
            console.log(`   TX ${tx.id}`);
            console.log(`      Period: ${tx.period_month}/${tx.period_year}`);
            console.log(`      Amount: ${tx.amount_due?.toLocaleString()} FCFA`);
            console.log(`      Status: ${tx.status}`);
            console.log(`      Tenant: ${lease?.tenant_name || 'N/A'}`);
            console.log(`      Property: ${lease?.property_address || 'N/A'}\n`);
        }

        // Delete them
        const ids = futureTransactions.map(tx => tx.id);
        const { error: deleteError } = await supabase
            .from("rental_transactions")
            .delete()
            .in("id", ids);

        if (deleteError) {
            console.error("❌ Error deleting transactions:", deleteError);
            return;
        }

        console.log(`✅ Successfully deleted ${ids.length} future transaction(s)`);
    } else {
        console.log("✅ No future transactions found");
    }
}

deleteFutureTransactions().catch(console.error);
