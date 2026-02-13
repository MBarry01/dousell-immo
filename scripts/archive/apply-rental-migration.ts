/**
 * Script pour appliquer la migration des nouveaux champs rental_transactions
 *
 * Ajoute: period_start, period_end, tenant_id
 *
 * Usage:
 *   npx tsx scripts/apply-rental-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables d\'environnement manquantes');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    console.log('\n🔧 APPLICATION DE LA MIGRATION - Nouveaux champs rental_transactions\n');

    // Lire le fichier de migration
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20251227000000_add_rental_transaction_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration SQL chargée depuis:', migrationPath);
    console.log('\n━'.repeat(80));
    console.log('CONTENU DE LA MIGRATION:');
    console.log('━'.repeat(80));
    console.log(migrationSQL);
    console.log('━'.repeat(80));

    console.log('\n⚠️  IMPORTANT: Vous devez exécuter cette migration manuellement via Supabase Dashboard');
    console.log('\nÉtapes:');
    console.log('1. Allez sur https://supabase.com/dashboard/project/YOUR_PROJECT/sql');
    console.log('2. Copiez le contenu ci-dessus');
    console.log('3. Collez dans l\'éditeur SQL');
    console.log('4. Cliquez sur "Run"');

    console.log('\n📋 OU utilisez cette commande curl:\n');

    const curlCommand = `curl -X POST "${supabaseUrl}/rest/v1/rpc/exec_sql" \\
  -H "apikey: ${supabaseKey}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ query: migrationSQL })}'`;

    console.log(curlCommand);

    console.log('\n✨ Une fois la migration appliquée, testez le Cron avec:');
    console.log('npm run test:cron-rentals\n');
}

applyMigration().catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
});
