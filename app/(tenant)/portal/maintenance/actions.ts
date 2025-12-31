'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

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

    // TODO: Notifier le propriétaire (Email / Notif)

    revalidatePath('/portal/maintenance');
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
        .select('*')
        .eq('lease_id', lease.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erreur récupération demandes:", error);
        return [];
    }

    return requests;
}
