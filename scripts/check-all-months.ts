import { createClient } from "@supabase/supabase-js";
import { differenceInDays } from "date-fns";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function checkAllMonths() {
    console.log("🔍 === CHECKING ALL TRANSACTIONS (ALL MONTHS) ===\n");

    const today = new Date();

    // Get ALL transactions regardless of payment status
    const { data: allTx, error } = await supabase
        .from("rental_transactions")
        .select(`
            id,
            amount_due,
            status,
            period_month,
            period_year,
            period_start,
            reminder_sent,
            leases (
                billing_day,
                tenant_name,
                property_address,
                owner_id
            )
        `)
        .order("period_year", { ascending: false })
        .order("period_month", { ascending: false });

    if (error) {
        console.error("❌ Error:", error);
        return;
    }

    console.log(`📊 Total transactions: ${allTx?.length || 0}\n`);

    // Group by status
    const byStatus: Record<string, any[]> = {};
    allTx?.forEach(tx => {
        const status = tx.status || 'unknown';
        if (!byStatus[status]) byStatus[status] = [];
        byStatus[status].push(tx);
    });

    console.log("📊 By Status:");
    Object.entries(byStatus).forEach(([status, txs]) => {
        console.log(`   ${status}: ${txs.length}`);
    });

    console.log("\n🔍 Looking for 200k and 58 Rue de Mouzaïa...\n");

    const mouzaia = allTx?.filter(tx => {
        const lease = Array.isArray(tx.leases) ? tx.leases[0] : tx.leases;
        return lease?.property_address?.toLowerCase().includes('mouzaïa') ||
               lease?.property_address?.toLowerCase().includes('mouzaia');
    });

    if (mouzaia && mouzaia.length > 0) {
        console.log(`Found ${mouzaia.length} transactions for Mouzaïa:\n`);
        for (const tx of mouzaia) {
            const lease = Array.isArray(tx.leases) ? tx.leases[0] : tx.leases;
            const billingDay = lease?.billing_day || 5;
            const dueDate = new Date(tx.period_year, tx.period_month - 1, billingDay);
            const daysOverdue = differenceInDays(today, dueDate);

            console.log(`   TX ${tx.id}`);
            console.log(`      Amount: ${tx.amount_due?.toLocaleString()} FCFA`);
            console.log(`      Period: ${tx.period_month}/${tx.period_year}`);
            console.log(`      Status: ${tx.status}`);
            console.log(`      Days overdue: ${daysOverdue}`);
            console.log(`      Reminded: ${tx.reminder_sent}`);
            console.log(`      Property: ${lease?.property_address}\n`);
        }
    }

    // Check for 200k amounts
    const largeAmounts = allTx?.filter(tx => tx.amount_due && tx.amount_due >= 180000);

    if (largeAmounts && largeAmounts.length > 0) {
        console.log(`\nFound ${largeAmounts.length} transactions >= 180k:\n`);
        for (const tx of largeAmounts) {
            const lease = Array.isArray(tx.leases) ? tx.leases[0] : tx.leases;
            console.log(`   ${tx.amount_due?.toLocaleString()} FCFA - ${tx.period_month}/${tx.period_year} - ${tx.status}`);
            console.log(`      ${lease?.property_address || 'N/A'}\n`);
        }
    }
}

checkAllMonths().catch(console.error);
