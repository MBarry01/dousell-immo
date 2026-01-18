'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/mail';

export async function getOwnerMessages(leaseId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Non authentifié" };

    // Vérifier que le bail appartient bien au owner
    const { data: lease } = await supabase
        .from('leases')
        .select('id, tenant_name, owner_id')
        .eq('id', leaseId)
        .eq('owner_id', user.id)
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Non authentifié" };

    const { error } = await supabase
        .from('messages')
        .insert({
            lease_id: leaseId,
            sender_id: user.id,
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
