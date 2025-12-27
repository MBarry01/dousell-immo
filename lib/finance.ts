import { isSameMonth, isWithinInterval, startOfMonth, endOfMonth, parseISO, isAfter } from 'date-fns';

export interface FinancialKPIs {
    totalExpected: number;  // Basé sur les baux actifs
    totalCollected: number; // Basé sur les versements réels (amount_paid)
    collectionRate: number; // Taux de recouvrement (Collected / Expected)
    occupancyRate: number;  // Taux d'occupation financier (Placeholder)
    pendingCount: number;   // Nombre de loyers en attente
    overdueCount: number;   // Nombre de loyers en retard
    paidCount: number;      // Nombre de loyers payés
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
                // On additionne amount_paid s'il existe, sinon 0.
                const paidAmount = Number(leaseTransaction.amount_paid) || 0;
                totalCollected += paidAmount;

                // Comptage des statuts basé sur la transaction
                if (leaseTransaction.status === 'paid') {
                    paidCount++;
                } else if (leaseTransaction.status === 'overdue') {
                    overdueCount++;
                } else {
                    pendingCount++;
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
 * PILIER 2 : Le Gardien (Write-Security)
 * Vérifie strictement si un email est déjà utilisé pour un bail ACTIF
 */
export async function validateTenantCreation(
    email: string,
    supabaseClient: any,
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
