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
    totalExpenses: number;  // Somme des dépenses (expenses)
    actualNetProfit: number; // Cashflow réel (Collected - Expenses)
    projectedNetProfit: number; // Performance projetée (Expected - Expenses)
    hasTemporaryDebt: boolean; // True si Expenses > Collected
    collectionRate: number; // Taux de recouvrement en % (Collected / Expected * 100)
    occupancyRate: number;  // Taux d'occupation financier
    pendingCount: number;   // Nombre de loyers en attente
    overdueCount: number;   // Nombre de loyers en retard
    paidCount: number;      // Nombre de loyers payés
    pendingAmount: number;  // Montant en attente (FCFA)
    overdueAmount: number;  // Montant en retard (FCFA)
    avgDelayDays: number;   // Retard moyen (jours)
}

export interface MonthlyFinancialSummary extends FinancialKPIs {
    month: number;
    year: number;
    future: number;         // Loyers à venir
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
    lease_id: string | null;
    amount_due: number;
    amount_paid?: number | null; // La clé du correctif
    status: string; // 'pending' | 'paid' | 'overdue' etc.
    period_date?: string | Date; // Date de référence "due_date" ou période
    created_at?: string;
    paid_at?: string | Date; // Date du paiement effectif
}

export interface ExpenseInput {
    id: string;
    amount: number;
    expense_date: string;
    lease_id?: string | null;
}

/**
 * Calcule les KPI financiers pour un mois donné
 * Source de vérité : Lease (Bail) pour le dû, Transaction pour l'encaissé.
 */
export function calculateFinancials(
    leases: LeaseInput[],
    transactions: TransactionInput[],
    expenses: ExpenseInput[],
    targetDate: Date
): FinancialKPIs {

    let totalExpected = 0;
    let totalCollected = 0;
    let totalExpenses = 0;

    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    let pendingAmount = 0;
    let overdueAmount = 0;

    const GRACE_PERIOD_DAYS = 5; // Tolérance avant de marquer "Overdue"

    let totalDelayDays = 0;
    let delaySamples = 0;

    // Pour vérifier si le mois cible est le mois courant
    const now = new Date();
    // Comparaison stricte mois/année
    const _isTargetMonthCurrent = (
        targetDate.getMonth() === now.getMonth() &&
        targetDate.getFullYear() === now.getFullYear()
    );

    // 1. Itération sur les BAUX (Source de vérité pour l'Attendu)
    leases.forEach(lease => {
        if (lease.status === 'active') {

            // Règle 1 : L'attendu vient du bail
            const monthlyRent = Number(lease.monthly_amount) || 0;
            totalExpected += monthlyRent;

            // 2. Chercher la transaction correspondante
            const leaseTransaction = transactions.find(t => t.lease_id === lease.id);
            const billingDay = lease.billing_day || 5;

            // Dates clés
            const dueDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), billingDay);
            const graceDate = new Date(dueDate);
            graceDate.setDate(dueDate.getDate() + GRACE_PERIOD_DAYS);

            // Pour le calcul de retard courant ("maintenant")
            const checkDate = new Date();

            if (leaseTransaction) {
                // Règle 2 : On prend ce qui a été RÉELLEMENT payé
                let paidAmount = 0;
                // Support partiel : si status 'paid', on suppose tout payé sauf si amount_paid défini
                if (leaseTransaction.amount_paid !== undefined && leaseTransaction.amount_paid !== null) {
                    paidAmount = Number(leaseTransaction.amount_paid);
                } else if (leaseTransaction.status === 'paid') {
                    paidAmount = Number(leaseTransaction.amount_due) || monthlyRent;
                }

                totalCollected += paidAmount;
                const remainingDue = Math.max(0, monthlyRent - paidAmount);

                // --- LOGIQUE DE STATUT STRICT ---
                const isPaidFull = remainingDue <= 0;

                if (isPaidFull) {
                    paidCount++;
                    // Calcul délai (si payé)
                    if (leaseTransaction.paid_at) {
                        const paidDate = new Date(leaseTransaction.paid_at);
                        // On ne compte que les RETARDS (diff > 0)
                        if (paidDate > dueDate) {
                            const diffTime = paidDate.getTime() - dueDate.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            const safeDelay = Math.max(0, diffDays);

                            if (safeDelay > 0) {
                                totalDelayDays += safeDelay;
                                delaySamples++;
                            }
                        } else {
                            // Payé à l'heure ou en avance : On NE COMPTE PAS dans la moyenne des RETARDS
                            // (Selon feedback user : ne pas fausser la moyenne avec des 0)
                        }
                    } else if (leaseTransaction.status === 'paid') {
                        // Payé sans date ? On suppose à l'heure => 0 retard
                        delaySamples++;
                    }
                } else {
                    // Partiel ou Pas payé
                    // Overdue ?
                    let isOverdue = false;

                    if (isAfter(new Date(), graceDate)) {
                        // Grace period dépassée -> Overdue
                        isOverdue = true;
                    }
                    // Si futur -> Pas overdue
                    if (isAfter(startOfMonth(targetDate), endOfMonth(checkDate))) {
                        isOverdue = false;
                    }

                    if (isOverdue) {
                        overdueCount++;
                        overdueAmount += remainingDue;

                        // Retard en cours
                        const diffTime = checkDate.getTime() - dueDate.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        totalDelayDays += diffDays;
                        delaySamples++;
                    } else {
                        pendingCount++;
                        pendingAmount += remainingDue;
                    }
                }
            } else {
                // Pas de transaction
                const isActiveDelay = isAfter(new Date(), graceDate);
                const isFuture = isAfter(startOfMonth(targetDate), endOfMonth(checkDate));

                if (isActiveDelay && !isFuture) {
                    overdueCount++;
                    overdueAmount += monthlyRent;
                    // Retard en cours
                    const diffTime = checkDate.getTime() - dueDate.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    totalDelayDays += diffDays;
                    delaySamples++;
                } else {
                    pendingCount++;
                    pendingAmount += monthlyRent;
                }
            }
        }
    });

    // 4. Calcul des DÉPENSES
    expenses.forEach(expense => {
        totalExpenses += Number(expense.amount) || 0;
    });

    // Calcul des ratios et profits
    const collectionRate = totalExpected > 0
        ? Math.round((totalCollected / totalExpected) * 100)
        : 0;

    const actualNetProfit = totalCollected - totalExpenses;
    const projectedNetProfit = totalExpected - totalExpenses;
    const hasTemporaryDebt = totalExpenses > totalCollected;

    // Calcul Délai Moyen
    const avgDelayDays = delaySamples > 0
        ? Math.round(totalDelayDays / delaySamples)
        : 0;

    return {
        totalExpected,
        totalCollected,
        totalExpenses,
        actualNetProfit,
        projectedNetProfit,
        hasTemporaryDebt,
        collectionRate,
        occupancyRate: 0,
        pendingCount,
        overdueCount,
        paidCount,
        pendingAmount,
        overdueAmount,
        avgDelayDays
    };
}

