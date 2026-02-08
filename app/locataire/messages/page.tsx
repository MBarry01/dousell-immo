import { getTenantMessages } from "./actions";
import ChatInterface from "./components/ChatInterface";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getTenantSessionFromCookie } from "@/lib/tenant-magic-link";

export const metadata = {
    title: 'Messagerie - Portail Locataire',
};

/**
 * Tenant Messages Page
 * Uses cookie-based tenant session (NOT supabase auth)
 */
export default async function TenantMessagesPage() {
    // Get tenant session from cookie
    const session = await getTenantSessionFromCookie();

    if (!session) {
        // No valid session, redirect to expired page
        redirect('/locataire/expired?error=session_expired');
    }

    const data = await getTenantMessages();

    if (!data.leaseId) {
        return (
            <div className="w-full max-w-lg mx-auto px-4 py-6">
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <MessageCircle className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Aucune conversation</h3>
                    <p className="max-w-xs mt-2 text-sm text-slate-500">
                        La messagerie sera disponible une fois votre bail actif.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <ChatInterface
            initialMessages={data.messages || []}
            leaseId={data.leaseId}
            ownerId={data.ownerId || ''}
            ownerName={data.ownerName}
        />
    );
}

