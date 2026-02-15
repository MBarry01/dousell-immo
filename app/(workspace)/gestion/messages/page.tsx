import { createClient } from "@/utils/supabase/server";
import { MessagesPageClient } from "./MessagesPageClient";

export default async function OwnerMessagesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Récupérer TOUS les baux actifs (pour le dropdown "Nouveau message")
    const { data: allLeases } = await supabase
        .from('leases')
        .select('id, tenant_name, property:properties(title)')
        .eq('owner_id', user?.id)
        .eq('status', 'active');

    // 2. Récupérer les messages avec info de lecture
    const { data: messagesData } = await supabase
        .from('messages')
        .select('lease_id, sender_type, read_at');

    const leaseIdsWithMessages = new Set(messagesData?.map(m => m.lease_id) || []);

    // 3. Compter les messages non lus par lease (messages du locataire non lus)
    const unreadByLease: Record<string, number> = {};
    for (const msg of messagesData || []) {
        if (msg.sender_type === 'tenant' && !msg.read_at) {
            unreadByLease[msg.lease_id] = (unreadByLease[msg.lease_id] || 0) + 1;
        }
    }

    // 4. Filtrer pour n'afficher que les conversations actives (avec messages)
    const activeConversations = allLeases?.filter(lease => leaseIdsWithMessages.has(lease.id)) || [];

    // 5. Locataires sans conversation (pour le dropdown)
    const tenantsWithoutConversation = allLeases?.filter(lease => !leaseIdsWithMessages.has(lease.id)) || [];

    return (
        <MessagesPageClient
            activeConversations={activeConversations as any}
            tenantsWithoutConversation={tenantsWithoutConversation as any}
            unreadByLease={unreadByLease}
        />
    );
}
