import { createClient } from "@/utils/supabase/server";
import { MessageSquare, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

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
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Messagerie</h1>

                {/* Bouton pour démarrer une nouvelle conversation */}
                {tenantsWithoutConversation.length > 0 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Plus className="w-4 h-4" />
                                Nouveau message
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            {tenantsWithoutConversation.map((lease: any) => (
                                <DropdownMenuItem key={lease.id} asChild>
                                    <Link href={`/compte/gestion-locative/messages/${lease.id}`}>
                                        {lease.tenant_name}
                                    </Link>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            <div className="grid gap-4">
                {activeConversations.length > 0 ? (
                    activeConversations.map((lease: any) => (
                        <Link
                            key={lease.id}
                            href={`/compte/gestion-locative/messages/${lease.id}`}
                            className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex items-center justify-between hover:border-zinc-700 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">
                                    {(lease.tenant_name || 'L')[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{lease.tenant_name}</h3>
                                    <p className="text-sm text-zinc-500 line-clamp-1">
                                        {Array.isArray(lease.property) ? lease.property[0]?.title : lease.property?.title}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-zinc-500" />
                        </Link>
                    ))
                ) : (
                    <div className="text-center py-12 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
                        <MessageSquare className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-400 font-medium">Aucune conversation</p>
                        <p className="text-sm text-zinc-500 mt-1">
                            {tenantsWithoutConversation.length > 0
                                ? "Cliquez sur \"Nouveau message\" pour contacter un locataire."
                                : "Vous n'avez pas encore de locataires actifs."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

