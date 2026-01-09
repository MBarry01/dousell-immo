
import { createClient } from "@supabase/supabase-js";
import { differenceInDays } from "date-fns";
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const logFile = 'debug_overdue.txt';
fs.writeFileSync(logFile, "Starting check...\n");

function log(msg: string) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

async function checkAllOverdue() {
    log("Checking ALL overdue transactions...");
    const today = new Date();

    const { data: transactions, error } = await supabase
        .from("rental_transactions")
        .select(`
      id,
      amount_due,
      status,
      period_month,
      period_year,
      reminder_sent,
      leases (
        id,
        billing_day,
        tenant_name
      )
    `)
        .neq("status", "paid")
        .gte("period_year", 2024); // Check recent years

    if (error) { log("Error: " + JSON.stringify(error)); return; }

    let uiOverdueCount = 0;
    let mailerCandidateCount = 0;

    for (const tx of transactions) {
        // @ts-ignore
        const lease = Array.isArray(tx.leases) ? tx.leases[0] : tx.leases;
        if (!lease) continue;

        const billingDay = lease.billing_day || 5;
        const dueDate = new Date(tx.period_year, tx.period_month - 1, billingDay);
        const daysOverdue = differenceInDays(today, dueDate);

        // UI Logic: Overdue if today > due date
        const isOverdueUI = daysOverdue > 0;

        // Mailer Logic: Overdue >= 5 days
        const isMailerCandidate = daysOverdue >= 5;

        if (isOverdueUI) {
            uiOverdueCount++;
            log(`[OVERDUE UI] ${lease.tenant_name} - Due: ${dueDate.toISOString().split('T')[0]} - Late by ${daysOverdue} days`);

            if (isMailerCandidate) {
                log(`   -> [MAILER CANDIDATE] (>= 5 days)`);
                mailerCandidateCount++;
            } else {
                log(`   -> [IGNORED BY MAILER] (< 5 days)`);
            }
        }
    }

    log(`\nSummary:`);
    log(`UI Badge Count (Total Overdue): ${uiOverdueCount}`);
    log(`Mailer Candidates (Overdue >= 5 days): ${mailerCandidateCount}`);

    // Check specifically for Jan 2026
    const curYear = today.getFullYear();
    const curMonth = today.getMonth() + 1;

    const { data: currentTx } = await supabase
        .from("rental_transactions")
        .select('*')
        .eq('period_year', curYear)
        .eq('period_month', curMonth);

    if (currentTx && currentTx.length > 0) {
        log(`\nTransactions for current month (${curMonth}/${curYear}): ${currentTx.length}`);
        currentTx.forEach(t => log(` - Tx ${t.id} Status: ${t.status}`));
    } else {
        log(`\nNo transactions found for current month (${curMonth}/${curYear}). This might be why they are not counted as 'candidates' but might be 'ghost overdue' in UI if leases exist.`);
    }
}

checkAllOverdue();
