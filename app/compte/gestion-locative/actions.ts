"use server"

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

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

    const { data: lease, error } = await supabase
        .from('leases')
        .insert([finalData])
        .select()
        .single();

    if (error) {
        console.error("Erreur création bail:", error.message);
        return { success: false, error: error.message };
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
        .select('*, leases(tenant_name, tenant_email, monthly_amount, owner_id)')
        .single();

    if (error) {
        console.error("Erreur confirmation paiement:", error.message);
        return { success: false, error: error.message };
    }

    // 3. Appel n8n en "Fire and Forget" avec l'email du propriétaire en CC
    const N8N_URL = process.env.N8N_WEBHOOK_URL;
    let emailSent = false;

    if (N8N_URL && trans && trans.leases && trans.leases.tenant_email) {
        // On n'attend pas la réponse (pas de await) pour ne pas bloquer l'UI
        triggerN8N('send-receipt-email', {
            transactionId: trans.id,
            leaseId: trans.lease_id,
            tenantEmail: trans.leases.tenant_email,
            tenantName: trans.leases.tenant_name,
            ownerEmail: user.email, // Email du propriétaire pour le CC
            shouldSendCC: true, // Flag pour indiquer d'envoyer une copie au proprio
            amount: trans.amount_due,
            currency: 'FCFA',
            periodMonth: trans.period_month,
            periodYear: trans.period_year,
            paidAt: trans.paid_at,
            monthLabel: new Date(trans.period_year, trans.period_month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        }).catch(err => console.error("Erreur background n8n:", err));
        emailSent = true;
    }

    revalidatePath('/compte/gestion-locative');

    // Message personnalisé selon si n8n est configuré ou non
    const message = emailSent
        ? "Paiement validé ! n8n va envoyer la quittance par email au locataire (et vous en copie) d'ici quelques instants."
        : "Paiement validé ! Vous pouvez générer la quittance manuellement via le bouton 'Voir quittance'.";

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

    // Insert avec seulement les colonnes qui existent
    // TODO: Ajouter 'category' après migration de la table
    const { data: request, error } = await supabase
        .from('maintenance_requests')
        .insert([{
            lease_id: targetLeaseId,
            description: data.description + (data.category ? ` [${data.category}]` : ''),
            status: 'open'
        }])
        .select('id, description, status, created_at')
        .single();

    if (error) {
        console.error("Erreur création demande maintenance:", error.message);
        return { success: false, error: error.message };
    }

    // DÉCLENCHEUR N8N : Notification de nouvelle panne
    if (request) {
        await triggerN8N('new-maintenance-request', {
            requestId: request.id,
            description: request.description
        });
    }

    revalidatePath('/compte/gestion-locative');
    return { success: true, id: request.id };
}

/**
 * Approuver un devis de maintenance
 * Déclenche la notification à l'artisan via n8n
 */
export async function approveMaintenanceQuote(requestId: string) {
    const supabase = await createClient();

    const { data: request, error } = await supabase
        .from('maintenance_requests')
        .update({ status: 'approved' })
        .eq('id', requestId)
        .select('*, leases(tenant_name)')
        .single();

    if (error) {
        console.error("Erreur approbation devis:", error.message);
        return { success: false, error: error.message };
    }

    // DÉCLENCHEUR N8N : Notification approbation devis
    if (request) {
        await triggerN8N('maintenance-quote-approved', {
            requestId: request.id,
            description: request.description,
            quoteAmount: request.quote_amount
        });
    }

    revalidatePath('/compte/gestion-locative');
    return { success: true };
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
export async function sendReceiptToN8N(data: any) {
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
    console.log("📧 Email du tenant:", data.tenant?.email);
    console.log("📞 Téléphone du tenant:", data.tenant?.phone);
    console.log("👤 Objet tenant complet:", JSON.stringify(data.tenant, null, 2));
    console.log("=".repeat(80));

    const payload = {
        // Infos Locataire
        tenantName: data.tenant?.tenant_name || data.tenant?.name || '',
        tenantEmail: data.tenant?.email || data.tenant?.tenant_email || '',
        tenantPhone: data.tenant?.phone || data.tenant?.tenant_phone || '',
        tenantAddress: data.tenant?.address || data.property_address || '',

        // Infos Paiement
        amount: Number(data.amount) || 0,
        periodMonth: data.periodMonth || `${data.month || new Date().getMonth() + 1}/2025`,
        periodStart: data.periodStart || `01/${data.month || new Date().getMonth() + 1}/2025`,
        periodEnd: data.periodEnd || `30/${data.month || new Date().getMonth() + 1}/2025`,
        receiptNumber: data.receiptNumber || `QUITT-${Date.now().toString().slice(-6)}`,

        // Infos Propriétaire (Baraka Immo)
        ownerName: data.profile?.company_name || data.profile?.full_name || 'Propriétaire',
        ownerEmail: data.profile?.email || '',
        ownerLogo: data.profile?.logo_url || null,
        ownerSignature: data.profile?.signature_url || null,
        ownerAddress: data.profile?.company_address || '',
        ownerNinea: data.profile?.ninea || '',

        // Infos Propriété
        propertyAddress: data.property_address || data.tenant?.address || '',

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


