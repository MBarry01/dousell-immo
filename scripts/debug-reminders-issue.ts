import { createClient } from "@supabase/supabase-js";
import { differenceInDays } from "date-fns";

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function debugReminders() {
    console.log("🔍 === DEBUG REMINDERS SYSTEM ===\n");

    const today = new Date();
    console.log(`📅 Today: ${today.toISOString()}\n`);

    const gracePeriodLimit = new Date();
    gracePeriodLimit.setDate(today.getDate() - 5);
    const gracePeriodLimitIso = gracePeriodLimit.toISOString();

    console.log(`⏰ Grace Period Limit (today - 5 days): ${gracePeriodLimitIso}\n`);

    // 1. Check if reminder_sent column exists
    console.log("1️⃣ Checking table structure...");
    const { data: columns, error: columnsError } = await supabase
        .from("rental_transactions")
        .select("*")
        .limit(1);

    if (columnsError) {
        console.error("❌ Error fetching table:", columnsError);
        return;
    }

    if (columns && columns.length > 0) {
        const firstRow = columns[0];
        const hasReminderSent = 'reminder_sent' in firstRow;
        console.log(`✅ Column 'reminder_sent' exists: ${hasReminderSent}`);
        if (!hasReminderSent) {
            console.log("⚠️  WARNING: Column 'reminder_sent' is MISSING! Run migration first.");
        }
        console.log("");
    }

    // 2. Get ALL transactions (unpaid + late)
    console.log("2️⃣ Fetching ALL unpaid transactions...");
    const { data: allUnpaid, error: allError } = await supabase
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
                property_id,
                owner_id
            )
        `)
        .neq("status", "paid");

    if (allError) {
        console.error("❌ Error:", allError);
        return;
    }

    console.log(`📊 Total unpaid transactions: ${allUnpaid?.length || 0}\n`);

    // 3. Filter manually to understand which ones should trigger reminders
    console.log("3️⃣ Analyzing each transaction:\n");

    let shouldSendReminder = 0;
    let alreadyReminded = 0;
    let notOverdueYet = 0;
    let noLeaseData = 0;

    if (allUnpaid) {
        for (const tx of allUnpaid) {
            const lease = Array.isArray(tx.leases) ? tx.leases[0] : tx.leases;

            if (!lease) {
                console.log(`❌ TX ${tx.id} - No lease data`);
                noLeaseData++;
                continue;
            }

            const billingDay = lease.billing_day || 5;
            const dueDate = new Date(tx.period_year, tx.period_month - 1, billingDay);
            const daysOverdue = differenceInDays(today, dueDate);

            const reminderSentValue = tx.reminder_sent ?? false;

            console.log(`📋 TX ${tx.id}:`);
            console.log(`   Status: ${tx.status}`);
            console.log(`   Period: ${tx.period_month}/${tx.period_year}`);
            console.log(`   Due Date: ${dueDate.toISOString().split('T')[0]}`);
            console.log(`   Days Overdue: ${daysOverdue}`);
            console.log(`   Reminder Sent: ${reminderSentValue}`);
            console.log(`   Tenant Email: ${lease.tenant_email || 'N/A'}`);

            if (daysOverdue >= 5) {
                if (reminderSentValue) {
                    console.log(`   ⚠️  Already reminded\n`);
                    alreadyReminded++;
                } else {
                    console.log(`   ✅ SHOULD SEND REMINDER\n`);
                    shouldSendReminder++;
                }
            } else {
                console.log(`   ⏳ Not overdue enough yet\n`);
                notOverdueYet++;
            }
        }
    }

    console.log("\n📊 === SUMMARY ===");
    console.log(`Total unpaid: ${allUnpaid?.length || 0}`);
    console.log(`Should send reminder: ${shouldSendReminder}`);
    console.log(`Already reminded: ${alreadyReminded}`);
    console.log(`Not overdue yet (<5 days): ${notOverdueYet}`);
    console.log(`No lease data: ${noLeaseData}`);

    // 4. Test the actual query used by the service
    console.log("\n4️⃣ Testing exact service query...");
    const { data: serviceQuery, error: _serviceError } = await supabase
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
                property_id,
                owner_id
            )
        `)
        .neq("status", "paid")
        .eq("reminder_sent", false)
        .lte("period_start", gracePeriodLimitIso)
        .gte("period_year", today.getFullYear() - 1);

    console.log(`Query returned: ${serviceQuery?.length || 0} transactions`);

    if (serviceQuery && serviceQuery.length > 0) {
        console.log("\n✅ Transactions that would be processed:");
        serviceQuery.forEach(tx => {
            const lease = Array.isArray(tx.leases) ? tx.leases[0] : tx.leases;
            console.log(`   - TX ${tx.id}: ${tx.period_month}/${tx.period_year}, Email: ${lease?.tenant_email || 'N/A'}`);
        });
    } else {
        console.log("\n❌ NO transactions match the service query criteria!");
        console.log("\nPossible reasons:");
        console.log("1. reminder_sent column might be NULL instead of false");
        console.log("2. period_start might be NULL or incorrect");
        console.log("3. Migration not applied yet");
    }
}

debugReminders().catch(console.error);
