"use server"

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { validateTenantCreation } from '@/lib/finance';

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
 * Fonction utilitaire pour envoyer les données à n8n
 * Les webhooks n8n doivent être configurés pour recevoir ces événements
 */
async function triggerN8N(webhookPath: string, payload: Record<string, unknown>) {
    const N8N_URL = process.env.N8N_WEBHOOK_URL; // URL de l'instance n8n
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
            console.error(`Webhook n8n (${webhookPath}) - Erreur HTTP:`, response.status);
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

    const { data: lease, error } = await supabase
        .from('leases')
        .insert([finalData])
        .select()
        .single();

    if (error) {
        console.error("Erreur création bail:", error.message);
        return { success: false, error: error.message };
    }

    // 2. Créer automatiquement la transaction pour le mois en cours
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const { error: transError } = await supabase
        .from('rental_transactions')
        .insert([{
            lease_id: lease.id,
            period_month: currentMonth,
            period_year: currentYear,
            amount_due: lease.monthly_amount,
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

    revalidatePath('/compte/gestion-locative');
    return { success: true, id: lease.id };
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
export async function confirmPayment(leaseId: string, transactionId?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Non autorisé" };

    let targetId = transactionId;

    // 1. Si pas de transactionID, on en crée une pour le mois actuel
    if (!targetId) {
        // Récupérer le montant du bail
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
                period_month: new Date().getMonth() + 1,
                period_year: new Date().getFullYear(),
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

    // 5. Envoi automatique de la quittance par email (Gmail direct)
    let emailSent = false;

    if (trans && trans.leases && trans.leases.tenant_email) {
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

            // Appel à l'API /api/send-receipt (pas d'await pour ne pas bloquer)
            fetch('/api/send-receipt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(receiptData),
            })
                .then(res => res.json())
                .then(result => {
                    if (result.success) {
                        console.log('✅ Quittance envoyée:', result.messageId);
                    } else {
                        console.error('❌ Erreur envoi quittance:', result.error);
                    }
                })
                .catch(err => console.error('❌ Erreur appel API quittance:', err));

            emailSent = true;
        } catch (err) {
            console.error('❌ Erreur préparation quittance:', err);
        }
    }

    revalidatePath('/compte/gestion-locative');

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

    revalidatePath('/compte/gestion-locative');
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

    revalidatePath('/compte/gestion-locative');
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

    revalidatePath('/compte/gestion-locative');
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

    revalidatePath('/compte/gestion-locative');

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

    revalidatePath('/compte/gestion-locative');
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
        .select('*, leases(tenant_name, owner_id)')
        .single();

    if (error) {
        console.error("Erreur approbation devis:", error.message);
        return { success: false, error: error.message };
    }

    // Optionnel: Déclencher notification à l'artisan via webhook
    await triggerN8N('maintenance-quote-approved', {
        requestId: request.id,
        description: request.description,
        quoteAmount: request.quoted_price,
        artisanPhone: request.artisan_phone
    });

    revalidatePath('/compte/gestion-locative');
    return { success: true, message: "Devis approuvé ! Les travaux peuvent commencer." };
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
    const leaseData = request.leases as { owner_id: string; property_id?: string } | null;

    if (leaseData && request.quoted_price) {
        const { error: expenseError } = await supabase
            .from('expenses')
            .insert([{
                owner_id: leaseData.owner_id,
                property_id: leaseData.property_id || null,
                maintenance_request_id: requestId,
                description: `Intervention: ${request.description} (${request.artisan_name || 'Artisan'})`,
                amount: request.quoted_price,
                category: 'maintenance',
                expense_date: new Date().toISOString().split('T')[0]
            }]);

        if (expenseError) {
            console.error("Erreur création dépense:", expenseError.message);
            // On ne bloque pas la clôture, mais on log l'erreur
        }
    }

    revalidatePath('/compte/gestion-locative');
    return {
        success: true,
        message: `Intervention terminée ! Dépense de ${request.quoted_price?.toLocaleString('fr-FR')} FCFA enregistrée.`
    };
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

    revalidatePath('/compte/gestion-locative');
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

    revalidatePath('/compte/gestion-locative');
    return { success: true };
}


