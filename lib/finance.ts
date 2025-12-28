import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                        FINANCE GUARD - KPI ENGINE                         ║
 * ║                       Moteur de calcul financier                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * RESPONSABILITÉS :
 * 1. Calcul des KPIs financiers (Attendu, Encaissé, Taux de recouvrement)
 * 2. Comptage des statuts (Payé, En attente, En retard)
 * 3. Validation des données (doublon email, cohérence)
 *
 * RÈGLES MÉTIER :
 * - Source de vérité pour "Attendu" : Table LEASES (baux actifs)
 * - Source de vérité pour "Encaissé" : Table RENTAL_TRANSACTIONS (amount_paid)
 * - Statut "En retard" : Déterminé par billing_day (synchronisé avec UI)
 *
 * SYNCHRONISATION UI ↔ BACKEND ↔ KPIs :
 * ✓ UI affiche "Retard" si currentDay > billing_day
 * ✓ KPIs comptent "overdue" si currentDay > billing_day
 * ✓ Relances envoyées si daysOverdue >= 5
 *
 * CRÉATION AUTOMATIQUE DE TRANSACTIONS (MAJ: 2025-12-28) :
 * ✓ Lors de l'ajout d'un nouveau locataire via createNewLease()
 * ✓ Transaction créée automatiquement pour le mois EN COURS (dynamique)
 * ✓ Champs: period_month (actuel), period_year (actuel), reminder_sent: false
 * ✓ Exemple: Locataire ajouté le 28/12/2025 → Transaction Décembre 2025 créée
 * ✓ Impact: Cron peut traiter ce locataire dès le lendemain
 *
 * COMPATIBILITÉ :
 * - Gère l'absence de la colonne amount_paid (fallback sur amount_due)
 * - Supporte les paiements partiels (amount_paid < amount_due)
 * - Gère les lignes virtuelles (baux sans transaction)
 *
 * @version 2.1 - Création auto transactions + Documentation
 * @date 2025-12-28
 */

import { isSameMonth, isWithinInterval, startOfMonth, endOfMonth, parseISO, isAfter } from 'date-fns';

export interface FinancialKPIs {
    totalExpected: number;  // Basé sur les baux actifs (monthly_amount)
    totalCollected: number; // Basé sur les versements réels (amount_paid ou amount_due si paid)
    collectionRate: number; // Taux de recouvrement en % (Collected / Expected * 100)
    occupancyRate: number;  // Taux d'occupation financier (Placeholder pour future implémentation)
    pendingCount: number;   // Nombre de loyers en attente (status != 'paid' && !overdue)
    overdueCount: number;   // Nombre de loyers en retard (status != 'paid' && currentDay > billing_day)
    paidCount: number;      // Nombre de loyers payés (status === 'paid')
}

// Interfaces minimales pour découplage
export interface LeaseInput {
    id: string;
    monthly_amount: number;
    status: string; // 'active' | 'terminated' | 'pending' usually (string from DB)
    start_date: string | null;
    billing_day: number; // Used for overdue calculation
}

export interface TransactionInput {
    id: string; // Pour unicité
    lease_id: string;
    amount_due: number;
    amount_paid?: number | null; // La clé du correctif (peut être null/undefined)
    status: string; // 'pending' | 'paid' | 'overdue' etc.
    period_date?: string | Date; // Date de référence "due_date" ou période
    created_at?: string;
}

/**
 * Calcule les KPI financiers pour un mois donné
 * Source de vérité : Lease (Bail) pour le dû, Transaction pour l'encaissé.
 */