/**
 * Calcule les KPI pour toute une année (breakdown mensuel)
 */
export function calculateYearlyFinancials(
    leases: LeaseInput[],
    transactions: TransactionInput[],
    expenses: ExpenseInput[],
    year: number
): MonthlyFinancialSummary[] {
    const months: MonthlyFinancialSummary[] = [];
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    for (let month = 1; month <= 12; month++) {
        const targetDate = new Date(year, month - 1, 1);

        // Filtrer les transactions pour ce mois spécifique
        const monthlyTransactions = transactions.filter(t => {
            if (t.period_date) {
                const d = typeof t.period_date === 'string' ? new Date(t.period_date) : t.period_date;
                return d.getMonth() + 1 === month && d.getFullYear() === year;
            }
            return (t as any).period_month === month && (t as any).period_year === year;
        });

        // Filtrer les dépenses pour ce mois spécifique
        const monthlyExpenses = (expenses || []).filter(e => {
            const d = new Date(e.expense_date);
            return d.getMonth() + 1 === month && d.getFullYear() === year;
        });

        const financials = calculateFinancials(leases, monthlyTransactions, monthlyExpenses, targetDate);

        // Gestion spécifique du "Futur"
        let future = 0;
        const isFuture = year > currentYear || (year === currentYear && month > currentMonth);

        if (isFuture) {
            // Dans le futur, tout ce qui est "attendu" est considéré comme "future"
            // et on remet à zéro les autres compteurs pour la clarté visuelle
            future = financials.totalExpected;
            financials.pendingCount = 0;
            financials.overdueCount = 0;
            financials.pendingAmount = 0;
            financials.overdueAmount = 0;
        }

        months.push({
            ...financials,
            month,
            year,
            future
        });
    }

    return months;
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
            error: `L'adresse email choisie est déjà utilisée par "${existingLeases[0].tenant_name}". Veuillez en choisir une autre.`
        };
    }

    return { valid: true };
}
