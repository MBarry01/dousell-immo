"use server"

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { invalidateCacheBatch } from '@/lib/cache/cache-aside';
import { invalidateRentalCaches } from '@/lib/cache/invalidation';
import { revalidatePath } from 'next/cache';
import { validateTenantCreation } from '@/lib/finance';
import { sendEmail } from '@/lib/mail';
import { getPropertiesByOwner } from "@/services/propertyService.cached";
import { getLeasesByOwner as getLeasesByOwnerService } from "@/services/rentalService.cached";

/**
 * Récupérer les propriétés de l'utilisateur connecté (pour les listes déroulantes)
 */
export async function getProperties() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Non connecté" };

    try {
        const properties = await getPropertiesByOwner(user.id);
        return { success: true, data: properties };
    } catch (error) {
        console.error("Erreur getProperties:", error);
        return { success: false, error: "Erreur lors de la récupération des biens" };
    }
}

/**
 * Récupérer tous les baux de l'utilisateur (pour les listes déroulantes)
 */
export async function getLeasesByOwner() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Non connecté" };

    try {
        // On récupère tous les baux (actifs et terminés) pour l'historique
        const leases = await getLeasesByOwnerService(user.id, "all");
        return { success: true, data: leases };
    } catch (error) {
        console.error("Erreur getLeasesByOwner:", error);
        return { success: false, error: "Erreur lors de la récupération des baux" };
    }
}

/**
 * Calcule les statistiques financières en temps réel
 */
export async function getRentalStats() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { collected: "0", pending: "0", overdue: "0" };

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // 1. Récupérer tous les baux actifs (revenus attendus)
    const { data: activeLeases } = await supabase
        .from('leases')
        .select('id, monthly_amount, billing_day')
        .eq('owner_id', user.id)
        .eq('status', 'active');

    // 2. Récupérer les transactions de ce mois
    const { data: paidTrans } = await supabase
        .from('rental_transactions')
        .select('lease_id, amount_due, status')
        .eq('period_month', currentMonth)
        .eq('period_year', currentYear)
        // On filtre sur les leases du user via le join implicite ou une requête séparée.
        // Ici on suppose que rental_transactions est fiable, mais pour sécu on peut join.
        // Cependant pour perf on va filtrer en JS avec la liste des activeLeases
        .in('lease_id', (activeLeases || []).map(l => l.id));

    let collected = 0;
    let pending = 0;
    let overdue = 0;

    const paidLeaseIds = new Set();

    // Traiter les paiements existants
    paidTrans?.forEach(t => {
        if (t.status === 'paid') {
            collected += Number(t.amount_due);
            paidLeaseIds.add(t.lease_id);
        }
    });

    // 3. Pour chaque bail actif, vérifier le statut
    activeLeases?.forEach(lease => {
        // Si le bail a déjà été payé (transaction 'paid' trouvée), on ne compte plus en pending/overdue
        if (paidLeaseIds.has(lease.id)) return;

        const amount = Number(lease.monthly_amount);

        // Si pas payé, c'est soit pending, soit overdue selon la date
        if (currentDay > (lease.billing_day || 5)) {
            overdue += amount;
        } else {
            pending += amount;
        }
    });

    return {
        collected: collected.toLocaleString('fr-FR'),
        pending: pending.toLocaleString('fr-FR'),
        overdue: overdue.toLocaleString('fr-FR')
    };
}

/**
 * Calcule les KPIs avancés pour le dashboard
 * - Taux d'occupation (biens loués / total)
 * - Délai moyen de paiement
 * - Taux d'impayés
 * - Revenu moyen par bien
 */
export async function getAdvancedStats() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return {
        occupancyRate: 0,
        avgPaymentDelay: 0,
        unpaidRate: 0,
        avgRevenuePerProperty: 0,
        totalProperties: 0,
        activeLeases: 0
    };

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // 1. Récupérer tous les biens du propriétaire
    const { data: properties, count: totalPropertiesCount } = await supabase
        .from('properties')
        .select('id', { count: 'exact' })
        .eq('owner_id', user.id);

    const totalProperties = totalPropertiesCount || 0;

    // 2. Récupérer tous les baux actifs
    const { data: activeLeases } = await supabase
        .from('leases')
        .select('id, monthly_amount, billing_day, property_address')
        .eq('owner_id', user.id)
        .eq('status', 'active');

    const activeLeasesCount = activeLeases?.length || 0;

    // 3. Calculer le taux d'occupation
    // Si pas de propriétés enregistrées, on compte les adresses uniques des baux
    // Le taux représente "combien de vos biens sont actuellement loués"
    let occupancyBase = totalProperties;

    if (totalProperties === 0 && activeLeasesCount > 0) {
        // Fallback : compter les adresses uniques dans les baux comme "nombre de biens"
        const uniqueAddresses = new Set((activeLeases || []).map(l => l.property_address?.toLowerCase().trim()));
        occupancyBase = uniqueAddresses.size;
    }

    // Calculer le taux et le plafonner à 100%
    const rawOccupancyRate = occupancyBase > 0
        ? Math.round((activeLeasesCount / occupancyBase) * 100)
        : (activeLeasesCount > 0 ? 100 : 0);

    const occupancyRate = Math.min(rawOccupancyRate, 100); // Cap at 100%

    // 4. Récupérer les transactions payées pour calculer le délai moyen
    const leaseIds = (activeLeases || []).map(l => l.id);

    const { data: paidTransactions } = await supabase
        .from('rental_transactions')
        .select('lease_id, amount_due, status, paid_at, period_month, period_year')
        .in('lease_id', leaseIds.length > 0 ? leaseIds : ['00000000-0000-0000-0000-000000000000'])
        .eq('status', 'paid')
        .not('paid_at', 'is', null);

    // 5. Calculer le délai moyen de paiement (jours entre le billing_day et paid_at)
    let totalDelay = 0;
    let delayCount = 0;

    paidTransactions?.forEach(t => {
        const lease = activeLeases?.find(l => l.id === t.lease_id);
        if (lease && t.paid_at && t.period_month && t.period_year) {
            const billingDay = lease.billing_day || 5;
            const expectedDate = new Date(t.period_year, t.period_month - 1, billingDay);
            const paidDate = new Date(t.paid_at);
            const diffDays = Math.floor((paidDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0) { // Only count late payments
                totalDelay += diffDays;
                delayCount++;
            }
        }
    });

    const avgPaymentDelay = delayCount > 0 ? Math.round(totalDelay / delayCount) : 0;

    // 6. Calculer le taux d'impayés ce mois
    const { data: currentMonthTrans } = await supabase
        .from('rental_transactions')
        .select('lease_id, status')
        .in('lease_id', leaseIds.length > 0 ? leaseIds : ['00000000-0000-0000-0000-000000000000'])
        .eq('period_month', currentMonth)
        .eq('period_year', currentYear);

    const unpaidThisMonth = currentMonthTrans?.filter(t => t.status !== 'paid').length || 0;
    const totalThisMonth = currentMonthTrans?.length || activeLeasesCount;
    const unpaidRate = totalThisMonth > 0
        ? Math.round((unpaidThisMonth / totalThisMonth) * 100)
        : 0;

    // 7. Calculer le revenu moyen par bien
    const totalMonthlyRevenue = (activeLeases || []).reduce((sum, l) => sum + Number(l.monthly_amount || 0), 0);
    const avgRevenuePerProperty = activeLeasesCount > 0
        ? Math.round(totalMonthlyRevenue / activeLeasesCount)
        : 0;

    return {
        occupancyRate,
        avgPaymentDelay,
        unpaidRate,
        avgRevenuePerProperty,
        totalProperties,
        activeLeases: activeLeasesCount
    };
}

