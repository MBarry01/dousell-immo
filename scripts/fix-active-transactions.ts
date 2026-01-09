
import { createClient } from "@supabase/supabase-js";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);


import * as fs from 'fs';
const logFile = 'fix_log.txt';
fs.writeFileSync(logFile, "Starting fix...\n");

function log(msg: string) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

async function generateMissingTransactions() {
    log("Generating missing transactions for CURRENT MONTH...");

    // Hardcoded for safety based on our context: JAN 2026
    const periodMonth = 1;
    const periodYear = 2026;
    const periodStart = `${periodYear}-${String(periodMonth).padStart(2, '0')}-01`;

    // 1. Get Active Leases
    const { data: leases, error: leaseError } = await supabase
        .from('leases')
        .select('*')
        .eq('status', 'active');

    if (leaseError) { log("Error leases: " + JSON.stringify(leaseError)); return; }

    log(`Found ${leases.length} active leases.`);

    // 2. Get Existing Transactions for this month
    const { data: transactions, error: txError } = await supabase
        .from('rental_transactions')
        .select('*')
        .eq('period_month', periodMonth)
        .eq('period_year', periodYear);

    if (txError) { log("Error tx: " + JSON.stringify(txError)); return; }

    log(`Found ${transactions.length} existing transactions for ${periodMonth}/${periodYear}.`);

    let createdCount = 0;

    for (const lease of leases) {
        const exists = transactions.find(t => t.lease_id === lease.id);

        if (!exists) {
            log(`Creating transaction for ${lease.tenant_name} (${lease.monthly_amount} FCFA)...`);

            const { error: insertError } = await supabase
                .from('rental_transactions')
                .insert({
                    lease_id: lease.id,
                    amount_due: lease.monthly_amount,
                    // amount_paid: 0, // Column does not exist
                    status: 'pending',
                    period_month: periodMonth,
                    period_year: periodYear,
                    period_start: periodStart,
                    reminder_sent: false,
                    // owner_id: lease.owner_id // Column does not exist
                });

            if (insertError) {
                log(`Failed to create for ${lease.tenant_name}: ${JSON.stringify(insertError)}`);
            } else {
                createdCount++;
                log(`Success.`);
            }
        } else {
            log(`Skipping ${lease.tenant_name} (Already exists)`);
        }
    }

    log(`\nOperation complete. Created ${createdCount} missing transactions.`);
}

generateMissingTransactions();
