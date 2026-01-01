'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function getActivationRequests() {
    // Utiliser le client admin pour bypasser RLS
    const supabase = createAdminClient();

    const { data: requests, error } = await supabase
        .from('gestion_locative_requests')
        .select(`
            id,
            user_id,
            status,
            identity_document_url,
            property_proof_url,
            admin_notes,
            reviewed_at,
            created_at
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching requests:', error);
        return [];
    }

    // Fetch user profiles separately
    const userIds = requests?.map(r => r.user_id) || [];
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

    // Map requests to include user data
    // Use Promise.all to fetch user data for each request, falling back to auth.admin.getUserById if needed
    const requestsWithUsers = await Promise.all((requests || []).map(async (req) => {
        const profile = profiles?.find(p => p.id === req.user_id);
        let email = profile?.email;
        let fullName = profile?.full_name || 'Utilisateur';

        // If email is missing in profile, fetch from Auth Admin API (more reliable for email)
        if (!email) {
            const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(req.user_id);
            if (!authError && authUser?.user) {
                email = authUser.user.email;

                // Also try to get metadata name if profile name is generic
                if (fullName === 'Utilisateur' && authUser.user.user_metadata?.full_name) {
                    fullName = authUser.user.user_metadata.full_name;
                }
            } else if (authError) {
                console.error(`Error fetching auth user ${req.user_id}:`, authError);
            }
        }

        return {
            ...req,
            user: {
                full_name: fullName,
                email: email || 'Email inconnu'
            }
        };
    }));

    return requestsWithUsers;
}

export async function approveActivationRequest(requestId: string) {
    const supabase = createAdminClient();
    const serverSupabase = await createClient();
    // Safe check for user, though in admin context we usually have one. 
    // For server actions invoked by client, getUser checks the session.
    const { data: { user } } = await serverSupabase.auth.getUser();

    // Get the request
    const { data: request, error: fetchError } = await supabase
        .from('gestion_locative_requests')
        .select('user_id')
        .eq('id', requestId)
        .single();

    if (fetchError || !request) {
        console.error('Error fetching request:', fetchError);
        return { error: 'Demande introuvable' };
    }

    console.log('Approving request for user:', request.user_id);

    // Update the request status
    const { error: updateError } = await supabase
        .from('gestion_locative_requests')
        .update({
            status: 'approved',
            reviewed_by: user?.id,
            reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

    if (updateError) {
        console.error('Error updating request:', updateError);
        return { error: 'Erreur lors de la mise à jour de la demande' };
    }

    // Update user profile - CRITICAL: this enables the feature
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            gestion_locative_enabled: true,
            gestion_locative_status: 'approved'
        })
        .eq('id', request.user_id);

    if (profileError) {
        console.error('Error updating profile:', profileError);
        return { error: 'Erreur lors de la mise à jour du profil utilisateur' };
    }

    console.log('Successfully approved and updated profile for:', request.user_id);

    revalidatePath('/admin/activation-requests');
    revalidatePath('/compte');
    return { success: true };
}

export async function rejectActivationRequest(requestId: string, reason: string) {
    const supabase = createAdminClient();
    const serverSupabase = await createClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    // Get the request
    const { data: request, error: fetchError } = await supabase
        .from('gestion_locative_requests')
        .select('user_id')
        .eq('id', requestId)
        .single();

    if (fetchError || !request) {
        return { error: 'Demande introuvable' };
    }

    // Update the request
    const { error: updateError } = await supabase
        .from('gestion_locative_requests')
        .update({
            status: 'rejected',
            admin_notes: reason,
            reviewed_by: user?.id,
            reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

    if (updateError) {
        console.error('Error rejecting request:', updateError);
        return { error: 'Erreur lors du rejet' };
    }

    // Update user profile
    await supabase
        .from('profiles')
        .update({
            gestion_locative_status: 'rejected'
        })
        .eq('id', request.user_id);

    revalidatePath('/admin/activation-requests');
    return { success: true };
}
