import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function checkLateStatus() {
    console.log("🔍 === CHECKING 'LATE' STATUS TRANSACTIONS ===\n");

    // Get all transactions with 'late' status
    const { data: lateTransactions, error } = await supabase
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
                id,
                billing_day,
                tenant_email,
                tenant_name
            )
        `)
        .eq("status", "late");

    if (error) {
        console.error("❌ Error:", error);
        return;
    }

    console.log(`📊 Found ${lateTransactions?.length || 0} transactions with status='late'\n`);

    if (lateTransactions && lateTransactions.length > 0) {
        for (const tx of lateTransactions) {
            const lease = Array.isArray(tx.leases) ? tx.leases[0] : tx.leases;
            console.log(`Transaction ${tx.id}:`);
            console.log(`  Period: ${tx.period_month}/${tx.period_year}`);
            console.log(`  Status: ${tx.status}`);
            console.log(`  Amount: ${tx.amount_due} FCFA`);
            console.log(`  Period Start: ${tx.period_start}`);
            console.log(`  Reminder Sent: ${tx.reminder_sent}`);
            console.log(`  Tenant: ${lease?.tenant_name || 'N/A'}`);
            console.log(`  Email: ${lease?.tenant_email || 'N/A'}\n`);
        }
    }

    // Also check for 'pending' status
    console.log("\n🔍 === CHECKING ALL STATUS VALUES ===\n");
    const { data: allTx } = await supabase
        .from("rental_transactions")
        .select("status")
        .neq("status", "paid");

    const statusCounts: Record<string, number> = {};
    allTx?.forEach(tx => {
        statusCounts[tx.status] = (statusCounts[tx.status] || 0) + 1;
    });

    console.log("Status distribution:");
    Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
    });
}

checkLateStatus().catch(console.error);
