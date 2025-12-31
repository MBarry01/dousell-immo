import { getTenantMessages } from "./actions";
import ChatInterface from "./components/ChatInterface";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
    title: 'Messagerie - Portail Locataire',
};

export default async function TenantMessagesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/auth');

    const data: any = await getTenantMessages();

    if (!data.leaseId) {
        return (
            <div className="p-4 text-center mt-10">
                <p>Aucune conversation disponible.</p>
            </div>
        );
    }

    return (
        <ChatInterface
            initialMessages={data.messages || []}
            leaseId={data.leaseId}
            currentUserId={user.id}
            ownerName={data.ownerName}
        />
    );
}
