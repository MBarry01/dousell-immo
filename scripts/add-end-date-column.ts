/**
 * Script: Ajouter la colonne end_date à la table leases
 * Requis pour les alertes de fin de bail (J-180 et J-90)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function addEndDateColumn() {
    console.log('🔧 Ajout de la colonne end_date à la table leases...');

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        // 1. Ajouter la colonne end_date
        const { error: alterError } = await supabase.rpc('exec_sql', {
            query: `
                ALTER TABLE leases
                ADD COLUMN IF NOT EXISTS end_date DATE;

                COMMENT ON COLUMN leases.end_date IS 'Date de fin prévue du bail. Utilisée pour les alertes J-180 (6 mois) et J-90 (3 mois) conformément au droit sénégalais.';
            `
        });

        if (alterError) {
            // Si la fonction RPC n'existe pas, on utilise une approche alternative
            console.log('⚠️  La fonction RPC exec_sql n\'existe pas. Utilisation d\'une approche alternative...');

            // Vérifier si la colonne existe déjà
            const { data: _columns, error: checkError } = await supabase
                .from('leases')
                .select('*')
                .limit(1);

            if (checkError) {
                throw new Error(`Erreur lors de la vérification: ${checkError.message}`);
            }

            console.log('✅ La table leases est accessible.');
            console.log('ℹ️  Veuillez exécuter manuellement cette commande SQL dans l\'éditeur Supabase:');
            console.log('\n--- SQL à exécuter ---');
            console.log(`
ALTER TABLE leases
ADD COLUMN IF NOT EXISTS end_date DATE;

COMMENT ON COLUMN leases.end_date IS 'Date de fin prévue du bail. Utilisée pour les alertes J-180 (6 mois) et J-90 (3 mois) conformément au droit sénégalais.';

CREATE INDEX IF NOT EXISTS idx_leases_end_date_status
ON leases(end_date, status)
WHERE status = 'active' AND end_date IS NOT NULL;
            `);
            console.log('----------------------\n');

            return;
        }

        // 2. Créer l'index
        const { error: indexError } = await supabase.rpc('exec_sql', {
            query: `
                CREATE INDEX IF NOT EXISTS idx_leases_end_date_status
                ON leases(end_date, status)
                WHERE status = 'active' AND end_date IS NOT NULL;
            `
        });

        if (indexError) {
            console.warn('⚠️  Impossible de créer l\'index (peut déjà exister)');
        }

        console.log('✅ Colonne end_date ajoutée avec succès !');

        // 3. Vérifier les baux existants
        const { data: leases, error: leasesError } = await supabase
            .from('leases')
            .select('id, tenant_name, end_date')
            .eq('status', 'active')
            .limit(5);

        if (leasesError) {
            console.error('❌ Erreur lors de la vérification des baux:', leasesError.message);
        } else {
            console.log(`\n📋 ${leases?.length || 0} baux actifs trouvés (aperçu)`);
            if (leases && leases.length > 0) {
                console.log('ℹ️  Pensez à définir une end_date pour vos baux actifs.');
            }
        }

    } catch (error: any) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

addEndDateColumn();
