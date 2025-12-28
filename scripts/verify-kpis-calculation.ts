import { createClient } from "@supabase/supabase-js";
import { calculateFinancials, LeaseInput, TransactionInput } from "@/lib/finance";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function verifyKPIs() {
    console.log("🔍 === VERIFICATION DES KPIs (Décembre 2025) ===\n");

    const selectedMonth = 12;
    const selectedYear = 2025;
    const targetDate = new Date(selectedYear, selectedMonth - 1, 1);

    // Get leases
    const { data: leases, error: leasesError } = await supabase
        .from("leases")
        .select("*");

    if (leasesError) {
        console.error("❌ Error:", leasesError);
        return;
    }

    // Get December transactions
    const { data: transactions, error: txError } = await supabase
        .from("rental_transactions")
        .select("*")
        .eq("period_month", selectedMonth)
        .eq("period_year", selectedYear);

    if (txError) {
        console.error("❌ Error:", txError);
        return;
    }

    console.log(`📊 Baux totaux: ${leases?.length || 0}`);
    console.log(`📊 Baux actifs: ${leases?.filter(l => l.status === 'active').length || 0}`);
    console.log(`📊 Transactions Déc 2025: ${transactions?.length || 0}\n`);

    // Préparer les données pour le calcul
    const safeLeases: LeaseInput[] = (leases || []).map(l => ({
        id: l.id,
        monthly_amount: l.monthly_amount,
        status: l.status || 'active',
        start_date: l.start_date || null,
        billing_day: l.billing_day || 5
    }));

    const safeTransactions: TransactionInput[] = (transactions || []).map(t => ({
        id: t.id,
        lease_id: t.lease_id,
        amount_due: t.amount_due || 0,
        amount_paid: t.amount_paid,
        status: t.status
    }));

    // Calculer les KPIs
    const kpis = calculateFinancials(safeLeases, safeTransactions, targetDate);

    console.log("=== KPIs CALCULÉS ===");
    console.log(`Total Attendu: ${kpis.totalExpected.toLocaleString()} FCFA`);
    console.log(`Total Encaissé: ${kpis.totalCollected.toLocaleString()} FCFA`);
    console.log(`Reste à encaisser: ${(kpis.totalExpected - kpis.totalCollected).toLocaleString()} FCFA`);
    console.log(`Taux de recouvrement: ${kpis.collectionRate}%`);
    console.log(`\nStatuts:`);
    console.log(`  ✅ Payés: ${kpis.paidCount}`);
    console.log(`  ⏳ En attente: ${kpis.pendingCount}`);
    console.log(`  🔴 En retard: ${kpis.overdueCount}\n`);

    // Vérification manuelle
    console.log("=== VÉRIFICATION MANUELLE ===\n");

    const activeLeases = leases?.filter(l => l.status === 'active') || [];
    const totalExpectedManual = activeLeases.reduce((sum, l) => sum + (l.monthly_amount || 0), 0);

    console.log(`Baux actifs: ${activeLeases.length}`);
    activeLeases.forEach(lease => {
        const tx = transactions?.find(t => t.lease_id === lease.id);
        console.log(`\n${lease.tenant_name} - ${lease.property_address || 'N/A'}`);
        console.log(`  Loyer attendu: ${lease.monthly_amount.toLocaleString()} FCFA`);
        console.log(`  Transaction: ${tx ? 'OUI' : 'NON'}`);
        if (tx) {
            console.log(`    Status: ${tx.status}`);
            console.log(`    Montant dû: ${tx.amount_due?.toLocaleString()} FCFA`);
            console.log(`    Montant payé: ${tx.amount_paid?.toLocaleString() || '0'} FCFA`);
        }
    });

    console.log(`\n📊 Total Attendu (Manuel): ${totalExpectedManual.toLocaleString()} FCFA`);
    console.log(`📊 Total Attendu (Calc): ${kpis.totalExpected.toLocaleString()} FCFA`);

    if (totalExpectedManual !== kpis.totalExpected) {
        console.log(`\n⚠️  ATTENTION: Différence détectée!`);
    } else {
        console.log(`\n✅ Total Attendu est correct!`);
    }

    // Vérifier encaissé
    const totalCollectedManual = (transactions || []).reduce((sum, t) => {
        return sum + (Number(t.amount_paid) || 0);
    }, 0);

    console.log(`\n📊 Total Encaissé (Manuel): ${totalCollectedManual.toLocaleString()} FCFA`);
    console.log(`📊 Total Encaissé (Calc): ${kpis.totalCollected.toLocaleString()} FCFA`);

    if (totalCollectedManual !== kpis.totalCollected) {
        console.log(`\n⚠️  ATTENTION: Différence détectée sur l'encaissé!`);
    } else {
        console.log(`\n✅ Total Encaissé est correct!`);
    }
}

verifyKPIs().catch(console.error);
