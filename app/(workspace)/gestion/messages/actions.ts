'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/mail';
import { getUserTeamContext } from "@/lib/team-context";
import { requireTeamPermission } from "@/lib/permissions";
import { notifyTenant } from "@/lib/notifications";
import { StandardNotificationEmail } from '@/emails/StandardNotificationEmail';
import React from 'react';
import { render } from '@react-email/render';


export async function getOwnerMessages(leaseId: string) {
    const context = await getUserTeamContext();
    if (!context) return { error: "Non autorisé" };
    const { teamId, user } = context;
    const supabase = await createClient();

    if (!user) return { error: "Non authentifié" };

    // Vérifier que le bail appartient bien à l'équipe
    const { data: lease } = await supabase
        .from('leases')
        .select('id, tenant_name, team_id')
        .eq('id', leaseId)
        .eq('team_id', teamId)
        .single();

    if (!lease) return { error: "Bail introuvable ou accès refusé" };

    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('lease_id', leaseId)
        .order('created_at', { ascending: true });

    return { messages: messages || [], tenantName: lease.tenant_name };
}

/**
 * Mark all tenant messages in a conversation as read by the owner.
 */
export async function markConversationAsRead(leaseId: string) {
    const context = await getUserTeamContext();
    if (!context) return;
    const { teamId, user } = context;
    const supabase = await createClient();

    if (!user) return;

    // Only mark tenant messages as read (owner's own messages don't need read_at)
    await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('lease_id', leaseId)
        .eq('sender_type', 'tenant')
        .is('read_at', null);

    revalidatePath('/gestion/messages');
}

export async function sendOwnerMessage(leaseId: string, content: string) {
    const context = await getUserTeamContext();
    if (!context) return { error: "Non autorisé" };
    const { teamId, user } = context;
    await requireTeamPermission('leases.view'); // Base permission for messaging
    const supabase = await createClient();

    if (!user) return { error: "Non authentifié" };

    const { error } = await supabase
        .from('messages')
        .insert({
            lease_id: leaseId,
            sender_id: user.id,
            sender_type: 'owner',
            team_id: teamId,
            content: content
        });

    if (error) {
        console.error("Erreur envoi message owner:", error);
        return { error: "Impossible d'envoyer le message" };
    }

    // Notification Email au Locataire
    const { data: lease } = await supabase
        .from('leases')
        .select('tenant_email, tenant_name, owner:profiles(full_name)') // On récupère l'email locataire
        .eq('id', leaseId)
        .single();

    if (lease?.tenant_email) {
        // @ts-ignore
        const ownerName = lease.owner?.full_name || "Votre Propriétaire";

        try {
            await sendEmail({
                to: lease.tenant_email,
                subject: `Nouveau message de ${ownerName}`,
                react: React.createElement(StandardNotificationEmail, {
                    title: `Nouveau message de ${ownerName}`,
                    previewText: `Vous avez reçu un nouveau message de ${ownerName}`,
                    greeting: `Bonjour ${lease.tenant_name || ''},`,
                    mainContent: `Vous avez reçu un nouveau message de ${ownerName} : "${content}"`,
                    ctaText: "Voir la conversation",
                    ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/locataire/messages`,
                    footerText: ownerName
                })
            });
        } catch (mailError) {
            console.error("Erreur notif mail owner:", mailError);
        }


        // Notification Push
        await notifyTenant({
            leaseId,
            title: `Message de ${ownerName}`,
            message: content,
            url: "/locataire/messages"
        });
    }

    revalidatePath(`/gestion/messages/${leaseId}`);
    return { success: true };
}
