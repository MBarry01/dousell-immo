import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Erreur: Variables d\'environnement manquantes.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDates() {
    console.log('🔧 Démarrage de la réparation des dates...');

    // 1. Trouver les transactions avec period_start vide (NULL)
    const { data: transactions, error } = await supabase
        .from('rental_transactions')
        .select('id, period_month, period_year')
        .is('period_start', null);

    if (error) {
        console.error('❌ Erreur de lecture:', error);
        return;
    }

    console.log(`📋 ${transactions.length} transactions trouvées sans date de début.`);

    let fixedCount = 0;

    // 2. Pour chaque transaction, on calcule la date et on met à jour
    for (const tx of transactions) {
        if (tx.period_month && tx.period_year) {
            // Créer la date : 1er du mois à midi UTC pour éviter les décalages
            // Format ISO : YYYY-MM-DD
            const monthStr = tx.period_month.toString().padStart(2, '0');
            const newDate = `${tx.period_year}-${monthStr}-01`; // Ex: "2025-12-01"

            const { error: updateError } = await supabase
                .from('rental_transactions')
                .update({ period_start: newDate })
                .eq('id', tx.id);

            if (!updateError) {
                fixedCount++;
                process.stdout.write('.'); // Petit point pour montrer que ça avance
            } else {
                console.error(`\n❌ Erreur update ID ${tx.id}:`, updateError.message);
            }
        }
    }

    console.log(`\n✅ Terminé ! ${fixedCount} dates corrigées.`);
}

fixDates();
