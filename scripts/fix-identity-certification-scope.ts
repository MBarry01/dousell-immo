/**
 * Script de migration pour corriger le certification_scope des documents d'identité certifiés
 *
 * Ce script met à jour tous les documents d'identité (CNI, Passeport) qui sont certifiés
 * mais qui n'ont pas le certification_scope = 'global'
 *
 * Usage: npx tsx scripts/fix-identity-certification-scope.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Charger les variables d'environnement depuis .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'OK' : 'MANQUANT');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'OK' : 'MANQUANT');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixIdentityCertificationScope() {
  console.log('🔧 Début de la migration...\n');

  try {
    // 1. Récupérer tous les documents d'identité certifiés
    console.log('📋 Récupération des documents d\'identité certifiés...');
    const { data: identityDocs, error: fetchError } = await supabase
      .from('user_documents')
      .select('id, file_name, file_type, is_certified, certification_scope, source')
      .in('file_type', ['cni', 'passport'])
      .eq('is_certified', true);

    if (fetchError) {
      console.error('❌ Erreur lors de la récupération:', fetchError);
      process.exit(1);
    }

    console.log(`   ✅ Trouvé ${identityDocs?.length || 0} documents d'identité certifiés\n`);

    if (!identityDocs || identityDocs.length === 0) {
      console.log('✅ Aucun document à migrer');
      return;
    }

    // 2. Filtrer ceux qui n'ont pas certification_scope = 'global'
    const docsToFix = identityDocs.filter(doc => doc.certification_scope !== 'global');

    console.log(`🔍 Documents à corriger: ${docsToFix.length}`);
    console.log(`   - Documents déjà corrects: ${identityDocs.length - docsToFix.length}\n`);

    if (docsToFix.length === 0) {
      console.log('✅ Tous les documents ont déjà le bon certification_scope');
      return;
    }

    // 3. Afficher les documents qui seront corrigés
    console.log('📄 Documents qui seront mis à jour:');
    docsToFix.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.file_name}`);
      console.log(`      Type: ${doc.file_type}`);
      console.log(`      Scope actuel: ${doc.certification_scope || 'NULL'}`);
      console.log(`      Source: ${doc.source}`);
    });
    console.log('');

    // 4. Mettre à jour tous les documents en une seule requête
    console.log('🔄 Mise à jour des documents...');
    const idsToUpdate = docsToFix.map(doc => doc.id);

    const { error: updateError } = await supabase
      .from('user_documents')
      .update({ certification_scope: 'global' })
      .in('id', idsToUpdate);

    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour:', updateError);
      process.exit(1);
    }

    console.log(`✅ ${docsToFix.length} documents mis à jour avec succès!\n`);

    // 5. Vérification post-migration
    console.log('🔍 Vérification post-migration...');
    const { data: verifiedDocs, error: verifyError } = await supabase
      .from('user_documents')
      .select('id, file_name, file_type, certification_scope')
      .in('file_type', ['cni', 'passport'])
      .eq('is_certified', true)
      .neq('certification_scope', 'global');

    if (verifyError) {
      console.error('⚠️ Erreur lors de la vérification:', verifyError);
    } else if (verifiedDocs && verifiedDocs.length > 0) {
      console.log(`⚠️ Attention: ${verifiedDocs.length} documents n'ont toujours pas le bon scope`);
      verifiedDocs.forEach(doc => {
        console.log(`   - ${doc.file_name}: ${doc.certification_scope || 'NULL'}`);
      });
    } else {
      console.log('✅ Tous les documents d\'identité certifiés ont maintenant certification_scope = "global"\n');
    }

    console.log('🎉 Migration terminée avec succès!');

  } catch (error) {
    console.error('❌ Exception:', error);
    process.exit(1);
  }
}

// Exécution du script
fixIdentityCertificationScope();
