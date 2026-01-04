'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitActivationRequest(formData: {
    identityDocumentUrl: string;
    propertyProofUrl: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Non authentifié" };
    }

    // Vérifier s'il y a déjà une demande en attente
    const { data: existingRequest } = await supabase
        .from('gestion_locative_requests')
        .select('id, status')
        .eq('user_id', user.id)
        .in('status', ['pending', 'approved'])
        .maybeSingle();

    if (existingRequest?.status === 'approved') {
        return { error: "Votre compte est déjà activé" };
    }

    if (existingRequest?.status === 'pending') {
        return { error: "Vous avez déjà une demande en attente de validation" };
    }

    // Créer la demande d'activation
    const { error } = await supabase
        .from('gestion_locative_requests')
        .insert({
            user_id: user.id,
            identity_document_url: formData.identityDocumentUrl,
            property_proof_url: formData.propertyProofUrl,
            status: 'pending'
        });

    if (error) {
        console.error("Erreur création demande:", error);
        return { error: `Erreur: ${error.message || error.code || 'Inconnue'}` };
    }

    // Mettre à jour le profil
    await supabase
        .from('profiles')
        .update({ gestion_locative_status: 'pending' })
        .eq('id', user.id);

    revalidatePath('/compte');
    return { success: true };
}

export async function getActivationStatus() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { status: 'inactive' };

    const { data: request } = await supabase
        .from('gestion_locative_requests')
        .select('status, admin_notes, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    return {
        status: request?.status || 'inactive',
        adminNotes: request?.admin_notes,
        createdAt: request?.created_at
    };
}
