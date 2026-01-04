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

    // 2. Récupérer les lease_ids qui ont des messages
    const { data: messagesData } = await supabase
        .from('messages')
        .select('lease_id');

    const leaseIdsWithMessages = new Set(messagesData?.map(m => m.lease_id) || []);

    // 3. Filtrer pour n'afficher que les conversations actives (avec messages)
    const activeConversations = allLeases?.filter(lease => leaseIdsWithMessages.has(lease.id)) || [];

    // 4. Locataires sans conversation (pour le dropdown)
    const tenantsWithoutConversation = allLeases?.filter(lease => !leaseIdsWithMessages.has(lease.id)) || [];

    return (
        <MessagesPageClient
            activeConversations={activeConversations as any}
            tenantsWithoutConversation={tenantsWithoutConversation as any}
        />
    );
}
