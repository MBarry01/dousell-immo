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

async function findTransaction() {
    console.log("🔍 === SEARCHING FOR 200k TRANSACTION ===\n");

    const { data: allTransactions, error } = await supabase
        .from("rental_transactions")
        .select(`
            id,
            amount_due,
            status,
            period_month,
            period_year,
            period_start,
            period_end,
            reminder_sent,
            created_at,
            leases (
                id,
                billing_day,
                tenant_email,
                tenant_name,
                property_address,
                monthly_amount
            )
        `)
        .gte("amount_due", 195000)
        .lte("amount_due", 205000)
        .eq("period_month", 12)
        .eq("period_year", 2025);

    if (error) {
        console.error("❌ Error:", error);
        return;
    }

    console.log(`Found ${allTransactions?.length || 0} transactions ~200k in Dec 2025\n`);

    const today = new Date();

    if (allTransactions) {
        for (const tx of allTransactions) {
            const lease = Array.isArray(tx.leases) ? tx.leases[0] : tx.leases;

            console.log(`\n📋 Transaction ${tx.id}`);
            console.log(`   Amount Due: ${tx.amount_due} FCFA`);
            console.log(`   Status: ${tx.status}`);
            console.log(`   Period: ${tx.period_month}/${tx.period_year}`);
            console.log(`   Period Start: ${tx.period_start}`);
            console.log(`   Period End: ${tx.period_end}`);
            console.log(`   Reminder Sent: ${tx.reminder_sent}`);
            console.log(`   Created At: ${tx.created_at}`);

            if (lease) {
                console.log(`   Billing Day: ${lease.billing_day || 5}`);
                console.log(`   Property: ${lease.property_address}`);
                console.log(`   Tenant: ${lease.tenant_name}`);

                const billingDay = lease.billing_day || 5;
                const dueDate = new Date(tx.period_year, tx.period_month - 1, billingDay);
                const daysOverdue = differenceInDays(today, dueDate);

                console.log(`   Calculated Due Date: ${dueDate.toISOString().split('T')[0]}`);
                console.log(`   Days Overdue: ${daysOverdue}`);
                console.log(`   Should Send Reminder (>= 5 days): ${daysOverdue >= 5 ? 'YES ✅' : 'NO ❌'}`);
            }
        }
    }

    // Also find the 18k one
    console.log("\n\n🔍 === SEARCHING FOR 18k TRANSACTION ===\n");

    const { data: smallTx } = await supabase
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
                property_address
            )
        `)
        .gte("amount_due", 15000)
        .lte("amount_due", 20000)
        .eq("period_month", 12)
        .eq("period_year", 2025);

    if (smallTx) {
        for (const tx of smallTx) {
            const lease = Array.isArray(tx.leases) ? tx.leases[0] : tx.leases;

            console.log(`\n📋 Transaction ${tx.id}`);
            console.log(`   Amount Due: ${tx.amount_due} FCFA`);
            console.log(`   Status: ${tx.status}`);
            console.log(`   Reminder Sent: ${tx.reminder_sent}`);

            if (lease) {
                const billingDay = lease.billing_day || 5;
                const dueDate = new Date(tx.period_year, tx.period_month - 1, billingDay);
                const daysOverdue = differenceInDays(today, dueDate);

                console.log(`   Days Overdue: ${daysOverdue}`);
                console.log(`   Should Send: ${daysOverdue >= 5 ? 'YES ✅' : 'NO ❌'}`);
            }
        }
    }
}

findTransaction().catch(console.error);
