import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function addAmountPaidColumn() {
    console.log("🔧 === ADDING amount_paid COLUMN ===\n");

    try {
        // Exécuter la requête SQL directement
        const { _data, error } = await supabase.rpc('exec_sql', {
            sql_query: `
                ALTER TABLE rental_transactions
                ADD COLUMN IF NOT EXISTS amount_paid INTEGER DEFAULT 0;

                COMMENT ON COLUMN rental_transactions.amount_paid IS 'Montant réellement payé (en FCFA)';
            `
        });

        if (error) {
            console.error("❌ Error:", error);
            console.log("\n⚠️  La fonction exec_sql n'existe peut-être pas.");
            console.log("Veuillez exécuter cette commande SQL manuellement dans Supabase Dashboard:");
            console.log("\n```sql");
            console.log("ALTER TABLE rental_transactions");
            console.log("ADD COLUMN IF NOT EXISTS amount_paid INTEGER DEFAULT 0;");
            console.log("\nCOMMENT ON COLUMN rental_transactions.amount_paid IS 'Montant réellement payé (en FCFA)';");
            console.log("```\n");
            return;
        }

        console.log("✅ Column added successfully!");
    } catch (err) {
        console.error("❌ Error:", err);
        console.log("\n📋 MIGRATION SQL À EXÉCUTER MANUELLEMENT:");
        console.log("─────────────────────────────────────────");
        console.log("ALTER TABLE rental_transactions");
        console.log("ADD COLUMN IF NOT EXISTS amount_paid INTEGER DEFAULT 0;");
        console.log("\nCOMMENT ON COLUMN rental_transactions.amount_paid IS 'Montant réellement payé (en FCFA)';");
        console.log("─────────────────────────────────────────\n");
    }
}

addAmountPaidColumn().catch(console.error);
