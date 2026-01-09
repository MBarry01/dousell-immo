
import { createClient } from "@supabase/supabase-js";
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const logFile = 'debug_ghost.txt';
fs.writeFileSync(logFile, "Starting Ghost Hunt...\n");

function log(msg: string) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

async function findGhostOverdue() {
    log("Fetching active leases...");
    const { data: leases, error: leaseError } = await supabase
        .from('leases')
        .select('*')
        .eq('status', 'active'); // Only active leases count in UI

    if (leaseError) { log("Error leases: " + JSON.stringify(leaseError)); return; }

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();

    log(`Checking against Current Date: ${currentDay}/${currentMonth}/${currentYear}`);

    // Fetch transactions for THIS month
    const { data: transactions, error: txError } = await supabase
        .from('rental_transactions')
        .select('*')
        .eq('period_month', currentMonth)
        .eq('period_year', currentYear);

    if (txError) { log("Error tx: " + JSON.stringify(txError)); return; }

    let ghostCount = 0;

    log(`Scanning ${leases.length} active leases...`);

    for (const lease of leases) {
        // Find transaction for this lease this month
        const tx = transactions.find(t => t.lease_id === lease.id);
        const billingDay = lease.billing_day || 5;

        // UI Logic: 
        // If NO transaction exists AND currentDay > billingDay => OVERDUE (Ghost)
        // If Transaction exists AND status != paid AND currentDay > billingDay => OVERDUE (Real)

        if (!tx) {
            // Potential Ghost
            if (currentDay > billingDay) {
                log(`[GHOST FOUND] Lease: ${lease.tenant_name} (ID: ${lease.id})`);
                log(`   -> Active Lease but NO Transaction for ${currentMonth}/${currentYear}`);
                log(`   -> Billing Day: ${billingDay}, Today: ${currentDay} (Overdue!)`);
                ghostCount++;
            } else {
                log(`[PENDING GHOST] Lease: ${lease.tenant_name}`);
                log(`   -> No Transaction yet, but not late yet (Billing: ${billingDay})`);
            }
        } else {
            // Real transaction exists, check if overdue
            // This corresponds to what we found earlier (Valid overdue)
            if (tx.status !== 'paid' && currentDay > billingDay) {
                // confirm it matches our previous findings
                // log(`[REAL OVERDUE] ${lease.tenant_name}`);
            }
        }
    }

    log(`\nFound ${ghostCount} GHOST overdue items (UI counts them, Backend misses them).`);
}

findGhostOverdue();
