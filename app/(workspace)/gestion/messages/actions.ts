'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/mail';
import { getUserTeamContext } from "@/lib/team-context";
import { requireTeamPermission } from "@/lib/permissions";

export async function getOwnerMessages(leaseId: string) {
    const { teamId, user } = await getUserTeamContext();
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

export async function sendOwnerMessage(leaseId: string, content: string) {
    const { teamId, user } = await getUserTeamContext();
    await requireTeamPermission('leases.view'); // Base permission for messaging
    const supabase = await createClient();

    if (!user) return { error: "Non authentifié" };

    const { error } = await supabase
        .from('messages')
        .insert({
            lease_id: leaseId,
            sender_id: user.id,
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
                html: `
                    <p>Bonjour ${lease.tenant_name || ''},</p>
                    <p>Vous avez reçu un nouveau message de <strong>${ownerName}</strong>.</p>
                    <p><em>"${content}"</em></p>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/locataire/messages">Voir la conversation</a>
                `
            });
        } catch (mailError) {
            console.error("Erreur notif mail owner:", mailError);
        }
    }

    revalidatePath(`/gestion/messages/${leaseId}`);
    return { success: true };
}