/**
 * Récupère l'historique des revenus sur les N derniers mois
 */
export async function getRevenueHistory(months: number = 12) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // Récupérer tous les baux actifs pour avoir les IDs
    const { data: leases } = await supabase
        .from('leases')
        .select('id, monthly_amount')
        .eq('owner_id', user.id);

    const leaseIds = (leases || []).map(l => l.id);

    if (leaseIds.length === 0) return [];

    // Calculer la plage de dates
    const today = new Date();
    const history: { month: string; year: number; monthNum: number; collected: number; expected: number }[] = [];

    for (let i = months - 1; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthNum = date.getMonth() + 1;
        const year = date.getFullYear();
        const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });

        // Récupérer les transactions pour ce mois
        const { data: transactions } = await supabase
            .from('rental_transactions')
            .select('amount_due, status')
            .in('lease_id', leaseIds)
            .eq('period_month', monthNum)
            .eq('period_year', year);

        const collected = (transactions || [])
            .filter(t => t.status === 'paid')
            .reduce((sum, t) => sum + Number(t.amount_due || 0), 0);

        const expected = (transactions || [])
            .reduce((sum, t) => sum + Number(t.amount_due || 0), 0);

        history.push({
            month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
            year,
            monthNum,
            collected,
            expected
        });
    }

    return history;
}

/**
 * Fonction utilitaire pour envoyer les données à n8n
 * Les webhooks n8n doivent être configurés pour recevoir ces événements
 */
