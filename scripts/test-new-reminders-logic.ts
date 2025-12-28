import { createClient } from "@supabase/supabase-js";
import { internalProcessReminders } from "@/lib/reminders-service";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testNewLogic() {
    console.log("🧪 === TESTING NEW REMINDERS LOGIC ===\n");

    // Run the reminders service
    const result = await internalProcessReminders(supabase);

    console.log("\n📊 === RESULT ===");
    console.log(`Count: ${result.count}`);
    console.log(`Message: ${result.message}`);

    if (result.errors && result.errors.length > 0) {
        console.log(`\n❌ Errors (${result.errors.length}):`);
        result.errors.forEach((err, idx) => {
            console.log(`${idx + 1}. ${JSON.stringify(err, null, 2)}`);
        });
    }

    // Check the reminder_sent flags
    console.log("\n🔍 === CHECKING REMINDER FLAGS ===\n");

    const { data: allUnpaid } = await supabase
        .from("rental_transactions")
        .select(`
            id,
            amount_due,
            period_month,
            period_year,
            reminder_sent,
            leases (
                billing_day,
                tenant_name
            )
        `)
        .neq("status", "paid")
        .eq("period_month", 12)
        .eq("period_year", 2025);

    if (allUnpaid) {
        for (const tx of allUnpaid) {
            const lease = Array.isArray(tx.leases) ? tx.leases[0] : tx.leases;
            console.log(`${tx.amount_due?.toLocaleString()} FCFA (${lease?.tenant_name})`);
            console.log(`  Billing Day: ${lease?.billing_day || 5}`);
            console.log(`  Reminder Sent: ${tx.reminder_sent ? '✅ YES' : '❌ NO'}\n`);
        }
    }
}

testNewLogic().catch(console.error);
