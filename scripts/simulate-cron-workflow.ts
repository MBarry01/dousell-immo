/**
 * Script de simulation du Cron Job de génération d'échéances
 *
 * Ce script simule le comportement du Cron Job sur plusieurs mois
 * pour visualiser comment les échéances sont créées automatiquement.
 *
 * Usage:
 *   npm run simulate:cron
 *   ou
 *   npx tsx scripts/simulate-cron-workflow.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Charger les variables d'environnement depuis .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables d\'environnement manquantes');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Couleurs pour la console
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
};

function log(color: string, ...args: any[]) {
    console.log(color, ...args, colors.reset);
}

async function simulateCronJob() {
    console.clear();
    log(colors.bright + colors.cyan, '\n' + '='.repeat(80));
    log(colors.bright + colors.cyan, '🎬 SIMULATION DU CRON JOB - Génération Automatique des Échéances');
    log(colors.bright + colors.cyan, '='.repeat(80) + '\n');

    // 1. Récupérer les baux actifs
    log(colors.blue, '📋 Étape 1 : Récupération des baux actifs...\n');

    const { data: activeLeases, error: leasesError } = await supabase
        .from('leases')
        .select('id, tenant_name, monthly_amount, billing_day, start_date')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    if (leasesError) {
        log(colors.red, '❌ Erreur:', leasesError.message);
        process.exit(1);
    }

    if (!activeLeases || activeLeases.length === 0) {
        log(colors.yellow, 'ℹ️  Aucun bail actif trouvé');
        process.exit(0);
    }

    log(colors.green, `✅ ${activeLeases.length} bail(s) actif(s) trouvé(s):\n`);

    activeLeases.forEach((lease, index) => {
        const startDate = new Date(lease.start_date);
        log(
            colors.cyan,
            `   ${index + 1}. ${lease.tenant_name.padEnd(25)} | ${String(lease.monthly_amount).padStart(10)} FCFA | Jour ${lease.billing_day || 5} | Depuis: ${startDate.toLocaleDateString('fr-FR')}`
        );
    });

    console.log('\n');

    // 2. Récupérer les transactions existantes
    log(colors.blue, '📊 Étape 2 : Analyse des transactions existantes...\n');

    const { data: existingTransactions } = await supabase
        .from('rental_transactions')
        .select('lease_id, period_month, period_year, status, paid_at')
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false });

    // Créer un index des transactions existantes
    const transactionsMap = new Map<string, any[]>();
    existingTransactions?.forEach(trans => {
        const key = trans.lease_id;
        if (!transactionsMap.has(key)) {
            transactionsMap.set(key, []);
        }
        transactionsMap.get(key)!.push(trans);
    });

    log(colors.green, `✅ ${existingTransactions?.length || 0} transaction(s) existante(s)\n`);

    // 3. Simulation sur 3 mois
    log(colors.bright + colors.magenta, '\n' + '━'.repeat(80));
    log(colors.bright + colors.magenta, '🎭 SIMULATION : Que se passe-t-il les 3 prochains mois ?');
    log(colors.bright + colors.magenta, '━'.repeat(80) + '\n');

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Simuler 3 mois
    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
        const simulatedDate = new Date(currentYear, currentMonth - 1 + monthOffset, 1);
        const month = simulatedDate.getMonth() + 1;
        const year = simulatedDate.getFullYear();

        log(
            colors.bright + colors.yellow,
            `\n📅 ${monthOffset === 0 ? 'MAINTENANT' : `MOIS +${monthOffset}`} : ${simulatedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase()}`
        );
        log(colors.yellow, '─'.repeat(80));

        log(colors.cyan, `\n🤖 Le Cron Job s'exécute le 1er ${simulatedDate.toLocaleDateString('fr-FR', { month: 'long' })} à 00:01...\n`);

        let created = 0;
        let skipped = 0;

        for (const lease of activeLeases) {
            // Vérifier si la transaction existe déjà
            const leaseTransactions = transactionsMap.get(lease.id) || [];
            const exists = leaseTransactions.some(
                t => t.period_month === month && t.period_year === year
            );

            const transaction = leaseTransactions.find(
                t => t.period_month === month && t.period_year === year
            );

            if (exists) {
                const statusIcon = transaction?.status === 'paid' ? '✅' : '⏳';
                const statusText = transaction?.status === 'paid'
                    ? `Payé le ${new Date(transaction.paid_at).toLocaleDateString('fr-FR')}`
                    : 'En attente';

                log(
                    colors.blue,
                    `   ${statusIcon} [${lease.tenant_name}] Échéance existe déjà → ${statusText}`
                );
                skipped++;
            } else {
                log(
                    colors.green,
                    `   ➕ [${lease.tenant_name}] NOUVELLE échéance créée → ${lease.monthly_amount} FCFA (statut: pending)`
                );

                // Ajouter à la map pour la simulation des mois suivants
                if (!transactionsMap.has(lease.id)) {
                    transactionsMap.set(lease.id, []);
                }
                transactionsMap.get(lease.id)!.push({
                    lease_id: lease.id,
                    period_month: month,
                    period_year: year,
                    status: 'pending',
                    amount_due: lease.monthly_amount
                });

                created++;
            }
        }

        log(colors.yellow, `\n   📊 Résumé : ${created} créée(s) | ${skipped} existante(s)`);

        // Vue d'ensemble du mois
        if (created > 0 || skipped > 0) {
            log(colors.cyan, `\n   💡 Ce que voit le propriétaire dans son tableau de bord :`);
            log(colors.cyan, `      → ${activeLeases.length} ligne(s) de loyer pour ${simulatedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`);
            log(colors.cyan, `      → Il peut maintenant cliquer "Marqué payé" quand les locataires paient`);
        }
    }

    // 4. Tableau récapitulatif
    log(colors.bright + colors.magenta, '\n\n' + '━'.repeat(80));
    log(colors.bright + colors.magenta, '📈 TABLEAU RÉCAPITULATIF PAR LOCATAIRE');
    log(colors.bright + colors.magenta, '━'.repeat(80) + '\n');

    for (const lease of activeLeases) {
        log(colors.bright + colors.cyan, `\n👤 ${lease.tenant_name}`);
        log(colors.cyan, '   ' + '─'.repeat(70));

        const leaseTransactions = transactionsMap.get(lease.id) || [];
        const sorted = leaseTransactions
            .sort((a, b) => {
                if (a.period_year !== b.period_year) return b.period_year - a.period_year;
                return b.period_month - a.period_month;
            })
            .slice(0, 6); // 6 derniers mois max

        if (sorted.length === 0) {
            log(colors.yellow, '   ℹ️  Aucune transaction');
        } else {
            sorted.forEach(trans => {
                const date = new Date(trans.period_year, trans.period_month - 1, 1);
                const monthLabel = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                const statusIcon = trans.status === 'paid' ? '✅' : '⏳';
                const statusLabel = trans.status === 'paid' ? 'PAYÉ' : 'EN ATTENTE';
                const amount = (trans.amount_due || lease.monthly_amount).toLocaleString('fr-FR');

                log(
                    trans.status === 'paid' ? colors.green : colors.yellow,
                    `   ${statusIcon} ${monthLabel.padEnd(20)} | ${amount.padStart(10)} FCFA | ${statusLabel}`
                );
            });
        }
    }

    // 5. Statistiques globales
    log(colors.bright + colors.magenta, '\n\n' + '━'.repeat(80));
    log(colors.bright + colors.magenta, '📊 STATISTIQUES GLOBALES');
    log(colors.bright + colors.magenta, '━'.repeat(80) + '\n');

    const allTransactions = Array.from(transactionsMap.values()).flat();
    const totalTransactions = allTransactions.length;
    const paidTransactions = allTransactions.filter(t => t.status === 'paid').length;
    const pendingTransactions = totalTransactions - paidTransactions;

    const totalAmount = allTransactions.reduce((sum, t) => sum + (t.amount_due || 0), 0);
    const paidAmount = allTransactions
        .filter(t => t.status === 'paid')
        .reduce((sum, t) => sum + (t.amount_due || 0), 0);
    const pendingAmount = totalAmount - paidAmount;

    log(colors.cyan, `   📝 Total des échéances : ${totalTransactions}`);
    log(colors.green, `   ✅ Payées : ${paidTransactions} (${paidAmount.toLocaleString('fr-FR')} FCFA)`);
    log(colors.yellow, `   ⏳ En attente : ${pendingTransactions} (${pendingAmount.toLocaleString('fr-FR')} FCFA)`);

    // 6. Conclusion
    log(colors.bright + colors.green, '\n\n' + '='.repeat(80));
    log(colors.bright + colors.green, '✨ CONCLUSION DE LA SIMULATION');
    log(colors.bright + colors.green, '='.repeat(80) + '\n');

    log(colors.cyan, '   🎯 Avec le Cron Job actif :');
    log(colors.green, '      ✅ Les échéances sont créées AUTOMATIQUEMENT le 1er de chaque mois');
    log(colors.green, '      ✅ Le propriétaire n\'a plus besoin de créer les lignes manuellement');
    log(colors.green, '      ✅ Il arrive sur son tableau de bord et voit déjà la ligne du mois');
    log(colors.green, '      ✅ Il clique juste "Marqué payé" quand le locataire paie');
    log(colors.cyan, '\n   🚀 Prochaine exécution réelle :');
    log(colors.yellow, `      → 1er janvier 2026 à 00:01 UTC`);

    log(colors.bright + colors.green, '\n' + '='.repeat(80) + '\n');
}

// Exécuter la simulation
simulateCronJob().catch((error) => {
    console.error('❌ Erreur lors de la simulation:', error);
    process.exit(1);
});
