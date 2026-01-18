'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/mail';

export async function getTenantMessages() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // 1. Récupérer le bail actif pour savoir de quelle conversation on parle
    const { createClient: createAdminClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: lease } = await supabaseAdmin
        .from('leases')
        .select('id, owner:profiles(full_name)')
        .eq('tenant_email', user.email)
        .eq('status', 'active')
        .maybeSingle();

    if (!lease) return [];

    // 2. Récupérer les messages liés à ce bail
    // On peut utiliser le client normal ici car les RLS devraient autoriser la lecture
    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lease_id', lease.id)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Erreur récupération messages:", error);
        return [];
    }

    return { messages, leaseId: lease.id, ownerName: (lease.owner as any)?.[0]?.full_name || (lease.owner as any)?.full_name };
}

export async function sendTenantMessage(leaseId: string, content: string) {
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
        console.error("Erreur envoi message:", error);
        return { error: "Impossible d'envoyer le message" };
    }

    // Notification Email au Propriétaire
    // 1. Récupérer l'email du proprio
    const { data: lease } = await supabase
        .from('leases')
        .select('tenant_name, owner:profiles(email, full_name)')
        .eq('id', leaseId)
        .single();

    // @ts-ignore
    if (lease?.owner?.email) {
        // @ts-ignore
        const ownerEmail = lease.owner.email;
        const tenantName = lease.tenant_name || "Votre locataire";

        try {
            await sendEmail({
                to: ownerEmail,
                subject: `Nouveau message de ${tenantName}`,
                html: `
                    <p>Bonjour,</p>
                    <p>Vous avez reçu un nouveau message de <strong>${tenantName}</strong> sur votre portail propriétaire.</p>
                    <p><em>"${content}"</em></p>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/gestion/messages/${leaseId}">Répondre</a>
                `
            });
        } catch (mailError) {
            console.error("Erreur envoi mail notif:", mailError);
            // On ne bloque pas l'UI pour ça
        }
    }

    revalidatePath('/locataire/messages');
    return { success: true };
}