async function triggerN8N(webhookPath: string, payload: Record<string, unknown>) {
    const N8N_URL = process.env.N8N_WEBHOOK_URL; // URL de l'instance n8n
    console.log(`[triggerN8N] Tentative envoi vers ${webhookPath}`, {
        hasUrl: !!N8N_URL,
        payloadKeys: Object.keys(payload)
    });

    if (!N8N_URL) {
        console.warn('N8N_WEBHOOK_URL non configuré - webhook ignoré');
        return;
    }

    try {
        const response = await fetch(`${N8N_URL}/${webhookPath}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...payload,
                timestamp: new Date().toISOString(),
                source: 'dousell-immo'
            }),
        });

        if (!response.ok) {
            console.error(`Webhook n8n (${webhookPath}) - Erreur HTTP:`, response.status, await response.text());
        } else {
            console.log(`[triggerN8N] Succès envoi ${webhookPath}`);
        }
    } catch (err) {
        console.error(`Erreur Webhook n8n (${webhookPath}):`, err);
    }
}

/**
 * Enregistre un nouveau locataire et son bail
 * Déclenche la génération automatique du contrat PDF via n8n
 */
export async function createNewLease(formData: Record<string, unknown>) {
    const supabase = await createClient();

    // Récupérer l'utilisateur courant
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error("Création bail: utilisateur non authentifié");
        return { success: false, error: "Non autorisé" };
    }

    // IMPORTANT: On force l'owner_id de l'utilisateur connecté (sécurité)
    const finalData = {
        ...formData,
        owner_id: user.id  // Toujours forcer l'ID du propriétaire connecté
    };

    // Extraire deposit_months pour ne pas l'envoyer à la table leases
    const depositMonths = (finalData as any).deposit_months || 2;
    delete (finalData as any).deposit_months;

    // Extraire custom_data (champs personnalisés de l'import CSV)
    const customData = (finalData as any).custom_data || {};
    delete (finalData as any).custom_data;

    // Ajouter custom_data à finalData seulement s'il n'est pas vide
    if (Object.keys(customData).length > 0) {
        (finalData as any).custom_data = customData;
    }

    // 1. Vérification STRICTE d'unicité via FinanceGuard (Pilier 2)
    const emailToCheck = (finalData as Record<string, unknown>).tenant_email as string | undefined;
    if (emailToCheck) {
        const validation = await validateTenantCreation(emailToCheck, supabase, user.id);

        if (!validation.valid) {
            return {
                success: false,
                error: validation.error || "Erreur de validation"
            };
        }
    }

    // 1.5 Vérifier que le profil utilisateur existe (Contrainte FK leases_owner_id_fkey)
    const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

    if (!userProfile) {
        // Fallback: Créer le profil s'il n'existe pas (Mode résilient)
        const { error: insertProfileError } = await supabase
            .from('profiles')
            .insert([{
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Propriétaire',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }]);

        if (insertProfileError) {
            console.error("Erreur auto-création profil:", insertProfileError);
            return { success: false, error: "Impossible de créer le bail : Votre profil propriétaire est introuvable." };
        }

        // IMPORTANT: Invalider le cache du profil après création
        await invalidateCacheBatch([`owner_profile:${user.id}`], 'rentals');
    }

    const { data: lease, error } = await supabase
        .from('leases')
        .insert([finalData])
        .select()
        .single();

    if (error) {
        console.error("Erreur création bail:", error.message);
        return { success: false, error: error.message };
    }

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const monthlyAmount = Number(lease.monthly_amount);

    // 2. Créer transaction CAUTION (Mois 0)
    // On utilise month=0 pour identifier la caution dans l'historique sans changer le schéma
    if (depositMonths > 0) {
        const depositAmount = monthlyAmount * depositMonths;
        const { error: depositError } = await supabase
            .from('rental_transactions')
            .insert([{
                lease_id: lease.id,
                period_month: 0, // Convention pour Caution
                period_year: currentYear,
                amount_due: depositAmount,
                status: 'pending',
                period_start: today.toISOString().split('T')[0],
                period_end: today.toISOString().split('T')[0],
                reminder_sent: false
            }]);

        if (depositError) console.error("Erreur création caution:", depositError);
    }

    // 3. Créer automatiquement la transaction pour le mois en cours (Loyer)
    const { error: transError } = await supabase
        .from('rental_transactions')
        .insert([{
            lease_id: lease.id,
            period_month: currentMonth,
            period_year: currentYear,
            amount_due: monthlyAmount,
            status: 'pending',
            period_start: new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0],
            period_end: new Date(currentYear, currentMonth, 0).toISOString().split('T')[0],
            reminder_sent: false
        }]);

    if (transError) {
        console.error("Erreur création transaction:", transError.message);
        // On ne bloque pas la création du bail, mais on log l'erreur
    }

    // DÉCLENCHEUR N8N : Génération du contrat de bail PDF (email)
    // Note: On ne l'envoie plus automatiquement ici si on veut faire un "Pack de Bienvenue" groupé
    // MAIS pour l'instant on garde la génération du PDF pour qu'il soit prêt.
    await triggerN8N('generate-lease-pdf', {
        leaseId: lease.id,
        tenantName: lease.tenant_name,
        tenantEmail: lease.tenant_email,
        tenantPhone: lease.tenant_phone,
        amount: lease.monthly_amount,
        currency: 'FCFA',
        startDate: lease.start_date,
        billingDay: lease.billing_day,
        ownerEmail: user.email,
        ownerId: user.id
    });

    // Invalidation complète du cache pour mise à jour UI immédiate
    await invalidateRentalCaches(user.id, lease.id, {
        invalidateLeases: true,
        invalidateTransactions: true,
        invalidateStats: true
    });

    // Invalider aussi le cache du profil propriétaire (pour s'assurer qu'il s'affiche)
    await invalidateCacheBatch([`owner_profile:${user.id}`], 'rentals');

    revalidatePath('/gestion');
    revalidatePath('/gestion/locataires');
    return { success: true, id: lease.id };
}

/**
 * Envoie le "Pack de Bienvenue" au locataire
 * Comprend : Lien Invitation + Contrat PDF (en pièce jointe)
 * Envoi direct via Nodemailer (sans n8n)
 */
export async function sendWelcomePack(leaseId: string) {
    console.log("[sendWelcomePack] Start for lease:", leaseId);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error("[sendWelcomePack] User not found");
        return { success: false, error: "Non autorisé" };
    }

    // 1. Récupérer les infos du bail
    const { data: lease } = await supabase
        .from('leases')
        .select('*, lease_pdf_url')
        .eq('id', leaseId)
        .single();

    if (!lease) {
        console.error("[sendWelcomePack] Lease not found");
        return { success: false, error: "Bail introuvable" };
    }

    // 2. Récupérer le profil du propriétaire
    const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, full_name, company_address')
        .eq('id', user.id)
        .maybeSingle();

    const ownerName = profile?.company_name || profile?.full_name || "Votre Gestionnaire";

    // 3. Générer le lien d'invitation (Magic Link) via Admin API
    let inviteLink = "https://doussell-immo.com/auth/login"; // Fallback

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
            console.log("[sendWelcomePack] Generating magic link...");
            const adminAuth = createAdminClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            ).auth;

            const { data: linkData, error: linkError } = await adminAuth.admin.generateLink({
                type: 'magiclink',
                email: lease.tenant_email,
                options: {
                    redirectTo: 'https://doussell-immo.com/espace-locataire'
                }
            });

            if (linkError) {
                console.error("[sendWelcomePack] Link gen error:", linkError);
            } else if (linkData?.properties?.action_link) {
                inviteLink = linkData.properties.action_link;
                console.log("[sendWelcomePack] Magic link generated successfully");
            }
        } catch (e) {
            console.error("[sendWelcomePack] Erreur génération lien admin:", e);
        }
    } else {
        console.warn("[sendWelcomePack] No SERVICE_ROLE_KEY found, using fallback link");
    }

    // 4. Préparer les pièces jointes (Contrat PDF + Reçu de Caution + Quittance si applicable)
    const attachments: Array<{ filename: string; content: Buffer | string; contentType?: string }> = [];

    // IMPORTANT: Re-fetch lease data to get the latest lease_pdf_url (may have been updated by generateLeaseContract)
    const { data: freshLease } = await supabase
        .from('leases')
        .select('*, lease_pdf_url')
        .eq('id', leaseId)
        .single();

    console.log("[sendWelcomePack] Fresh lease data - PDF URL:", freshLease?.lease_pdf_url || "NOT SET");

    // 4a. Contrat de bail (si déjà généré)
    if (freshLease?.lease_pdf_url) {
        try {
            console.log("[sendWelcomePack] Fetching contract PDF from:", freshLease.lease_pdf_url);
            const pdfResponse = await fetch(freshLease.lease_pdf_url);
            if (pdfResponse.ok) {
                const pdfArrayBuffer = await pdfResponse.arrayBuffer();
                attachments.push({
                    filename: `Contrat_Bail_${lease.tenant_name.replace(/\s+/g, '_')}.pdf`,
                    content: Buffer.from(pdfArrayBuffer),
                    contentType: 'application/pdf'
                });
                console.log("[sendWelcomePack] Contract PDF attached");
            } else {
                console.error("[sendWelcomePack] Failed to fetch contract PDF, status:", pdfResponse.status);
            }
        } catch (e) {
            console.error("[sendWelcomePack] Error fetching contract PDF:", e);
        }
    } else {
        console.log("[sendWelcomePack] No contract PDF URL available - skipping contract attachment");
    }

    // 4b. Reçu de Caution (si caution payée)
    try {
        // Vérifier si la caution est payée
        console.log("[sendWelcomePack] Looking for deposit transaction with lease_id:", leaseId, "period_month: 0, status: paid");
        const { data: depositTx, error: depositError } = await supabase
            .from('rental_transactions')
            .select('*')
            .eq('lease_id', leaseId)
            .eq('period_month', 0) // Caution = mois 0
            .eq('status', 'paid')
            .maybeSingle();

        console.log("[sendWelcomePack] Deposit tx found:", depositTx ? `YES (amount: ${depositTx.amount_due})` : "NO", depositError ? `Error: ${depositError.message}` : "");

        if (depositTx) {
            console.log("[sendWelcomePack] Generating deposit receipt PDF...");
            const ReactPDF = await import('@react-pdf/renderer');
            const { createDepositReceiptDocument } = await import('@/components/pdf/DepositReceiptPDF');

            // Récupérer le profil complet pour le PDF
            const { data: fullProfile } = await supabase
                .from('profiles')
                .select('company_name, full_name, company_address, company_ninea, logo_url, signature_url')
                .eq('id', user.id)
                .maybeSingle();

            const depositReceiptData = {
                tenantName: lease.tenant_name,
                tenantEmail: lease.tenant_email,
                tenantPhone: lease.tenant_phone,
                depositAmount: depositTx.amount_due,
                depositMonths: Math.round(depositTx.amount_due / lease.monthly_amount),
                monthlyRent: lease.monthly_amount,
                receiptNumber: `CAUT-${Date.now().toString().slice(-8)}`,
                ownerName: fullProfile?.company_name || fullProfile?.full_name || ownerName,
                ownerAddress: fullProfile?.company_address || '',
                ownerNinea: fullProfile?.company_ninea,
                ownerLogo: fullProfile?.logo_url,
                ownerSignature: fullProfile?.signature_url,
                propertyAddress: lease.property_address,
                leaseStartDate: new Date(lease.start_date).toLocaleDateString('fr-FR'),
            };

            const depositDoc = createDepositReceiptDocument(depositReceiptData);
            const stream = await ReactPDF.default.renderToStream(depositDoc);

            // Convertir le stream en buffer
            const chunks: Uint8Array[] = [];
            const depositBuffer = await new Promise<Buffer>((resolve, reject) => {
                stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
                stream.on('end', () => resolve(Buffer.concat(chunks)));
                stream.on('error', reject);
            });

            attachments.push({
                filename: `Recu_Caution_${lease.tenant_name.replace(/\s+/g, '_')}.pdf`,
                content: depositBuffer,
                contentType: 'application/pdf'
            });
            console.log("[sendWelcomePack] Deposit receipt PDF attached");
        }
    } catch (e) {
        console.error("[sendWelcomePack] Error generating deposit receipt:", e);
    }

    // 4c. Quittance de Loyer (si premier loyer payé)
    try {
        // Vérifier si le loyer du mois en cours est payé
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const { data: rentTx } = await supabase
            .from('rental_transactions')
            .select('*')
            .eq('lease_id', leaseId)
            .eq('period_month', currentMonth)
            .eq('period_year', currentYear)
            .eq('status', 'paid')
            .maybeSingle();

        if (rentTx) {
            console.log("[sendWelcomePack] Generating rent receipt PDF...");
            const ReactPDF = await import('@react-pdf/renderer');
            const { createQuittanceDocument } = await import('@/components/pdf/QuittancePDF_v2');

            // Récupérer le profil complet pour le PDF
            const { data: fullProfile } = await supabase
                .from('profiles')
                .select('company_name, full_name, company_address, company_ninea, logo_url, signature_url')
                .eq('id', user.id)
                .maybeSingle();

            const periodDate = new Date(rentTx.period_year, rentTx.period_month - 1);
            const lastDayOfMonth = new Date(rentTx.period_year, rentTx.period_month, 0).getDate();

            const quittanceData = {
                tenantName: lease.tenant_name,
                tenantEmail: lease.tenant_email,
                tenantPhone: lease.tenant_phone,
                tenantAddress: lease.property_address,
                amount: rentTx.amount_due,
                periodMonth: periodDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
                periodStart: `01/${String(rentTx.period_month).padStart(2, '0')}/${rentTx.period_year}`,
                periodEnd: `${lastDayOfMonth}/${String(rentTx.period_month).padStart(2, '0')}/${rentTx.period_year}`,
                receiptNumber: `QUITT-${Date.now().toString().slice(-8)}`,
                ownerName: fullProfile?.company_name || fullProfile?.full_name || ownerName,
                ownerAddress: fullProfile?.company_address || '',
                ownerNinea: fullProfile?.company_ninea,
                ownerLogo: fullProfile?.logo_url,
                ownerSignature: fullProfile?.signature_url,
                propertyAddress: lease.property_address,
            };

            const quittanceDoc = createQuittanceDocument(quittanceData);
            const stream = await ReactPDF.default.renderToStream(quittanceDoc);

            // Convertir le stream en buffer
            const chunks: Uint8Array[] = [];
            const quittanceBuffer = await new Promise<Buffer>((resolve, reject) => {
                stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
                stream.on('end', () => resolve(Buffer.concat(chunks)));
                stream.on('error', reject);
            });

            attachments.push({
                filename: `Quittance_${periodDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).replace(/\s+/g, '_')}_${lease.tenant_name.replace(/\s+/g, '_')}.pdf`,
                content: quittanceBuffer,
                contentType: 'application/pdf'
            });
            console.log("[sendWelcomePack] Rent receipt PDF attached");
        }
    } catch (e) {
        console.error("[sendWelcomePack] Error generating rent receipt:", e);
    }

    // 5. Construire le contenu HTML de l'email
    const documentsList = [];
    if (attachments.find(a => a.filename.includes('Contrat'))) documentsList.push('Contrat de bail');
    if (attachments.find(a => a.filename.includes('Caution'))) documentsList.push('Reçu de dépôt de garantie');
    if (attachments.find(a => a.filename.includes('Quittance'))) documentsList.push('Quittance de loyer');

    const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0;">Bienvenue ${lease.tenant_name} ! 🎉</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <p>Nous avons le plaisir de vous accueillir en tant que nouveau locataire.</p>
                
                <h3 style="color: #667eea;">📋 Récapitulatif de votre bail</h3>
                <ul style="background: white; padding: 20px 30px; border-radius: 8px; border-left: 4px solid #667eea;">
                    <li><strong>Adresse :</strong> ${lease.property_address}</li>
                    <li><strong>Loyer mensuel :</strong> ${new Intl.NumberFormat('fr-FR').format(lease.monthly_amount)} FCFA</li>
                    <li><strong>Date de début :</strong> ${new Date(lease.start_date).toLocaleDateString('fr-FR')}</li>
                    <li><strong>Jour de paiement :</strong> Le ${lease.billing_day} de chaque mois</li>
                </ul>

                <h3 style="color: #667eea;">🔗 Accéder à votre espace locataire</h3>
                <p>Cliquez sur le bouton ci-dessous pour accéder à votre espace personnel :</p>
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${inviteLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                        Accéder à mon espace
                    </a>
                </div>

                ${attachments.length > 0 ? `
                <h3 style="color: #667eea;">📎 Documents joints</h3>
                <ul style="background: white; padding: 15px 30px; border-radius: 8px; border-left: 4px solid #B8860B;">
                    ${documentsList.map(doc => `<li>📄 ${doc}</li>`).join('')}
                </ul>
                ` : ''}

                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <p>Cordialement,<br><strong>${ownerName}</strong></p>
                ${profile?.company_address ? `<p style="color: #666; font-size: 14px;">${profile.company_address}</p>` : ''}
                
                <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
                    Email généré automatiquement par Dousell Immo
                </p>
            </div>
        </body>
        </html>
    `;

    // 6. Envoyer l'email via Nodemailer (lib/mail.ts)
    try {
        const result = await sendEmail({
            to: lease.tenant_email,
            subject: `🏠 Bienvenue ${lease.tenant_name} - Votre Pack Locataire`,
            html: emailHtml,
            attachments: attachments.length > 0 ? attachments : undefined
        });

        console.log("[sendWelcomePack] Email sent successfully");

        // 7. Sauvegarder le pack dans la GED (user_documents)
        if (attachments.length > 0 && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            try {
                const { createClient: createAdminSupabase } = await import('@supabase/supabase-js');
                const supabaseAdmin = createAdminSupabase(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY
                );

                for (const attachment of attachments) {
                    const fileName = `${user.id}/welcome-pack/${leaseId}_${Date.now()}.pdf`;
                    const contentBuffer = typeof attachment.content === 'string'
                        ? Buffer.from(attachment.content)
                        : attachment.content;

                    // Upload vers Storage
                    const { error: uploadError } = await supabaseAdmin.storage
                        .from('verification-docs')
                        .upload(fileName, contentBuffer, {
                            contentType: 'application/pdf',
                            upsert: false
                        });

                    if (!uploadError) {
                        // Enregistrer dans user_documents
                        await supabaseAdmin.from('user_documents').insert({
                            user_id: user.id,
                            file_name: attachment.filename,
                            file_path: fileName,
                            file_type: 'welcome_pack',
                            file_size: contentBuffer.length,
                            mime_type: 'application/pdf',
                            source: 'generated',
                            lease_id: leaseId,
                            category: 'welcome_pack',
                            description: `Pack de bienvenue - ${lease.tenant_name}`
                        });
                        console.log("[sendWelcomePack] Document saved to GED:", fileName);
                    } else {
                        console.error("[sendWelcomePack] Storage upload error:", uploadError.message);
                    }
                }
            } catch (storageError) {
                console.error("[sendWelcomePack] GED storage error (non-blocking):", storageError);
            }
        }

        // 8. Invalider le cache et revalider les paths pour que l'UI se mette à jour
        try {
            await invalidateRentalCaches(user.id, leaseId, {
                invalidateLeases: true,
                invalidateTransactions: true,
                invalidateStats: true
            });
            revalidatePath('/gestion');
            revalidatePath(`/gestion/locataires/${leaseId}`);
            console.log("[sendWelcomePack] Cache invalidated and paths revalidated");
        } catch (e) {
            console.error("[sendWelcomePack] Cache invalidation error (non-blocking):", e);
        }

        return { success: true, message: "Pack de bienvenue envoyé !" };
    } catch (emailError) {
        console.error("[sendWelcomePack] Email error:", emailError);
        return { success: false, error: "Erreur lors de l'envoi de l'email" };
    }
}

/**
 * Marque un loyer comme payé
 * Déclenche l'envoi automatique de la quittance par EMAIL via n8n
 */
/**
 * Marque un loyer comme payé
 * Déclenche l'envoi automatique de la quittance par EMAIL via n8n
 * Si pas d'ID de transaction, en crée une pour le mois courant
 */
export async function confirmPayment(leaseId: string, transactionId?: string, month?: number, year?: number, silent: boolean = false) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Non autorisé" };

    let targetId = transactionId;

    // 1. Si pas de transactionID, on en crée une pour le mois actuel
    // 1. Si pas de transactionID, on cherche ou on crée
    if (!targetId) {
        // Déterminer la période cible (Mois sélectionné OU Mois actuel par défaut)
        const targetMonth = month !== undefined ? month : (new Date().getMonth() + 1);
        const targetYear = year || new Date().getFullYear();

        // Pour les CAUTIONS (month=0), on ne filtre PAS par année
        const isDeposit = targetMonth === 0;

        // A) Vérifier s'il existe DÉJÀ une transaction pour ce bail/mois(/année)
        let query = supabase
            .from('rental_transactions')
            .select('id, status')
            .eq('lease_id', leaseId)
            .eq('period_month', targetMonth);

        // Ne filtrer par année QUE pour les loyers (pas pour les cautions)
        if (!isDeposit) {
            query = query.eq('period_year', targetYear);
        }

        const { data: existingTx } = await query.limit(1).maybeSingle();

        console.log(`[confirmPayment] Looking for transaction: lease=${leaseId}, month=${targetMonth}, year=${isDeposit ? 'N/A (deposit)' : targetYear}, found=${!!existingTx}`);

        if (existingTx) {
            // Si elle existe déjà, on l'utilise (même si elle est payée, on la mettra à jour en 'paid')
            targetId = existingTx.id;
        } else {
            // B) Sinon, on en crée une nouvelle
            const { data: lease } = await supabase
                .from('leases')
                .select('monthly_amount')
                .eq('id', leaseId)
                .single();

            if (!lease) return { success: false, error: "Bail introuvable" };

            const { data: newTrans, error: insertError } = await supabase
                .from('rental_transactions')
                .insert([{
                    lease_id: leaseId,
                    period_month: targetMonth,
                    period_year: targetYear,
                    amount_due: lease.monthly_amount,
                    status: 'pending'
                }])
                .select()
                .single();

            if (insertError) {
                console.error("Erreur création transaction:", insertError.message);
                return { success: false, error: insertError.message };
            }
            targetId = newTrans.id;
        }
    }

    // 2. Mise à jour de la transaction en 'paid' avec récupération des données pour email
    const { data: trans, error } = await supabase
        .from('rental_transactions')
        .update({
            status: 'paid',
            paid_at: new Date().toISOString()
        })
        .eq('id', targetId)
        .select('*, leases(tenant_name, tenant_email, monthly_amount, owner_id, property_address)')
        .single();

    if (error) {
        console.error("Erreur confirmation paiement:", error.message);
        return { success: false, error: error.message };
    }

    // 4. Récupérer le profil du propriétaire pour les infos de l'agence
    const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, company_address, company_email, company_ninea, signature_url, logo_url, full_name')
        .eq('id', user.id)
        .maybeSingle();

    // 5. Envoi automatique de la quittance par email (Gmail direct) - SAUF si mode silent
    let emailSent = false;

    if (!silent && trans && trans.leases && trans.leases.tenant_email) {
        try {
            // Préparer les données pour la quittance
            const receiptData = {
                // Locataire
                tenantName: trans.leases.tenant_name || 'Locataire',
                tenantEmail: trans.leases.tenant_email,
                tenantAddress: trans.leases.property_address || '',

                // Montants
                amount: trans.amount_due || 0,

                // Période
                periodMonth: new Date(trans.period_year, trans.period_month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
                periodStart: `01/${String(trans.period_month).padStart(2, '0')}/${trans.period_year}`,
                periodEnd: `${new Date(trans.period_year, trans.period_month, 0).getDate()}/${String(trans.period_month).padStart(2, '0')}/${trans.period_year}`,

                // Référence
                receiptNumber: `QUITT-${Date.now().toString().slice(-8)}`,

                // ID pour sauvegarde automatique
                leaseId: trans.lease_id,

                // Propriétaire / Agence
                ownerName: profile?.company_name || profile?.full_name || 'Propriétaire',
                ownerAddress: profile?.company_address || '',
                ownerNinea: profile?.company_ninea || '',
                ownerLogo: profile?.logo_url || undefined,
                ownerSignature: profile?.signature_url || undefined,
                ownerEmail: profile?.company_email || undefined, // Email de l'agence (priorité)
                ownerAccountEmail: user.email, // Email du compte (fallback)

                // Propriété
                propertyAddress: trans.leases.property_address || 'Adresse non renseignée',
            };

            try {
                // Appeler l'API de génération de quittance (PDF)
                // Note: fetch interne nécessite l'URL absolue en Server Actions
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://doussell-immo.com';
                const start = performance.now();
                const response = await fetch(`${baseUrl}/api/send-receipt`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(receiptData),
                });
                console.log(`[confirmPayment] Receipt API call took ${Math.round(performance.now() - start)}ms`);

                if (response.ok) {
                    emailSent = true;
                    console.log("[confirmPayment] Quittance envoyée par email");
                } else {
                    console.error("[confirmPayment] Erreur API quittance:", await response.text());
                }
            } catch (err) {
                console.error("[confirmPayment] Exception API quittance:", err);
            }
        } catch (err) {
            console.error("Erreur générale quittance:", err);
        }
    }

    // PRIORITÉ : Invalider le cache AVANT revalidatePath pour màj UI immédiate
    try {
        // Invalidation directe de la clé de transaction spécifique
        await invalidateCacheBatch([`rental_transactions:${leaseId}`], 'rentals');

        // Puis invalidation globale
        await invalidateRentalCaches(user.id, leaseId, {
            invalidateLeases: true,
            invalidateTransactions: true,
            invalidateStats: true
        });
    } catch (e) {
        console.error("[confirmPayment] Cache invalidation error:", e);
    }

    // Revalider les pages APRÈS l'invalidation du cache
    revalidatePath('/gestion');
    revalidatePath(`/gestion/locataires/${leaseId}`);

    // Message personnalisé selon si l'email a été déclenché
    const message = emailSent
        ? `Paiement validé ! La quittance sera envoyée par email au locataire (${trans.leases?.tenant_email}) avec copie au propriétaire.`
        : "Paiement validé ! Vous pouvez générer la quittance manuellement.";

    return { success: true, message };
}

