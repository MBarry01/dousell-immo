/**
 * Apply districts migration manually
 * Usage: NODE_ENV=production npx tsx scripts/apply-districts-migration.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createAdminClient } from '@/utils/supabase/admin';
import * as fs from 'fs';
import * as path from 'path';

async function applyMigration() {
  try {
    const adminClient = createAdminClient();

    // Read migration SQL
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260307_add_districts_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Applying districts migration...\n');

    // Execute SQL
    const { error } = await adminClient.rpc('exec', {
      sql,
    });

    if (error) {
      console.error('Error applying migration:', error);
      process.exit(1);
    }

    console.log('Migration applied successfully!\n');

    // Verify table exists
    const { data, error: verifyError } = await adminClient
      .from('districts')
      .select('count()', { count: 'exact' })
      .single();

    if (verifyError) {
      console.error('Verification error:', verifyError);
      process.exit(1);
    }

    console.log('Districts table verified. Ready for testing.\n');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

applyMigration();
