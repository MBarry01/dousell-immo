'use server';

import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/mail';
import { getTenantSessionFromCookie } from '@/lib/tenant-magic-link';

// Type pour le formulaire
export interface CreateMaintenanceRequestData {
    category: string;
    description: string;
    photoUrls: string[];
}

/**
 * Create a new maintenance request
 * Uses tenant session from cookie (NOT supabase auth)
 */
export async function createMaintenanceRequest(data: CreateMaintenanceRequestData) {
    // 1. Get tenant session from cookie
    const session = await getTenantSessionFromCookie();

    if (!session) {
        return { error: "Session expirée. Veuillez vous reconnecter." };
    }

    // 2. Initialize Admin Client (to bypass RLS)
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

    // 3. Get lease details (we have lease_id from session)
    const { data: lease, error: leaseError } = await supabaseAdmin
        .from('leases')
        .select('id, property_id, owner_id')
        .eq('id', session.lease_id)
        .single();

    if (leaseError || !lease) {
        console.error("Erreur recherche bail pour maintenance:", leaseError);
        return { error: "Impossible de récupérer votre bail." };
    }

    // 4. Insert the maintenance request
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

    // 5. Notify owner by email
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
                    <p>Votre locataire <strong>${session.tenant_name}</strong> a signalé un problème.</p>
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
        // Don't block UI for email errors
    }

    revalidatePath('/locataire/maintenance');
    return { success: true };
}

/**
 * Get all maintenance requests for the tenant
 * Uses tenant session from cookie
 */
export async function getTenantMaintenanceRequests() {
    // Get tenant session from cookie
    const session = await getTenantSessionFromCookie();

    if (!session) {
        return [];
    }

    const { createClient: createAdminClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch maintenance requests for this lease
    const { data: requests, error } = await supabaseAdmin
        .from('maintenance_requests')
        .select('id, category, description, status, photo_urls, created_at, artisan_name, artisan_phone, artisan_rating, quoted_price, intervention_date')
        .eq('lease_id', session.lease_id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erreur récupération demandes:", error);
        return [];
    }

    return requests || [];
}

/**
 * Cancel a maintenance request (only if status = 'open')
 * Uses tenant session from cookie
 */
export async function cancelMaintenanceRequest(requestId: string) {
    // Get tenant session from cookie
    const session = await getTenantSessionFromCookie();

    if (!session) {
        return { error: "Session expirée" };
    }

    const { createClient: createAdminClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the request belongs to this tenant's lease and is still 'open'
    const { data: request } = await supabaseAdmin
        .from('maintenance_requests')
        .select('id, status')
        .eq('id', requestId)
        .eq('lease_id', session.lease_id)
        .single();

    if (!request) {
        return { error: "Demande non trouvée" };
    }

    if (request.status !== 'open') {
        return { error: "Impossible d'annuler une demande déjà en traitement" };
    }

    // Delete the request
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