/**
 * Met à jour les informations d'un locataire/bail
 */
export async function updateLease(leaseId: string, data: {
    tenant_name?: string;
    tenant_phone?: string;
    tenant_email?: string;
    property_address?: string;
    monthly_amount?: number;
    billing_day?: number;
    start_date?: string;
    end_date?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Non autorisé" };
    }

    // Vérifier que le bail appartient à l'utilisateur
    const { data: lease } = await supabase
        .from('leases')
        .select('owner_id')
        .eq('id', leaseId)
        .single();

    if (!lease || lease.owner_id !== user.id) {
        return { success: false, error: "Bail non trouvé ou non autorisé" };
    }

    // Ne mettre à jour que les colonnes qui existent
    const updateData: Record<string, string | number | undefined> = {};
    if (data.tenant_name !== undefined) updateData.tenant_name = data.tenant_name;
    if (data.tenant_phone !== undefined) updateData.tenant_phone = data.tenant_phone;
    if (data.tenant_email !== undefined) updateData.tenant_email = data.tenant_email;
    if (data.property_address !== undefined) updateData.property_address = data.property_address;
    if (data.monthly_amount !== undefined) updateData.monthly_amount = data.monthly_amount;
    if (data.billing_day !== undefined) updateData.billing_day = data.billing_day;
    if (data.start_date !== undefined) updateData.start_date = data.start_date;
    if (data.end_date !== undefined) updateData.end_date = data.end_date;

    const { error } = await supabase
        .from('leases')
        .update(updateData)
        .eq('id', leaseId);

    if (error) {
        console.error("Erreur mise à jour bail:", error.message);
        return { success: false, error: error.message };
    }

    // Invalidation du cache pour forcer la mise à jour immédiate
    await invalidateCacheBatch([
        `leases:${user.id}:active`,
        `leases:${user.id}:all`, // Au cas où
        `lease_detail:${leaseId}`
    ], 'rentals');

    revalidatePath('/gestion-locative');
    return { success: true };
}

