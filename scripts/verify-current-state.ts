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

async function verifyState() {
    console.log("🔍 === CURRENT STATE VERIFICATION ===\n");

    const today = new Date();
    console.log(`📅 Today: ${today.toISOString().split('T')[0]}`);
    console.log(`📅 Today full: ${today.toISOString()}\n`);

    // Get all unpaid transactions for December 2025
    const { data: decTransactions, error } = await supabase
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
                tenant_name,
                property_address
            )
        `)
        .eq("period_month", 12)
        .eq("period_year", 2025)
        .neq("status", "paid");

    if (error) {
        console.error("❌ Error:", error);
        return;
    }

    console.log(`📊 Unpaid December 2025 transactions: ${decTransactions?.length || 0}\n`);

    if (decTransactions && decTransactions.length > 0) {
        for (const tx of decTransactions) {
            const lease = Array.isArray(tx.leases) ? tx.leases[0] : tx.leases;

            if (!lease) {
                console.log(`❌ TX ${tx.id} - No lease data\n`);
                continue;
            }

            const billingDay = lease.billing_day || 5;
            const dueDate = new Date(tx.period_year, tx.period_month - 1, billingDay);
            const daysOverdue = differenceInDays(today, dueDate);

            console.log(`📋 Transaction ${tx.id}`);
            console.log(`   Montant: ${tx.amount_due?.toLocaleString()} FCFA`);
            console.log(`   Locataire: ${lease.tenant_name}`);
            console.log(`   Bien: ${lease.property_address}`);
            console.log(`   Email: ${lease.tenant_email || 'N/A'}`);
            console.log(`   Billing Day: ${billingDay}`);
            console.log(`   Due Date: ${dueDate.toISOString().split('T')[0]}`);
            console.log(`   Period Start (DB): ${tx.period_start || 'NULL'}`);
            console.log(`   Days Overdue: ${daysOverdue}`);
            console.log(`   Reminder Sent: ${tx.reminder_sent}`);
            console.log(`   Status: ${tx.status}`);

            if (daysOverdue >= 5) {
                console.log(`   ✅ SHOULD BE REMINDED (${daysOverdue} days >= 5)`);
            } else if (daysOverdue >= 1) {
                console.log(`   ⚠️  OVERDUE but < 5 days (showing red in UI)`);
            } else {
                console.log(`   ⏳ Not overdue yet`);
            }
            console.log("");
        }
    }

    // Check the actual query that reminders-service.ts uses
    console.log("\n🔍 === TESTING ACTUAL SERVICE QUERY ===\n");

    const gracePeriodLimit = new Date();
    gracePeriodLimit.setDate(today.getDate() - 5);
    const gracePeriodLimitIso = gracePeriodLimit.toISOString();

    console.log(`Grace Period Limit: ${gracePeriodLimitIso}\n`);

    const { data: serviceQuery, error: sqError } = await supabase
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
        .neq("status", "paid")
        .eq("reminder_sent", false)
        .lte("period_start", gracePeriodLimitIso)
        .gte("period_year", today.getFullYear() - 1);

    console.log(`Service query would return: ${serviceQuery?.length || 0} transactions`);

    if (serviceQuery && serviceQuery.length > 0) {
        console.log("\nTransactions that would be processed:");
        serviceQuery.forEach(tx => {
            const lease = Array.isArray(tx.leases) ? tx.leases[0] : tx.leases;
            console.log(`   - ${tx.amount_due?.toLocaleString()} FCFA (${tx.period_month}/${tx.period_year})`);
            console.log(`     period_start: ${tx.period_start}`);
            console.log(`     billing_day: ${lease?.billing_day || 5}\n`);
        });
    }
}

verifyState().catch(console.error);
