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

async function checkStatusLogic() {
    console.log("🔍 === STATUS LOGIC CHECK ===\n");

    const today = new Date();
    const currentDay = today.getDate();
    const selectedMonth = 12;
    const selectedYear = 2025;
    const isCurrentMonth = selectedMonth === (today.getMonth() + 1) && selectedYear === today.getFullYear();

    console.log(`Today: ${today.toISOString().split('T')[0]}`);
    console.log(`Current Day: ${currentDay}`);
    console.log(`Is Current Month: ${isCurrentMonth}\n`);

    // Get active leases
    const { data: leases } = await supabase
        .from("leases")
        .select("*")
        .eq("status", "active");

    // Get December transactions
    const { data: transactions } = await supabase
        .from("rental_transactions")
        .select("*")
        .eq("period_month", selectedMonth)
        .eq("period_year", selectedYear);

    console.log("=== STATUS SELON L'UI ===\n");

    let uiPaid = 0;
    let uiPending = 0;
    let uiOverdue = 0;

    leases?.forEach(lease => {
        const tx = transactions?.find(t => t.lease_id === lease.id);

        let displayStatus: 'paid' | 'pending' | 'overdue';

        if (tx) {
            // Transaction exists - use its status
            if (tx.status === 'paid') {
                displayStatus = 'paid';
            } else {
                // For pending transactions, check if overdue
                const billingDay = lease.billing_day || 5;
                if (isCurrentMonth && currentDay > billingDay) {
                    displayStatus = 'overdue';
                } else {
                    displayStatus = 'pending';
                }
            }
        } else {
            // No transaction - virtual row
            const billingDay = lease.billing_day || 5;
            if (isCurrentMonth && currentDay > billingDay) {
                displayStatus = 'overdue';
            } else {
                displayStatus = 'pending';
            }
        }

        console.log(`${lease.tenant_name} - ${lease.property_address || 'N/A'}`);
        console.log(`  Billing Day: ${lease.billing_day || 5}`);
        console.log(`  DB Status: ${tx?.status || 'NO TRANSACTION'}`);
        console.log(`  UI Display Status: ${displayStatus}`);
        console.log(`  Amount: ${lease.monthly_amount.toLocaleString()} FCFA\n`);

        if (displayStatus === 'paid') uiPaid++;
        else if (displayStatus === 'overdue') uiOverdue++;
        else uiPending++;
    });

    console.log("=== SUMMARY ===");
    console.log(`UI should show:`);
    console.log(`  ✅ Payés: ${uiPaid}`);
    console.log(`  ⏳ En attente: ${uiPending}`);
    console.log(`  🔴 En retard: ${uiOverdue}\n`);

    // Expected from screenshot
    console.log(`Screenshot shows:`);
    console.log(`  ✅ Payés: 1 (vert)`);
    console.log(`  ⏳ En attente: 3 (jaune)`);
    console.log(`  🔴 En retard: 2 (rouge)`);
}

checkStatusLogic().catch(console.error);
