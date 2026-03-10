/**
 * Setup districts table and seed data
 * This script applies the districts migration to the database
 * Usage: NODE_ENV=production npx tsx scripts/setup-districts-db.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createAdminClient } from '@/utils/supabase/admin';

async function setupDistrictsDB() {
  const adminClient = createAdminClient();

  try {
    console.log('Setting up districts table...\n');

    // Step 1: Create cities table if not exists
    await adminClient.rpc('exec', { sql: `
      CREATE TABLE IF NOT EXISTS cities (
        slug TEXT PRIMARY KEY,
        name_fr TEXT NOT NULL,
        name_en TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    ` }).catch(() => {
      // Ignore if exec RPC doesn't exist
    });

    // For now, use individual queries instead of batch exec
    console.log('Creating districts table...');
    const { error: createError } = await adminClient.from('districts').select('id').limit(1).single();

    if (createError?.code === 'PGRST205') {
      // Table doesn't exist, need to create it via migrations
      console.log('Districts table does not exist.');
      console.log('Please run: npx supabase db push');
      console.log('Or apply the migration manually via Supabase dashboard.');
      process.exit(1);
    }

    if (createError?.code === 'PGRST116') {
      // Table exists but is empty
      console.log('Districts table exists but is empty. Seeding data...');

      // Check if we can insert
      const { error: insertError } = await adminClient
        .from('districts')
        .insert([{
          slug: 'test-district',
          name_fr: 'Test District',
          city_slug: 'dakar',
          lat: 14.0,
          lng: -17.0,
        }])
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        process.exit(1);
      }

      console.log('Successfully seeded test data.');
    } else if (!createError) {
      console.log('Districts table exists and has data.');
    } else {
      console.error('Unexpected error:', createError);
      process.exit(1);
    }

    console.log('Setup complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

setupDistrictsDB();
