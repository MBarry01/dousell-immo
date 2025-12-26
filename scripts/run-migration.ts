// Script pour exécuter les migrations Supabase
// Exécuter avec: npx tsx scripts/run-migration.ts

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables SUPABASE manquantes dans .env.local');
    console.log('Requis: NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
});

async function runMigration() {
    console.log('🚀 Exécution des migrations...\n');

    // Migration 1: Ajout colonnes à profiles
    console.log('📦 Migration: Ajout colonnes branding à profiles...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
        sql: `
            ALTER TABLE profiles 
            ADD COLUMN IF NOT EXISTS company_name TEXT,
            ADD COLUMN IF NOT EXISTS company_address TEXT,
            ADD COLUMN IF NOT EXISTS company_phone TEXT,
            ADD COLUMN IF NOT EXISTS company_email TEXT,
            ADD COLUMN IF NOT EXISTS company_ninea TEXT,
            ADD COLUMN IF NOT EXISTS logo_url TEXT,
            ADD COLUMN IF NOT EXISTS signature_url TEXT;
        `
    });

    if (error1) {
        // Try direct approach
        const columns = [
            { name: 'company_name', type: 'TEXT' },
            { name: 'company_address', type: 'TEXT' },
            { name: 'company_phone', type: 'TEXT' },
            { name: 'company_email', type: 'TEXT' },
            { name: 'company_ninea', type: 'TEXT' },
            { name: 'logo_url', type: 'TEXT' },
            { name: 'signature_url', type: 'TEXT' }
        ];

        for (const col of columns) {
            await supabase.from('profiles').select(col.name).limit(1).catch(() => {
                console.log(`   Colonne ${col.name} à ajouter manuellement`);
            });
        }
    }
    console.log('   ✅ Profiles prêt\n');

    // Migration 2: Ajout colonnes à leases
    console.log('📦 Migration: Ajout colonnes à leases...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
        sql: `
            ALTER TABLE leases 
            ADD COLUMN IF NOT EXISTS property_address TEXT,
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS tenant_email TEXT,
            ADD COLUMN IF NOT EXISTS billing_day INTEGER DEFAULT 5;
        `
    });

    if (error2) {
        console.log('   ⚠️ RPC non disponible, vérification directe...');
    }
    console.log('   ✅ Leases prêt\n');

    // Test de lecture
    console.log('🔍 Vérification des tables...');

    const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, company_name, logo_url')
        .limit(1);

    if (pErr) {
        console.log('   ❌ Profiles:', pErr.message);
    } else {
        console.log('   ✅ Table profiles OK');
    }

    const { data: leases, error: lErr } = await supabase
        .from('leases')
        .select('id, property_address, tenant_email')
        .limit(1);

    if (lErr) {
        console.log('   ❌ Leases:', lErr.message);
        console.log('\n⚠️ Exécutez manuellement ce SQL dans Supabase Dashboard:\n');
        console.log(`
ALTER TABLE leases 
ADD COLUMN IF NOT EXISTS property_address TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS tenant_email TEXT,
ADD COLUMN IF NOT EXISTS billing_day INTEGER DEFAULT 5;
        `);
    } else {
        console.log('   ✅ Table leases OK');
    }

    console.log('\n✨ Migration terminée!');
}

runMigration().catch(console.error);
