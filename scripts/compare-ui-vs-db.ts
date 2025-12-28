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

async function compareUiVsDb() {
    console.log("🔍 === UI VS DATABASE COMPARISON ===\n");

    const today = new Date();
    const currentDay = today.getDate();
    const selectedMonth = 12;
    const selectedYear = 2025;

    console.log(`Current Date: ${today.toISOString().split('T')[0]}`);
    console.log(`Viewing Month: ${selectedMonth}/${selectedYear}\n`);

    // Get ALL leases (active and terminated)
    const { data: leases, error: leasesError } = await supabase
        .from("leases")
        .select("*")
        .order("created_at", { ascending: false });

    if (leasesError) {
        console.error("❌ Error fetching leases:", leasesError);
        return;
    }

    console.log(`📊 Total leases in DB: ${leases?.length || 0}\n`);

    // Get transactions for December 2025
    const { data: transactions, error: txError } = await supabase
        .from("rental_transactions")
        .select("*")
        .eq("period_month", selectedMonth)
        .eq("period_year", selectedYear);

    if (txError) {
        console.error("❌ Error fetching transactions:", txError);
        return;
    }

    console.log(`📊 Transactions for ${selectedMonth}/${selectedYear}: ${transactions?.length || 0}\n`);

    // Display what the UI should show
    console.log("=== WHAT UI SHOULD DISPLAY ===\n");

    if (leases) {
        for (const lease of leases) {
            const leaseTransactions = transactions?.filter(t => t.lease_id === lease.id) || [];

            console.log(`\n📋 Lease: ${lease.id}`);
            console.log(`   Tenant: ${lease.tenant_name}`);
            console.log(`   Property: ${lease.property_address || 'N/A'}`);
            console.log(`   Monthly Amount: ${lease.monthly_amount?.toLocaleString()} FCFA`);
            console.log(`   Billing Day: ${lease.billing_day || 5}`);
            console.log(`   Status: ${lease.status || 'N/A'}`);
            console.log(`   Transactions for ${selectedMonth}/${selectedYear}: ${leaseTransactions.length}`);

            if (leaseTransactions.length === 0) {
                // No transaction exists - UI creates virtual row
                const billingDay = lease.billing_day || 5;
                const isCurrentMonth = selectedMonth === (today.getMonth() + 1) && selectedYear === today.getFullYear();

                let displayStatus = 'pending';
                if (isCurrentMonth && billingDay && currentDay > billingDay) {
                    displayStatus = 'overdue';
                }

                console.log(`   UI Shows: ${lease.monthly_amount?.toLocaleString()} FCFA - Status: ${displayStatus}`);
                console.log(`   (Virtual row - no DB transaction)`);
            } else {
                // Has transactions - display each one
                leaseTransactions.forEach((tx, idx) => {
                    const billingDay = lease.billing_day || 5;
                    const dueDate = new Date(selectedYear, selectedMonth - 1, billingDay);
                    const daysOverdue = differenceInDays(today, dueDate);

                    console.log(`   Transaction ${idx + 1}:`);
                    console.log(`     ID: ${tx.id}`);
                    console.log(`     Amount: ${tx.amount_due?.toLocaleString()} FCFA`);
                    console.log(`     Status: ${tx.status}`);
                    console.log(`     Due Date: ${dueDate.toISOString().split('T')[0]}`);
                    console.log(`     Days Overdue: ${daysOverdue}`);
                    console.log(`     Reminder Sent: ${tx.reminder_sent}`);
                });
            }
        }
    }

    // Now check what's showing 200k and 18k
    console.log("\n\n=== SEARCHING FOR 200K & 18K ===\n");

    const allTx = await supabase
        .from("rental_transactions")
        .select("*");

    console.log(`Total transactions in DB: ${allTx.data?.length || 0}\n`);

    // Find 200k
    const tx200k = allTx.data?.filter(t => t.amount_due >= 195000 && t.amount_due <= 205000);
    console.log(`Transactions ~200k: ${tx200k?.length || 0}`);
    tx200k?.forEach(tx => {
        console.log(`  ${tx.amount_due} FCFA - ${tx.period_month}/${tx.period_year} - ${tx.status}`);
    });

    // Find 18k
    const tx18k = allTx.data?.filter(t => t.amount_due >= 17000 && t.amount_due <= 19000);
    console.log(`\nTransactions ~18k: ${tx18k?.length || 0}`);
    tx18k?.forEach(tx => {
        console.log(`  ${tx.amount_due} FCFA - ${tx.period_month}/${tx.period_year} - ${tx.status}`);
    });
}

compareUiVsDb().catch(console.error);