export function calculateFinancials(
    leases: LeaseInput[],
    transactions: TransactionInput[],
    targetDate: Date
): FinancialKPIs {

    let totalExpected = 0;
    let totalCollected = 0;

    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    const currentDay = new Date().getDate();
    const isTargetMonthCurrent = isSameMonth(new Date(), targetDate);

    // 1. Itération sur les BAUX (Source de vérité pour l'Attendu)
    leases.forEach(lease => {
        // On considère un bail actif s'il est statut 'active'
        // (Pour être plus précis, on pourrait vérifier les dates start/end par rapport au mois cible)
        if (lease.status === 'active') {

            // Règle 1 : L'attendu vient du bail
            const monthlyRent = Number(lease.monthly_amount) || 0;
            totalExpected += monthlyRent;

            // 2. Chercher la transaction correspondante pour ce bail ce mois-ci
            // On cherche une transaction liée à ce lease_id, dans le mois cible.
            // Note: Les transactions n'ont pas forcément une "due_date" parfaite en base,
            // souvent on filtre les transactions passées en argument car elles ont déjà été filtrées par mois.
            // Ici on va assumer que `transactions` contient TOUTES les transactions du mois cible.
            const leaseTransaction = transactions.find(t => t.lease_id === lease.id);

            if (leaseTransaction) {
                // Règle 2 : On prend ce qui a été RÉELLEMENT payé
                // Priorité 1: amount_paid (si la colonne existe)
                // Priorité 2: amount_due si status='paid' (fallback pour compatibilité)
                // Priorité 3: 0 (non payé)
                let paidAmount = 0;
                if (leaseTransaction.status === 'paid') {
                    // Si marqué comme payé, utiliser amount_paid (ou amount_due en fallback)
                    paidAmount = Number(leaseTransaction.amount_paid) || Number(leaseTransaction.amount_due) || 0;
                } else {
                    // Si non payé (pending/overdue), amount_paid pourrait être un acompte partiel
                    paidAmount = Number(leaseTransaction.amount_paid) || 0;
                }
                totalCollected += paidAmount;

                // Comptage des statuts - SYNCHRONISÉ AVEC L'UI
                // L'UI vérifie le billing_day pour déterminer si c'est en retard
                if (leaseTransaction.status === 'paid') {
                    paidCount++;
                } else {
                    // Pour les transactions non payées (pending, overdue, etc.)
                    // On vérifie si le billing_day est dépassé dans le mois courant
                    const billingDay = lease.billing_day || 5;
                    if (isTargetMonthCurrent && currentDay > billingDay) {
                        overdueCount++;
                    } else {
                        pendingCount++;
                    }
                }
            } else {
                // 3. Pas de transaction = "En attente" virtuelle (ou retard)
                // "Revenus Fantômes" gérés ici : on ajoute au totalExpected (déjà fait plus haut),
                // et on considère comme non payé (collected += 0).

                // Déterminer si c'est "Pending" ou "Overdue" (Retard)
                // Si on est dans le mois courant et que le jour de facturation est passé, c'est un retard.
                const billingDay = lease.billing_day || 5;
                if (isTargetMonthCurrent && currentDay > billingDay) {
                    overdueCount++;
                } else {
                    pendingCount++;
                }
            }
        }
    });

    // Calcul des ratios
    const collectionRate = totalExpected > 0
        ? Math.round((totalCollected / totalExpected) * 100)
        : 0;

    return {
        totalExpected,
        totalCollected,
        collectionRate,
        occupancyRate: 0,
        pendingCount,
        overdueCount,
        paidCount
    };
}

/**
 * Calcule le statut d'affichage d'une transaction (synchronisé avec l'UI)
 *
 * @param transactionStatus - Statut en base de données
 * @param billingDay - Jour de facturation (défaut: 5)
 * @param isCurrentMonth - Si on regarde le mois en cours
 * @returns 'paid' | 'pending' | 'overdue'
 */
export function calculateDisplayStatus(
    transactionStatus: string,
    billingDay: number = 5,
    isCurrentMonth: boolean = true
): 'paid' | 'pending' | 'overdue' {
    if (transactionStatus === 'paid') {
        return 'paid';
    }

    // Pour les transactions non payées, vérifier si en retard
    const currentDay = new Date().getDate();
    if (isCurrentMonth && currentDay > billingDay) {
        return 'overdue';
    }

    return 'pending';
}

/**
 * PILIER 2 : Le Gardien (Write-Security)
 * Vérifie strictement si un email est déjà utilisé pour un bail ACTIF
 */
export async function validateTenantCreation(
    email: string,
    supabaseClient: SupabaseClient,
    ownerId: string
): Promise<{ valid: boolean; error?: string }> {
    if (!email) return { valid: true }; // Pas d'email, pas de conflit

    const { data: existingLeases, error } = await supabaseClient
        .from('leases')
        .select('id, tenant_name')
        .eq('owner_id', ownerId)
        .ilike('tenant_email', email.trim())
        .neq('status', 'terminated') // On ignore les anciens baux résiliés
        .limit(1);

    if (error) {
        console.error("FinanceGuard Error:", error);
        return { valid: false, error: "Erreur de vérification des doublons" };
    }

    if (existingLeases && existingLeases.length > 0) {
        return {
            valid: false,
            error: `⛔ ERREUR : L'email ${email} est déjà utilisé par "${existingLeases[0].tenant_name}". doublon interdit.`
        };
    }

    return { valid: true };
}
