import { createAdminClient } from "../lib/supabase-admin";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
    console.log("🕵️ DIAGNOSING TRANSACTIONS...");

    const supabase = createAdminClient();

    // Fetch last 10 transactions without strict filters
    const { data: transactions, error } = await supabase
        .from("rental_transactions")
        .select(`
      id,
      amount_due,
      status,
      period_month,
      period_year,
      period_start,
      reminder_sent,
      created_at,
      leases ( tenant_name )
    `)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${transactions?.length} recent transactions:`);

    transactions?.forEach(tx => {
        // @ts-ignore
        const tenantName = tx.leases?.tenant_name || "Unknown";
        console.log(`\nID: ${tx.id} | Tenant: ${tenantName}`);
        console.log(`   Status: ${tx.status}`);
        console.log(`   Reminder Sent: ${tx.reminder_sent}`);
        console.log(`   Period: ${tx.period_month}/${tx.period_year}`);
        console.log(`   Period Start: ${tx.period_start} (Type: ${typeof tx.period_start})`);
    });
}

main();
