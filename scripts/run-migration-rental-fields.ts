/**
 * Script pour appliquer la migration rental_transactions (nouveaux champs)
 * Exécute les commandes SQL directement via Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables d\'environnement manquantes');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('\n🔧 APPLICATION MIGRATION - Nouveaux champs rental_transactions\n');

    try {
        // 1. Ajouter les colonnes
        console.log('1️⃣  Ajout des colonnes period_start, period_end, tenant_id...');
        const { error: alterError } = await supabase.rpc('exec_sql', {
            sql: `
                ALTER TABLE rental_transactions
                ADD COLUMN IF NOT EXISTS period_start DATE,
                ADD COLUMN IF NOT EXISTS period_end DATE,
                ADD COLUMN IF NOT EXISTS tenant_id UUID;
            `
        });

        if (alterError && !alterError.message.includes('already exists')) {
            console.error('❌ Erreur ajout colonnes:', alterError);
        } else {
            console.log('✅ Colonnes ajoutées');
        }

        // 2. Migrer les données existantes (period_start et period_end)
        console.log('\n2️⃣  Migration des données existantes...');
        const { data: transactions } = await supabase
            .from('rental_transactions')
            .select('id, period_month, period_year, period_start, period_end')
            .is('period_start', null);

        if (transactions && transactions.length > 0) {
            console.log(`📋 ${transactions.length} transaction(s) à migrer`);

            for (const trans of transactions) {
                const periodStart = new Date(trans.period_year, trans.period_month - 1, 1);
                const periodEnd = new Date(trans.period_year, trans.period_month, 0);

                const { error: updateError } = await supabase
                    .from('rental_transactions')
                    .update({
                        period_start: periodStart.toISOString().split('T')[0],
                        period_end: periodEnd.toISOString().split('T')[0]
                    })
                    .eq('id', trans.id);

                if (updateError) {
                    console.error(`❌ Erreur update ${trans.id}:`, updateError);
                } else {
                    console.log(`✅ ${trans.period_month}/${trans.period_year} → ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`);
                }
            }
        } else {
            console.log('✅ Aucune donnée à migrer (déjà fait)');
        }

        // 3. Vérification finale
        console.log('\n3️⃣  Vérification des colonnes...');
        const { data: sampleData, error: selectError } = await supabase
            .from('rental_transactions')
            .select('id, period_month, period_year, period_start, period_end, tenant_id')
            .limit(5);

        if (selectError) {
            console.error('❌ Erreur vérification:', selectError);
        } else {
            console.log('\n✅ MIGRATION RÉUSSIE! Échantillon de données:');
            console.table(sampleData);
        }

        console.log('\n✨ Vous pouvez maintenant tester le Cron avec:');
        console.log('curl "http://localhost:3000/api/cron/generate-monthly-rentals?date=2026-02-01" \\');
        console.log('  -H "Authorization: Bearer $CRON_SECRET"\n');

    } catch (error) {
        console.error('❌ Erreur migration:', error);
        process.exit(1);
    }
}

runMigration();