/**
 * Résilier un bail (Suppression logique - conserve l'historique)
 * Change le statut à 'terminated' et enregistre la date de fin
 */
export async function terminateLease(leaseId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Non autorisé" };
    }

    // Vérifier que le bail appartient à l'utilisateur
    const { data: lease } = await supabase
        .from('leases')
        .select('owner_id, tenant_name')
        .eq('id', leaseId)
        .single();

    if (!lease) {
        return { success: false, error: "Bail introuvable" };
    }

    if (lease.owner_id !== user.id) {
        return { success: false, error: "Action non autorisée" };
    }

    // Marquer le bail comme résilié
    const { error } = await supabase
        .from('leases')
        .update({
            status: 'terminated'
            // Note: end_date sera ajouté plus tard via migration
        })
        .eq('id', leaseId);

    if (error) {
        console.error("Erreur résiliation bail:", error.message);
        return { success: false, error: error.message };
    }

    // Invalider caches
    await invalidateCacheBatch([
        `leases:${user.id}:active`,
        `leases:${user.id}:terminated`,
        `leases:${user.id}:all`,
        `lease_detail:${leaseId}`,
        `rental_stats:${user.id}`
    ], 'rentals');

    revalidatePath('/gestion-locative');
    return {
        success: true,
        message: `Le bail de ${lease.tenant_name} a été résilié. L'historique reste accessible.`
    };
}

