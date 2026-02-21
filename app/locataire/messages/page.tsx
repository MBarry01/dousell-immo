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
            <div className="w-full max-w-lg mx-auto px-4 py-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 py-20 px-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <MessageCircle className="w-10 h-10 text-[#0F172A]/20" />
                    </div>
                    <h3 className="text-xl font-black text-[#0F172A] tracking-tight">Aucune conversation</h3>
                    <p className="max-w-xs mx-auto mt-2 text-sm font-black text-slate-500 uppercase tracking-widest opacity-60">
                        La messagerie sera disponible dès que votre bail sera validé
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

