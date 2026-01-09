
import { createClient } from "@supabase/supabase-js";
import { differenceInDays } from "date-fns";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);


import * as fs from 'fs';

const logFile = 'debug_output.txt';
fs.writeFileSync(logFile, "Starting check...\n");

function log(msg: string) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

async function checkReminders() {
    log("Checking reminders candidates...");
    const today = new Date();

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
      leases (
        id,
        billing_day,
        tenant_email,
        tenant_name
      )
    `)
        .neq("status", "paid")
        .gte("period_year", today.getFullYear() - 1);

    if (error) {
        log("Error fetching: " + JSON.stringify(error));
        return;
    }

    log(`Total unpaid/pending transactions found: ${transactions.length}`);

    let candidates = 0;

    for (const tx of transactions) {
        const leaseData = Array.isArray(tx.leases) ? tx.leases[0] : tx.leases;
        if (!leaseData) continue;

        const billingDay = leaseData.billing_day || 5;
        // Construct due date carefully
        const dueDate = new Date(tx.period_year, tx.period_month - 1, billingDay);

        const daysOverdue = differenceInDays(today, dueDate);

        log(`- Tx ${tx.id} (${leaseData.tenant_name}): Status=${tx.status}, ReminderSent=${tx.reminder_sent}, Due=${dueDate.toISOString().split('T')[0]}, Overdue=${daysOverdue} days`);

        if (tx.status !== 'paid' && !tx.reminder_sent && daysOverdue >= 5) {
            log(`  [CANDIDATE]`);
            candidates++;
        } else {
            log(`  [SKIPPED] Paid:${tx.status === 'paid'} Sent:${tx.reminder_sent} Overdue:${daysOverdue}`);
        }
    }

    log(`\nFound ${candidates} candidates ready for email.`);
}

checkReminders();