/**
 * Réactiver un bail résilié
 * Change le statut de 'terminated' à 'active'
 */
export async function reactivateLease(leaseId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Non autorisé" };
    }

    // Vérifier que le bail appartient à l'utilisateur
    const { data: lease } = await supabase
        .from('leases')
        .select('owner_id, tenant_name, status')
        .eq('id', leaseId)
        .single();

    if (!lease) {
        return { success: false, error: "Bail introuvable" };
    }

    if (lease.owner_id !== user.id) {
        return { success: false, error: "Action non autorisée" };
    }

    if (lease.status !== 'terminated') {
        return { success: false, error: "Ce bail n'est pas résilié" };
    }

    // Réactiver le bail
    const { error } = await supabase
        .from('leases')
        .update({
            status: 'active'
            // Note: end_date sera supprimé plus tard via migration
        })
        .eq('id', leaseId);

    if (error) {
        console.error("Erreur réactivation bail:", error.message);
        return { success: false, error: error.message };
    }

    // Invalider caches
    await invalidateCacheBatch([
        `leases:${user.id}:active`,
        `leases:${user.id}:terminated`,
        `leases:${user.id}:all`,
        `lease_detail:${leaseId}`,
        `rental_stats:${user.id}`
    ], 'rentals');

    revalidatePath('/gestion-locative');
    return {
        success: true,
        message: `Le bail de ${lease.tenant_name} a été réactivé.`
    };
}

/**
 * Signaler une demande de maintenance
 * Peut être signalé par le propriétaire (avec sélection du bail) ou le locataire
 */
export async function createMaintenanceRequest(data: {
    leaseId?: string;
    description: string;
    category?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Non autorisé" };
    }

    // Si pas de leaseId fourni, prendre le premier bail actif du propriétaire
    let targetLeaseId = data.leaseId;

    if (!targetLeaseId) {
        const { data: firstLease } = await supabase
            .from('leases')
            .select('id')
            .eq('owner_id', user.id)
            .eq('status', 'active')
            .limit(1)
            .single();

        if (!firstLease) {
            return { success: false, error: "Aucun bail actif trouvé" };
        }
        targetLeaseId = firstLease.id;
    }

    // 1. Récupérer les infos du bail pour le contexte (Adresse pour Google Maps)
    const { data: leaseContext } = await supabase
        .from('leases')
        .select('property_address, tenant_name, tenant_phone, tenant_email')
        .eq('id', targetLeaseId)
        .single();

    // Variables pour stocker les infos artisan
    let artisanData: {
        name?: string;
        phone?: string;
        rating?: number;
        address?: string;
    } = {};
    let status = 'open';

    // 2. APPEL DU WEBHOOK MAKE (Recherche Artisan)
    const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;

    if (MAKE_WEBHOOK_URL) {
        try {
            const response = await fetch(MAKE_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: data.category || "General",
                    location: leaseContext?.property_address || "Dakar, Sénégal",
                    issue: data.description,
                    tenantName: leaseContext?.tenant_name,
                    tenantPhone: leaseContext?.tenant_phone,
                    tenantEmail: leaseContext?.tenant_email,
                    webhookType: 'find_artisan'
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.artisan_name) {
                    artisanData = {
                        name: result.artisan_name,
                        phone: result.artisan_phone,
                        rating: parseFloat(result.rating) || undefined,
                        address: result.address
                    };
                    status = 'artisan_found'; // Nouveau statut clair
                }
            }
        } catch (e) {
            console.error("Erreur Webhook Make:", e);
        }
    }

    // 3. Enregistrer la demande en base avec colonnes dédiées
    const { data: request, error } = await supabase
        .from('maintenance_requests')
        .insert([{
            lease_id: targetLeaseId,
            description: data.description,
            status: status,
            // Colonnes dédiées pour l'artisan (après migration)
            artisan_name: artisanData.name || null,
            artisan_phone: artisanData.phone || null,
            artisan_rating: artisanData.rating || null,
            artisan_address: artisanData.address || null
        }])
        .select('id, description, status, created_at, artisan_name, artisan_phone')
        .single();

    if (error) {
        console.error("Erreur création demande maintenance:", error.message);
        return { success: false, error: error.message };
    }

    revalidatePath('/gestion-locative');

    return {
        success: true,
        id: request.id,
        artisanFound: status === 'artisan_found',
        artisan: artisanData.name ? artisanData : null,
        message: status === 'artisan_found' ? "Artisan trouvé !" : "Demande enregistrée."
    };
}

/**
 * Saisir le devis réel après contact avec l'artisan
 * Passe le statut à 'awaiting_approval' pour validation propriétaire
 */
