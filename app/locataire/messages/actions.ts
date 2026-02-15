'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/mail';
import { getTenantSessionFromCookie } from '@/lib/tenant-magic-link';

/**
 * Get messages for the tenant's lease
 * Uses cookie-based tenant session (NOT supabase auth)
 */
export async function getTenantMessages() {
    // Get tenant session from cookie
    const session = await getTenantSessionFromCookie();

    if (!session) {
        return { messages: [], leaseId: null, ownerName: null, ownerId: null };
    }

    const supabase = await createClient();

    // Get the lease with owner info using service role to bypass RLS
    const { createClient: createAdminClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get owner info from the lease
    const { data: lease } = await supabaseAdmin
        .from('leases')
        .select('owner_id, owner:profiles(id, full_name)')
        .eq('id', session.lease_id)
        .single();

    if (!lease) {
        return { messages: [], leaseId: session.lease_id, ownerName: null, ownerId: null };
    }

    const ownerId = lease.owner_id;
    const ownerName = (lease.owner as any)?.full_name || 'Propriétaire';

    // Get messages for this lease
    const { data: messages, error } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('lease_id', session.lease_id)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Erreur récupération messages:", error);
        return { messages: [], leaseId: session.lease_id, ownerName, ownerId };
    }

    return {
        messages: messages || [],
        leaseId: session.lease_id,
        ownerName,
        ownerId
    };
}

/**
 * Mark all owner messages as read by the tenant.
 * Uses cookie-based tenant session (NOT supabase auth)
 */
export async function markTenantMessagesAsRead() {
    const session = await getTenantSessionFromCookie();
    if (!session) return;

    const { createClient: createAdminClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabaseAdmin
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('lease_id', session.lease_id)
        .eq('sender_type', 'owner')
        .is('read_at', null);
}

/**
 * Send a message from tenant to owner
 * Uses cookie-based tenant session (NOT supabase auth)
 */
export async function sendTenantMessage(leaseId: string, content: string) {
    // Get tenant session from cookie
    const session = await getTenantSessionFromCookie();

    if (!session) {
        return { error: "Session expirée. Veuillez vous reconnecter via le lien envoyé par email." };
    }

    // Verify the lease matches the session
    if (session.lease_id !== leaseId) {
        return { error: "Accès non autorisé" };
    }

    // Use admin client to insert message (bypass RLS since tenant has no auth user)
    const { createClient: createAdminClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the owner_id from lease to set as sender context
    const { data: lease } = await supabaseAdmin
        .from('leases')
        .select('owner_id, team_id, tenant_name, owner:profiles(email, full_name)')
        .eq('id', leaseId)
        .single();

    if (!lease) {
        return { error: "Bail non trouvé" };
    }

    // Insert message: sender_id is UUID type, so use owner_id as placeholder
    // and sender_type='tenant' to distinguish tenant messages from owner messages
    const { error } = await supabaseAdmin
        .from('messages')
        .insert({
            lease_id: leaseId,
            sender_id: lease.owner_id,
            sender_type: 'tenant',
            content: content,
            ...(lease.team_id ? { team_id: lease.team_id } : {}),
        });

    if (error) {
        console.error("Erreur envoi message:", error);
        return { error: "Impossible d'envoyer le message" };
    }

    // Send email notification to owner
    const ownerEmail = (lease.owner as any)?.email;
    const tenantName = lease.tenant_name || session.tenant_name || "Votre locataire";

    if (ownerEmail) {
        try {
            await sendEmail({
                to: ownerEmail,
                subject: `Nouveau message de ${tenantName}`,
                html: `
                    <p>Bonjour,</p>
                    <p>Vous avez reçu un nouveau message de <strong>${tenantName}</strong> sur votre portail propriétaire.</p>
                    <p><em>"${content.substring(0, 200)}${content.length > 200 ? '...' : ''}"</em></p>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/gestion/messages/${leaseId}">Répondre</a>
                `
            });
        } catch (mailError) {
            console.error("Erreur envoi mail notif:", mailError);
            // Don't block UI for email errors
        }
    }

    revalidatePath('/locataire/messages');
    return { success: true };
}

