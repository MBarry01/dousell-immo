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

async function analyzeAll() {
    console.log("🔍 === ALL UNPAID TRANSACTIONS ANALYSIS ===\n");

    const today = new Date();
    console.log(`Today: ${today.toISOString().split('T')[0]}\n`);

    const { data: allUnpaid, error } = await supabase
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
                property_address
            )
        `)
        .neq("status", "paid")
        .order("period_year", { ascending: false })
        .order("period_month", { ascending: false });

    if (error) {
        console.error("❌ Error:", error);
        return;
    }

    console.log(`📊 Total unpaid transactions: ${allUnpaid?.length || 0}\n`);

    let shouldRemind = 0;
    let alreadyReminded = 0;
    let tooRecent = 0;

    if (allUnpaid) {
        for (const tx of allUnpaid) {
            const lease = Array.isArray(tx.leases) ? tx.leases[0] : tx.leases;

            if (!lease) continue;

            const billingDay = lease.billing_day || 5;
            const dueDate = new Date(tx.period_year, tx.period_month - 1, billingDay);
            const daysOverdue = differenceInDays(today, dueDate);

            const shouldSend = daysOverdue >= 5 && !tx.reminder_sent;
            const category = shouldSend ? '✅ SHOULD REMIND' :
                            tx.reminder_sent ? '⚠️  ALREADY REMINDED' :
                            '⏳ TOO RECENT';

            if (shouldSend) shouldRemind++;
            else if (tx.reminder_sent) alreadyReminded++;
            else tooRecent++;

            console.log(`${category}`);
            console.log(`   TX: ${tx.id}`);
            console.log(`   Amount: ${tx.amount_due?.toLocaleString() || 'N/A'} FCFA`);
            console.log(`   Period: ${tx.period_month}/${tx.period_year}`);
            console.log(`   Status: ${tx.status}`);
            console.log(`   Due: ${dueDate.toISOString().split('T')[0]} (${daysOverdue} days ago)`);
            console.log(`   Reminded: ${tx.reminder_sent}`);
            console.log(`   Property: ${lease.property_address || 'N/A'}`);
            console.log(`   Tenant: ${lease.tenant_name}\n`);
        }
    }

    console.log("\n📊 === SUMMARY ===");
    console.log(`Should send reminders: ${shouldRemind}`);
    console.log(`Already reminded: ${alreadyReminded}`);
    console.log(`Too recent (<5 days): ${tooRecent}`);

    if (shouldRemind === 0) {
        console.log("\n💡 EXPLANATION:");
        console.log("The UI shows 'Retard' (red badge) for transactions overdue by ANY amount,");
        console.log("but the reminder system only sends emails after 5+ days overdue.");
        console.log("\nThis is working as designed: 'Relance J+5' = reminders start on day 5.");
    }
}

analyzeAll().catch(console.error);
