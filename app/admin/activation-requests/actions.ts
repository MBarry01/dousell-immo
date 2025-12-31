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

    // Merge user data
    const requestsWithUsers = requests?.map(req => ({
        ...req,
        user: profiles?.find(p => p.id === req.user_id) || null
    })) || [];

    return requestsWithUsers;
}

export async function approveActivationRequest(requestId: string) {
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
            status: 'approved',
            reviewed_by: user?.id,
            reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

    if (updateError) {
        console.error('Error approving request:', updateError);
        return { error: 'Erreur lors de la validation' };
    }

    // Update user profile
    await supabase
        .from('profiles')
        .update({
            gestion_locative_enabled: true,
            gestion_locative_status: 'approved'
        })
        .eq('id', request.user_id);

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
