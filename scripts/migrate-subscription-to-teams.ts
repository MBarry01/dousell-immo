/**
 * Migration de Données: Profiles → Teams Subscription
 * 
 * Objectif: 
 * 1. Copier pro_status du owner vers teams.subscription_status
 * 2. Créer des "Personal Teams" pour les users orphelins avec abonnement actif
 * 3. Traitement par batch pour éviter les timeouts
 * 
 * Usage:
 *   npx tsx scripts/migrate-subscription-to-teams.ts [--dry-run]
 * 
 * IMPORTANT: Faire un backup de la DB avant d'exécuter !
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BATCH_SIZE = 100;
const DRY_RUN = process.argv.includes('--dry-run');

// =====================================================
// ÉTAPE 1: MIGRATION DES ÉQUIPES EXISTANTES
// =====================================================

async function migrateExistingTeams() {
    console.log('\n📋 ÉTAPE 1: Migration des équipes existantes\n');
    console.log('═'.repeat(60));

    let offset = 0;
    let totalMigrated = 0;
    let totalErrors = 0;

    while (true) {
        // Récupérer un batch d'équipes
        const { data: teams, error } = await supabase
            .from('teams')
            .select('id, created_by, name')
            .range(offset, offset + BATCH_SIZE - 1);

        if (error) {
            console.error('❌ Erreur récupération équipes:', error);
            break;
        }

        if (!teams || teams.length === 0) {
            break;
        }

        console.log(`\n📦 Traitement batch ${offset / BATCH_SIZE + 1} (${teams.length} équipes)...`);

        for (const team of teams) {
            try {
                // Récupérer le profil du owner
                const { data: owner, error: ownerError } = await supabase
                    .from('profiles')
                    .select('pro_status, pro_trial_ends_at')
                    .eq('id', team.created_by)
                    .single();

                if (ownerError || !owner) {
                    console.warn(`⚠️ Owner introuvable pour team ${team.name} (${team.id})`);
                    totalErrors++;
                    continue;
                }

                // Mapper le statut (owner = source de vérité)
                const subscriptionStatus = owner.pro_status || 'trial';

                // Si trial ou none, donner 14 jours d'essai
                let trialEndsAt = owner.pro_trial_ends_at;
                if (!trialEndsAt && (subscriptionStatus === 'trial' || subscriptionStatus === 'none')) {
                    const futureDate = new Date();
                    futureDate.setDate(futureDate.getDate() + 14);
                    trialEndsAt = futureDate.toISOString();
                }

                const updateData = {
                    subscription_status: subscriptionStatus,
                    subscription_trial_ends_at: trialEndsAt,
                    subscription_started_at: new Date().toISOString(),
                    subscription_tier: 'pro',
                };

                if (DRY_RUN) {
                    console.log(`  🔍 [DRY-RUN] Équipe "${team.name}": ${subscriptionStatus}`);
                } else {
                    const { error: updateError } = await supabase
                        .from('teams')
                        .update(updateData)
                        .eq('id', team.id);

                    if (updateError) {
                        console.error(`  ❌ Erreur mise à jour team ${team.name}:`, updateError.message);
                        totalErrors++;
                    } else {
                        console.log(`  ✅ Équipe "${team.name}": ${subscriptionStatus}`);
                        totalMigrated++;
                    }
                }
            } catch (err) {
                console.error(`  ❌ Exception pour team ${team.name}:`, err);
                totalErrors++;
            }
        }

        offset += BATCH_SIZE;

        // Délai pour éviter de surcharger Supabase
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`✅ Équipes migrées: ${totalMigrated}`);
    console.log(`❌ Erreurs: ${totalErrors}`);
}

// =====================================================
// ÉTAPE 2: CRÉER DES PERSONAL TEAMS POUR ORPHELINS
// =====================================================

async function createPersonalTeamsForOrphans() {
    console.log('\n📋 ÉTAPE 2: Création de Personal Teams pour users orphelins\n');
    console.log('═'.repeat(60));

    // Trouver les users qui ont un pro_status actif mais pas d'équipe
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, pro_status, pro_trial_ends_at')
        .in('pro_status', ['trial', 'active']); // Uniquement les actifs

    if (error) {
        console.error('❌ Erreur récupération profils:', error);
        return;
    }

    console.log(`📊 ${profiles.length} profils avec abonnement actif trouvés`);

    let orphansFound = 0;
    let teamsCreated = 0;

    for (const profile of profiles) {
        // Vérifier s'il a déjà une équipe
        const { data: membership } = await supabase
            .from('team_members')
            .select('id')
            .eq('user_id', profile.id)
            .eq('status', 'active')
            .maybeSingle();

        if (membership) {
            // A déjà une équipe, skip
            continue;
        }

        orphansFound++;
        console.log(`\n🔍 Orphelin trouvé: ${profile.full_name || profile.email}`);

        if (DRY_RUN) {
            console.log(`  🔍 [DRY-RUN] Créerait Personal Team pour ${profile.email}`);
            continue;
        }

        // Créer une Personal Team
        const teamName = `${profile.full_name || 'Mon Équipe'} (Personnel)`;
        const teamSlug = `personal-${profile.id.substring(0, 8)}-${Date.now()}`;

        const { data: newTeam, error: teamError } = await supabase
            .from('teams')
            .insert({
                name: teamName,
                slug: teamSlug,
                created_by: profile.id,
                subscription_status: profile.pro_status,
                subscription_trial_ends_at: profile.pro_trial_ends_at,
                subscription_started_at: new Date().toISOString(),
                subscription_tier: 'pro',
            })
            .select()
            .single();

        if (teamError) {
            console.error(`  ❌ Erreur création team:`, teamError.message);
            continue;
        }

        // Ajouter le user comme owner de sa Personal Team
        const { error: memberError } = await supabase
            .from('team_members')
            .insert({
                team_id: newTeam.id,
                user_id: profile.id,
                role: 'owner',
                status: 'active',
                joined_at: new Date().toISOString(),
            });

        if (memberError) {
            console.error(`  ❌ Erreur ajout membre:`, memberError.message);
            // Rollback: supprimer l'équipe
            await supabase.from('teams').delete().eq('id', newTeam.id);
            continue;
        }

        console.log(`  ✅ Personal Team créée: "${teamName}"`);
        teamsCreated++;
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`📊 Users orphelins trouvés: ${orphansFound}`);
    console.log(`✅ Personal Teams créées: ${teamsCreated}`);
}

// =====================================================
// ÉTAPE 3: VÉRIFICATION & RAPPORT FINAL
// =====================================================

async function generateMigrationReport() {
    console.log('\n📋 RAPPORT DE MIGRATION\n');
    console.log('═'.repeat(60));

    // Stats équipes
    const { data: teamStats } = await supabase
        .from('teams')
        .select('subscription_status');

    const statusCounts = teamStats?.reduce((acc, team) => {
        acc[team.subscription_status] = (acc[team.subscription_status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>) || {};

    console.log('\n📊 Distribution des abonnements:');
    console.log(`  Trial:    ${statusCounts.trial || 0}`);
    console.log(`  Active:   ${statusCounts.active || 0}`);
    console.log(`  Expired:  ${statusCounts.expired || 0}`);
    console.log(`  None:     ${statusCounts.none || 0}`);
    console.log(`  Canceled: ${statusCounts.canceled || 0}`);

    // Vérifier les orphelins restants
    const { data: remainingOrphans } = await supabase.rpc('get_orphan_users_count');

    console.log(`\n👤 Users sans équipe restants: ${remainingOrphans || 0}`);

    console.log('\n' + '═'.repeat(60));
}

// =====================================================
// MAIN
// =====================================================

async function main() {
    console.log('🚀 Migration Subscription: Profiles → Teams\n');

    if (DRY_RUN) {
        console.log('⚠️  MODE DRY-RUN ACTIVÉ (aucune modification DB)\n');
    }

    // Étape 1: Migrer les équipes existantes
    await migrateExistingTeams();

    // Étape 2: Créer Personal Teams pour orphelins
    await createPersonalTeamsForOrphans();

    // Étape 3: Rapport final
    await generateMigrationReport();

    console.log('\n✅ Migration terminée\n');

    if (DRY_RUN) {
        console.log('💡 Relancez sans --dry-run pour appliquer les changements');
    } else {
        console.log('⏭️  Prochaine étape: Déployer le nouveau code avec les helpers');
    }
}

// Exécuter la migration
main().catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});
