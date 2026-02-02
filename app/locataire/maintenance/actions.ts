'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/mail';

// Type pour le formulaire
export interface CreateMaintenanceRequestData {
    category: string;
    description: string;
    photoUrls: string[];
}

export async function createMaintenanceRequest(data: CreateMaintenanceRequestData) {
    const supabase = await createClient();

    // 1. Qui est connecté ?
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
        redirect('/auth');
    }

    // 2. Initialiser Admin Client (pour contourner RLS)
    const { createClient: createAdminClient } = await import("@supabase/supabase-js");
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("Configuration serveur incomplète (Clé API manquante)");
    }
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );

    // 3. Trouver le bail actif du locataire
    // On doit trouver le bail pour lier la demande
    const { data: lease, error: leaseError } = await supabaseAdmin
        .from('leases')
        .select('id, property_id, owner_id')
        .eq('tenant_email', user.email)
        .eq('status', 'active')
        .maybeSingle();

    if (leaseError) {
        console.error("Erreur recherche bail pour maintenance:", leaseError);
        return { error: "Impossible de récupérer votre bail." };
    }

    if (!lease) {
        return { error: "Aucun bail actif trouvé. Impossible de créer une demande." };
    }

    // 4. Insérer la demande
    const { error: insertError } = await supabaseAdmin
        .from('maintenance_requests')
        .insert({
            lease_id: lease.id,
            category: data.category,
            description: data.description,
            photo_urls: data.photoUrls,
            status: 'open'
        });

    if (insertError) {
        console.error("Erreur création demande maintenance:", insertError);
        return { error: "Erreur lors de l'enregistrement de la demande." };
    }

    // Notifier le propriétaire par email
    try {
        const { data: ownerData } = await supabaseAdmin
            .from('profiles')
            .select('email, full_name')
            .eq('id', lease.owner_id)
            .single();

        if (ownerData?.email) {
            await sendEmail({
                to: ownerData.email,
                subject: `🔧 Nouvelle demande de maintenance - ${data.category}`,
                html: `
                    <p>Bonjour ${ownerData.full_name || ''},</p>
                    <p>Un locataire a signalé un problème sur votre bien.</p>
                    <p><strong>Catégorie :</strong> ${data.category}</p>
                    <p><strong>Description :</strong> ${data.description}</p>
                    ${data.photoUrls.length > 0 ? `<p><strong>Photos jointes :</strong> ${data.photoUrls.length} photo(s)</p>` : ''}
                    <p style="margin-top: 20px;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/gestion/interventions"
                           style="background-color: #F4C430; color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                            Voir les interventions
                        </a>
                    </p>
                `
            });
        }
    } catch (mailError) {
        console.error("Erreur envoi notification maintenance:", mailError);
        // On ne bloque pas l'UI pour ça
    }

    revalidatePath('/locataire/maintenance');
    return { success: true };
}

export async function getTenantMaintenanceRequests() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return [];

    const { createClient: createAdminClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Récupérer le bail ID d'abord
    const { data: lease } = await supabaseAdmin
        .from('leases')
        .select('id')
        .eq('tenant_email', user.email)
        .eq('status', 'active')
        .maybeSingle();

    if (!lease) return [];

    const { data: requests, error } = await supabaseAdmin
        .from('maintenance_requests')
        .select('id, category, description, status, photo_urls, created_at, artisan_name, artisan_phone, artisan_rating, quoted_price, intervention_date')
        .eq('lease_id', lease.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erreur récupération demandes:", error);
        return [];
    }

    return requests;
}

/**
 * Annuler une demande de maintenance (uniquement si status = 'open')
 */
export async function cancelMaintenanceRequest(requestId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
        return { error: "Non autorisé" };
    }

    const { createClient: createAdminClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Vérifier que la demande appartient au locataire
    const { data: lease } = await supabaseAdmin
        .from('leases')
        .select('id')
        .eq('tenant_email', user.email)
        .eq('status', 'active')
        .maybeSingle();

    if (!lease) {
        return { error: "Bail non trouvé" };
    }

    // Vérifier que la demande est bien 'open' et appartient au bail
    const { data: request } = await supabaseAdmin
        .from('maintenance_requests')
        .select('id, status')
        .eq('id', requestId)
        .eq('lease_id', lease.id)
        .single();

    if (!request) {
        return { error: "Demande non trouvée" };
    }

    if (request.status !== 'open') {
        return { error: "Impossible d'annuler une demande déjà en traitement" };
    }

    // Supprimer la demande
    const { error } = await supabaseAdmin
        .from('maintenance_requests')
        .delete()
        .eq('id', requestId);

    if (error) {
        console.error("Erreur suppression demande:", error);
        return { error: "Erreur lors de l'annulation" };
    }

    revalidatePath('/locataire/maintenance');
    return { success: true };
}
