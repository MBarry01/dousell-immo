import { getOwnerMessages } from "../actions";
import OwnerChatInterface from "./OwnerChatInterface";
import { createClient } from "@/utils/supabase/server";

export default async function OwnerChatPage({ params }: { params: Promise<{ leaseId: string }> }) {
    const { leaseId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const data = await getOwnerMessages(leaseId);

    if ('error' in data) {
        return <div className="p-8 text-red-500">{data.error}</div>;
    }

    return (
        <OwnerChatInterface
            leaseId={leaseId}
            initialMessages={data.messages}
            currentUserId={user?.id || ''}
            tenantName={data.tenantName}
        />
    );
}
