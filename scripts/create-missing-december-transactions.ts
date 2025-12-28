import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createMissingTransactions() {
    console.log("🔧 === CREATING MISSING DECEMBER 2025 TRANSACTIONS ===\n");

    const targetMonth = 12;
    const targetYear = 2025;

    // Get all ACTIVE leases (exclude terminated ones to match UI behavior)
    const { data: leases, error: leasesError } = await supabase
        .from("leases")
        .select("*")
        .eq("status", "active");

    if (leasesError) {
        console.error("❌ Error fetching leases:", leasesError);
        return;
    }

    console.log(`📊 Active leases: ${leases?.length || 0}\n`);

    // Get existing transactions for December 2025
    const { data: existingTx, error: txError } = await supabase
        .from("rental_transactions")
        .select("lease_id")
        .eq("period_month", targetMonth)
        .eq("period_year", targetYear);

    if (txError) {
        console.error("❌ Error fetching transactions:", txError);
        return;
    }

    const existingLeaseIds = new Set(existingTx?.map(t => t.lease_id) || []);
    console.log(`📊 Existing transactions: ${existingLeaseIds.size}\n`);

    // Find leases without transactions
    const leasesWithoutTx = leases?.filter(lease => !existingLeaseIds.has(lease.id)) || [];

    console.log(`📋 Leases without December 2025 transaction: ${leasesWithoutTx.length}\n`);

    if (leasesWithoutTx.length === 0) {
        console.log("✅ All active leases already have transactions for December 2025");
        return;
    }

    // Create transactions
    const transactionsToCreate = leasesWithoutTx.map(lease => {
        const billingDay = lease.billing_day || 5;

        // Calculate period_start and period_end
        const periodStart = new Date(targetYear, targetMonth - 1, 1);
        const periodEnd = new Date(targetYear, targetMonth, 0); // Last day of the month

        console.log(`Creating transaction for: ${lease.tenant_name}`);
        console.log(`  Property: ${lease.property_address || 'N/A'}`);
        console.log(`  Amount: ${lease.monthly_amount?.toLocaleString()} FCFA`);
        console.log(`  Billing Day: ${billingDay}`);
        console.log(`  Period: ${targetMonth}/${targetYear}\n`);

        return {
            lease_id: lease.id,
            period_month: targetMonth,
            period_year: targetYear,
            period_start: periodStart.toISOString().split('T')[0],
            period_end: periodEnd.toISOString().split('T')[0],
            amount_due: lease.monthly_amount,
            status: 'pending',
            reminder_sent: false,
            created_at: new Date().toISOString(),
        };
    });

    // Insert transactions
    const { data: createdTx, error: insertError } = await supabase
        .from("rental_transactions")
        .insert(transactionsToCreate)
        .select();

    if (insertError) {
        console.error("❌ Error creating transactions:", insertError);
        return;
    }

    console.log(`\n✅ Successfully created ${createdTx?.length || 0} transactions!\n`);

    // Display summary
    if (createdTx) {
        console.log("📋 Created transactions:");
        for (const tx of createdTx) {
            const lease = leasesWithoutTx.find(l => l.id === tx.lease_id);
            console.log(`  ✓ ${tx.amount_due?.toLocaleString()} FCFA - ${lease?.tenant_name} (${lease?.property_address})`);
        }
    }

    console.log("\n✅ Database is now synchronized with UI!");
}

createMissingTransactions().catch(console.error);
