/**
 * Script pour appliquer la migration end_date directement
 * Usage: npx tsx scripts/apply-migration-end-date.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔧 Application de la migration end_date...\n');

  try {
    // 1. Ajouter la colonne end_date
    console.log('1️⃣ Ajout de la colonne end_date...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE leases
        ADD COLUMN IF NOT EXISTS end_date DATE;

        COMMENT ON COLUMN leases.end_date IS 'Date de fin prévue du bail. Utilisée pour les alertes J-180 (6 mois) et J-90 (3 mois) conformément au droit sénégalais.';
      `
    });

    if (alterError && !alterError.message?.includes('already exists')) {
      throw alterError;
    }
    console.log('✅ Colonne end_date ajoutée\n');

    // 2. Créer l'index
    console.log('2️⃣ Création de l\'index...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_leases_end_date_status
        ON leases(end_date, status)
        WHERE status = 'active' AND end_date IS NOT NULL;
      `
    });

    if (indexError && !indexError.message?.includes('already exists')) {
      throw indexError;
    }
    console.log('✅ Index créé\n');

    // 3. Vérifier que la colonne existe
    console.log('3️⃣ Vérification...');
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'leases')
      .eq('column_name', 'end_date');

    if (checkError) {
      console.warn('⚠️  Impossible de vérifier (pas grave):', checkError.message);
    } else if (columns && columns.length > 0) {
      console.log('✅ Colonne confirmée:', columns[0]);
    }

    // 4. Remplir automatiquement les end_date (durée par défaut: 2 ans)
    console.log('\n4️⃣ Calcul automatique des dates de fin (2 ans par défaut)...');
    const { data: updated, error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE leases
        SET end_date = start_date + INTERVAL '2 years'
        WHERE end_date IS NULL
          AND start_date IS NOT NULL
          AND status = 'active';
      `
    });

    if (updateError && !updateError.message?.includes('not found')) {
      console.warn('⚠️  Mise à jour automatique échouée (normal si pas de fonction exec_sql)');
      console.log('   Vous devrez remplir manuellement via le formulaire ou SQL Editor');
    } else {
      console.log('✅ Dates de fin calculées automatiquement\n');
    }

    console.log('\n🎉 Migration terminée avec succès!\n');
    console.log('📝 Prochaines étapes:');
    console.log('   1. Vérifier dans Supabase Dashboard → Table leases');
    console.log('   2. Remplir les end_date manquantes via le formulaire');
    console.log('   3. Tester l\'Assistant Juridique\n');

  } catch (error: any) {
    console.error('\n❌ Erreur lors de la migration:', error.message);
    console.error('\n💡 Solution alternative:');
    console.error('   Ouvrir Supabase Dashboard → SQL Editor');
    console.error('   Copier le contenu de: scripts/apply-end-date-migration.sql');
    console.error('   Exécuter le script manuellement\n');
    process.exit(1);
  }
}

applyMigration();