export async function submitQuote(requestId: string, data: {
    quoted_price: number;
    intervention_date: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Non autorisé" };

    const { error } = await supabase
        .from('maintenance_requests')
        .update({
            quoted_price: data.quoted_price,
            intervention_date: data.intervention_date,
            status: 'awaiting_approval' // En attente de validation propriétaire
        })
        .eq('id', requestId);

    if (error) {
        console.error("Erreur saisie devis:", error.message);
        return { success: false, error: error.message };
    }

    revalidatePath('/gestion-locative');
    return { success: true, message: "Devis enregistré, en attente de validation." };
}

/**
 * Le propriétaire approuve le devis
 * Passe le statut à 'approved' et lance les travaux
 */
export async function approveQuoteByOwner(requestId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Non autorisé" };

    const { data: request, error } = await supabase
        .from('maintenance_requests')
        .update({
            status: 'approved',
            owner_approved: true
        })
        .eq('id', requestId)
        .select('*, leases(tenant_name, tenant_email, owner_id)')
        .single();

    if (error) {
        console.error("Erreur approbation devis:", error.message);
        return { success: false, error: error.message };
    }

    // Récupérer les informations complètes du bail pour l'email
    const lease = Array.isArray(request.leases) ? request.leases[0] : request.leases;
    const tenantEmail = lease?.tenant_email;
    const tenantName = lease?.tenant_name;

    // Notification à l'artisan via webhook
    await triggerN8N('maintenance-quote-approved', {
        requestId: request.id,
        description: request.description,
        quoteAmount: request.quoted_price,
        artisanPhone: request.artisan_phone
    });

    // Notification au locataire par email (Nodemailer)
    if (tenantEmail && request.artisan_name) {
        const datePrevue = request.intervention_date
            ? new Date(request.intervention_date).toLocaleDateString('fr-FR')
            : 'à confirmer';

        try {
            await sendEmail({
                to: tenantEmail,
                subject: `✅ Intervention validée : ${request.description}`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px 20px; border-radius: 10px 10px 0 0; text-align: center;">
                            <h1 style="margin: 0; font-size: 24px;">✅ Intervention Validée</h1>
                        </div>

                        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                                Bonjour <strong>${tenantName || 'Locataire'}</strong>,
                            </p>

                            <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
                                Bonne nouvelle ! La demande d'intervention pour <strong style="color: #16a34a;">${request.description}</strong> a été validée par le propriétaire.
                            </p>

                            <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 25px 0; border-radius: 8px;">
                                <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #15803d; font-weight: bold;">
                                    👷‍♂️ Artisan Assigné
                                </p>
                                <h2 style="margin: 10px 0; font-size: 20px; color: #111827;">${request.artisan_name}</h2>

                                <div style="margin-top: 15px;">
                                    <p style="margin: 5px 0; font-size: 14px; color: #374151;">
                                        <strong>📞 Téléphone :</strong>
                                        <a href="tel:${request.artisan_phone}" style="color: #16a34a; text-decoration: none; font-weight: 600;">${request.artisan_phone}</a>
                                    </p>
                                    ${request.artisan_address ? `
                                    <p style="margin: 5px 0; font-size: 14px; color: #374151;">
                                        <strong>📍 Adresse :</strong> ${request.artisan_address}
                                    </p>` : ''}
                                    <p style="margin: 5px 0; font-size: 14px; color: #374151;">
                                        <strong>📅 Date prévue :</strong> ${datePrevue}
                                    </p>
                                    ${request.quoted_price ? `
                                    <p style="margin: 5px 0; font-size: 14px; color: #374151;">
                                        <strong>💰 Montant :</strong> ${request.quoted_price.toLocaleString('fr-FR')} FCFA
                                    </p>` : ''}
                                </div>
                            </div>

                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin-top: 20px;">
                                <p style="margin: 0; font-size: 13px; color: #92400e;">
                                    <strong>ℹ️ Que faire maintenant ?</strong><br/>
                                    L'artisan a été notifié et devrait vous contacter sous peu. Si vous ne recevez pas d'appel dans les 24h, n'hésitez pas à le contacter directement au numéro ci-dessus.
                                </p>
                            </div>

                            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; line-height: 1.6;">
                                Cordialement,<br/>
                                <strong style="color: #111827;">L'équipe de Gestion</strong>
                            </p>

                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />

                            <p style="font-size: 11px; color: #9ca3af; text-align: center; margin: 0;">
                                Cet email a été envoyé automatiquement. Pour toute question, contactez votre propriétaire.
                            </p>
                        </div>
                    </div>
                `
            });
            console.log(`✅ Email envoyé à ${tenantEmail} pour intervention ${request.description}`);
        } catch (emailError) {
            console.error("❌ Erreur envoi email locataire:", emailError);
            // On ne bloque pas le workflow si l'email échoue
        }
    }

    revalidatePath('/gestion-locative');
    return { success: true, message: "Devis approuvé ! Le locataire et l'artisan ont été notifiés." };
}

/**
 * Terminer l'intervention et créer la dépense comptable
 * Crée automatiquement une ligne dans la table 'expenses'
 */
export async function completeIntervention(requestId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Non autorisé" };

    // 1. Récupérer les détails de l'intervention
    const { data: request, error: fetchError } = await supabase
        .from('maintenance_requests')
        .select('*, leases(owner_id, property_id)')
        .eq('id', requestId)
        .single();

    if (fetchError || !request) {
        return { success: false, error: "Intervention introuvable" };
    }

    // Vérifier que le devis a été approuvé
    if (!request.owner_approved) {
        return { success: false, error: "Le devis doit être approuvé avant de terminer." };
    }

    // 2. Mettre à jour le statut de l'intervention
    const { error: updateError } = await supabase
        .from('maintenance_requests')
        .update({
            status: 'completed',
            completed_at: new Date().toISOString()
        })
        .eq('id', requestId);

    if (updateError) {
        return { success: false, error: updateError.message };
    }

    // 3. Créer la dépense comptable
    const leaseData = Array.isArray(request.leases) ? request.leases[0] : request.leases;

    if (leaseData && request.quoted_price) {
        const { error: expenseError } = await supabase
            .from('expenses')
            .insert([{
                owner_id: user.id,
                property_id: leaseData.property_id || null,
                // maintenance_request_id: requestId, // Commenting out potential invalid column, enabling if confirmed
                lease_id: request.lease_id || null, // Best guess mapping
                description: `Intervention: ${request.description} (${request.artisan_name || 'Artisan'})`,
                amount: request.quoted_price,
                category: 'maintenance',
                expense_date: new Date().toISOString().split('T')[0]
                // If maintenance_request_id exists in DB, uncomment below:
                // maintenance_request_id: requestId, 
            }]);

        if (expenseError) {
            console.error("Erreur création dépense:", expenseError.message);
            // On ne bloque pas la clôture
        }
    }

    revalidatePath('/gestion-locative');
    return {
        success: true,
        message: `Intervention terminée ! Dépense de ${request.quoted_price?.toLocaleString('fr-FR')} FCFA enregistrée.`
    };
}

/**
 * Envoyer une invitation au portail locataire
 * Génère un lien magique (Magic Link) et l'envoie par email
 */
export async function sendTenantInvitation(leaseId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Non autorisé" };

    // 1. Récupérer les infos du locataire
    const { data: lease } = await supabase
        .from('leases')
        .select('tenant_name, tenant_email, property_address, owner_id')
        .eq('id', leaseId)
        .single();

    if (!lease) return { success: false, error: "Bail introuvable" };
    if (lease.owner_id !== user.id) return { success: false, error: "Non autorisé" };
    if (!lease.tenant_email) return { success: false, error: "Email du locataire manquant" };

    // 2. Générer le lien magique via Supabase Admin
    const adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email: lease.tenant_email,
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/magic-verify`
        }
    });

    if (linkError) {
        console.error("Erreur génération lien magique:", linkError);
        return { success: false, error: "Erreur lors de la génération du lien" };
    }

    const magicLink = linkData.properties?.action_link;

    if (!magicLink) {
        return { success: false, error: "Impossible de générer le lien" };
    }

    // 3. Envoyer l'email
    try {
        await sendEmail({
            to: lease.tenant_email,
            subject: `Invitation à votre Espace Locataire - Dousell`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                     <div style="text-align: center; margin-bottom: 24px;">
                        <h2 style="color: #F4C430; margin-bottom: 8px;">Bienvenue sur Dousell Immo</h2>
                        <p style="color: #6b7280; font-size: 14px;">Votre portail locataire est prêt</p>
                    </div>

                    <div style="margin-bottom: 24px;">
                        <p style="color: #374151;">Bonjour <strong>${lease.tenant_name}</strong>,</p>
                        <p style="color: #374151; line-height: 1.5;">
                            Votre propriétaire vous invite à rejoindre votre espace locataire pour le bien situé à :
                        </p>
                        <div style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; margin: 12px 0; font-size: 14px; color: #111827;">
                            📍 ${lease.property_address || 'Adresse non renseignée'}
                        </div>
                    </div>

                    <div style="background-color: #fefce8; border: 1px solid #fde047; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
                        <h3 style="color: #854d0e; margin: 0 0 8px 0; font-size: 16px;">Ce que vous pouvez faire :</h3>
                        <ul style="margin: 0; padding-left: 20px; color: #a16207; font-size: 14px;">
                            <li style="margin-bottom: 4px;">Payer votre loyer en ligne</li>
                            <li style="margin-bottom: 4px;">Télécharger vos quittances</li>
                            <li>Signaler un incident</li>
                        </ul>
                    </div>

                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${magicLink}" 
                           style="display: inline-block; background-color: #F4C430; color: #000000; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            Accéder à mon espace
                        </a>
                        <p style="margin-top: 12px; font-size: 12px; color: #9ca3af;">
                            Ce lien d'accès est personnel et valide pour 24h.
                        </p>
                    </div>

                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                    
                    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
                        Si vous n'êtes pas le destinataire de cet email, merci de l'ignorer.<br>
                        © ${new Date().getFullYear()} Dousell Immo.
                    </p>
                </div>
            `
        });

        return { success: true, message: `Invitation envoyée à ${lease.tenant_email}` };

    } catch (emailError) {
        console.error("Erreur envoi email invitation:", emailError);
        return { success: false, error: "Erreur lors de l'envoi de l'email" };
    }
}





/**
 * Récupérer les baux actifs (pour le select du formulaire de signalement)
 */
export async function getActiveLeases() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, data: [] };
    }

    const { data: leases, error } = await supabase
        .from('leases')
        .select('id, tenant_name, property_address')
        .eq('owner_id', user.id)
        .eq('status', 'active');

    if (error) {
        return { success: false, data: [] };
    }

    return { success: true, data: leases || [] };
}

/**
 * Envoie les données de quittance à Pipedream
 * Formate correctement le payload pour le webhook Pipedream
 */
export async function sendReceiptToN8N(data: Record<string, unknown>) {
    // 1. On récupère l'URL Pipedream définie dans .env.local
    const WEBHOOK_URL = process.env.NEXT_PUBLIC_WEBHOOK_URL;

    if (!WEBHOOK_URL) {
        console.error("URL Pipedream manquante !");
        return { success: false, error: "Configuration webhook manquante" };
    }

    // 2. On prépare le paquet de données (L'enveloppe)
    // On mappe vos données Supabase vers les noms attendus par Pipedream

    // Debug: Voir ce qu'on reçoit vraiment
    console.log("=".repeat(80));
    console.log("📦 DONNÉES BRUTES REÇUES AVANT ENVOI:");
    const tenant = data.tenant as Record<string, unknown> | undefined;
    const profile = data.profile as Record<string, unknown> | undefined;
    console.log("📧 Email du tenant:", tenant?.email);
    console.log("📞 Téléphone du tenant:", tenant?.phone);
    console.log("👤 Objet tenant complet:", JSON.stringify(tenant, null, 2));
    console.log("=".repeat(80));

    const payload = {
        // Infos Locataire
        tenantName: tenant?.tenant_name || tenant?.name || '',
        tenantEmail: tenant?.email || tenant?.tenant_email || '',
        tenantPhone: tenant?.phone || tenant?.tenant_phone || '',
        tenantAddress: tenant?.address || (data.property_address as string) || '',

        // Infos Paiement
        amount: Number(data.amount) || 0,
        periodMonth: data.periodMonth || `${data.month || new Date().getMonth() + 1}/2025`,
        periodStart: data.periodStart || `01/${data.month || new Date().getMonth() + 1}/2025`,
        periodEnd: data.periodEnd || `30/${data.month || new Date().getMonth() + 1}/2025`,
        receiptNumber: data.receiptNumber || `QUITT-${Date.now().toString().slice(-6)}`,

        // Infos Propriétaire (Baraka Immo)
        ownerName: profile?.company_name || profile?.full_name || 'Propriétaire',
        ownerEmail: profile?.email || '',
        ownerLogo: profile?.logo_url || null,
        ownerSignature: profile?.signature_url || null,
        ownerAddress: profile?.company_address || '',
        ownerNinea: profile?.ninea || '',

        // Infos Propriété
        propertyAddress: (data.property_address as string) || tenant?.address || '',

        // Image de la quittance (si générée côté client)
        receiptImage: data.receiptImage || null
    };

    console.log("📤 Envoi à Pipedream :", JSON.stringify(payload, null, 2)); // Pour vérifier dans vos logs serveur

    try {
        // 3. On expédie le tout à Pipedream
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload) // Pipedream : envoyer directement le payload, pas enveloppé
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erreur Pipedream:', response.status, response.statusText);
            console.error('Réponse brute:', errorText.substring(0, 500)); // Log les 500 premiers caractères
            return {
                success: false,
                error: `Erreur webhook (${response.status}): ${response.statusText}`
            };
        }

        // Essayer de parser la réponse comme JSON
        const responseText = await response.text();
        let result;

        try {
            result = JSON.parse(responseText);
            console.log("✅ Réponse Pipedream:", result);
            return { success: true, data: result };
        } catch (parseError) {
            // Si ce n'est pas du JSON, c'est probablement du HTML d'erreur
            console.warn("⚠️ Réponse non-JSON reçue:", responseText.substring(0, 200));

            // On considère quand même que c'est un succès si status 200
            if (response.status === 200) {
                console.log("✅ Requête envoyée avec succès (pas de JSON retourné)");
                return {
                    success: true,
                    data: {
                        message: "Envoyé à Pipedream (pas de réponse JSON)",
                        rawResponse: responseText.substring(0, 200)
                    }
                };
            }

            return {
                success: false,
                error: "Réponse invalide de Pipedream (pas du JSON)"
            };
        }
    } catch (error) {
        console.error("❌ Echec envoi Pipedream:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Impossible de joindre le webhook"
        };
    }
}

/**
 * Supprime une transaction (pour nettoyer les doublons générés par erreur)
 */
export async function deleteTransaction(transactionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Non autorisé" };
    }

    // Sécurité: Vérifier que la transaction appartient bien à un bail de l'utilisateur
    // On fait un join car rental_transactions n'a pas owner_id directement
    const { data: transaction } = await supabase
        .from('rental_transactions')
        .select('lease_id, leases!inner(owner_id)')
        .eq('id', transactionId)
        .single();

    // Cast sécurisé ou accès flexible car Join Supabase peut être un objet ou tableau selon la version
    const leaseData = transaction?.leases as { owner_id: string } | undefined;

    if (!transaction || !leaseData || leaseData.owner_id !== user.id) {
        return { success: false, error: "Transaction introuvable ou non autorisée" };
    }

    const { error } = await supabase
        .from('rental_transactions')
        .delete()
        .eq('id', transactionId);

    if (error) {
        console.error("Erreur suppression transaction:", error.message);
        return { success: false, error: error.message };
    }

    revalidatePath('/gestion-locative');
    return { success: true };
}

/**
 * Supprime DÉFINITIVEMENT un bail (Fonction de nettoyage)
 */
export async function deleteLease(leaseId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Non autorisé" };

    const { data: lease } = await supabase
        .from('leases')
        .select('owner_id')
        .eq('id', leaseId)
        .single();

    if (!lease || lease.owner_id !== user.id) {
        return { success: false, error: "Bail introuvable ou non autorisé" };
    }

    const { error } = await supabase
        .from('leases')
        .delete()
        .eq('id', leaseId);

    if (error) {
        console.error("Erreur suppression bail:", error.message);
        return { success: false, error: error.message };
    }

    // Invalider caches
    await invalidateCacheBatch([
        `leases:${user.id}:active`,
        `leases:${user.id}:terminated`,
        `leases:${user.id}:all`,
        `lease_detail:${leaseId}`,
        `rental_stats:${user.id}`
    ], 'rentals');

    revalidatePath('/gestion-locative');
    return { success: true };
}


