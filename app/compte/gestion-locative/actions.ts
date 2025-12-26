"use server"

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Fonction utilitaire pour envoyer les données à n8n
 * Les webhooks n8n doivent être configurés pour recevoir ces événements
 */
async function triggerN8N(webhookPath: string, payload: any) {
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
export async function createNewLease(formData: any) {
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
export async function confirmPayment(transactionId: string) {
    const supabase = await createClient();

    // Mise à jour avec récupération des données du bail pour l'email
    const { data: trans, error } = await supabase
        .from('rental_transactions')
        .update({
            status: 'paid',
            paid_at: new Date().toISOString()
        })
        .eq('id', transactionId)
        .select('*, leases(tenant_name, tenant_email, monthly_amount, owner_id)')
        .single();

    if (error) {
        console.error("Erreur confirmation paiement:", error.message);
        return { success: false, error: error.message };
    }

    // DÉCLENCHEUR N8N : Envoi de la quittance par EMAIL (Gmail)
    if (trans && trans.leases && trans.leases.tenant_email) {
        await triggerN8N('send-receipt-email', {
            transactionId: trans.id,
            leaseId: trans.lease_id,
            // Destinataire EMAIL (priorité Gmail)
            tenantEmail: trans.leases.tenant_email,
            tenantName: trans.leases.tenant_name,
            // Détails paiement
            amount: trans.amount_due,
            currency: 'FCFA',
            periodMonth: trans.period_month,
            periodYear: trans.period_year,
            paidAt: trans.paid_at,
            // Pour le template
            monthLabel: new Date(trans.period_year, trans.period_month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        });
    } else {
        console.warn("Quittance non envoyée: email locataire manquant pour transaction", transactionId);
    }

    revalidatePath('/compte/gestion-locative');
    return { success: true };
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
    // property_address et updated_at seront ajoutés plus tard via migration
    const updateData: Record<string, any> = {};
    if (data.tenant_name) updateData.tenant_name = data.tenant_name;
    if (data.tenant_phone !== undefined) updateData.tenant_phone = data.tenant_phone;
    if (data.tenant_email) updateData.tenant_email = data.tenant_email;
    if (data.monthly_amount) updateData.monthly_amount = data.monthly_amount;
    if (data.billing_day) updateData.billing_day = data.billing_day;

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


