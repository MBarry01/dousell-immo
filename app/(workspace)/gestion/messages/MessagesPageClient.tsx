'use client';

import { MessageSquare, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { MessagesTour } from '@/components/gestion/tours/MessagesTour';

interface Lease {
    id: string;
    tenant_name: string;
    property?: { title: string } | { title: string }[];
}

interface MessagesPageClientProps {
    activeConversations: Lease[];
    tenantsWithoutConversation: Lease[];
    unreadByLease?: Record<string, number>;
}

export function MessagesPageClient({
    activeConversations,
    tenantsWithoutConversation,
    unreadByLease = {},
}: MessagesPageClientProps) {
    const { isDark } = useTheme();

    return (
        <div className="space-y-6 p-4 md:p-6">
            <MessagesTour />
            <div id="tour-msg-header" className="flex items-center justify-between">
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Messagerie
                </h1>

                {/* Bouton pour démarrer une nouvelle conversation */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            id="tour-msg-new"
                            variant="outline"
                            size="sm"
                            disabled={tenantsWithoutConversation.length === 0}
                            className={`gap-2 ${isDark
                                ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <Plus className="w-4 h-4" />
                            Nouveau message
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className={`w-56 ${isDark
                            ? 'bg-slate-900 border-slate-800'
                            : 'bg-white border-gray-200'
                            }`}
                    >
                        {tenantsWithoutConversation.map((lease) => (
                            <DropdownMenuItem
                                key={lease.id}
                                asChild
                                className={isDark
                                    ? 'text-slate-300 focus:bg-slate-800 focus:text-white'
                                    : 'text-gray-700 focus:bg-gray-100 focus:text-gray-900'
                                }
                            >
                                <Link href={`/gestion/messages/${lease.id}`}>
                                    {lease.tenant_name}
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div id="tour-msg-list" className="grid gap-4">
                {activeConversations.length > 0 ? (
                    activeConversations.map((lease) => {
                        const unread = unreadByLease[lease.id] || 0;
                        return (
                            <Link
                                key={lease.id}
                                href={`/gestion/messages/${lease.id}`}
                                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                                    unread > 0
                                        ? isDark
                                            ? 'bg-zinc-900 border-blue-500/40 hover:border-blue-400/60'
                                            : 'bg-blue-50/50 border-blue-200 hover:border-blue-300 hover:shadow-sm'
                                        : isDark
                                            ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">
                                            {(lease.tenant_name || 'L')[0].toUpperCase()}
                                        </div>
                                        {unread > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                                {unread > 9 ? '9+' : unread}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {lease.tenant_name}
                                        </h3>
                                        <p className={`text-sm line-clamp-1 ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
                                            {Array.isArray(lease.property)
                                                ? lease.property[0]?.title
                                                : lease.property?.title}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {unread > 0 && (
                                        <span className={`text-xs font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                            {unread} nouveau{unread > 1 ? 'x' : ''}
                                        </span>
                                    )}
                                    <ChevronRight className={`w-5 h-5 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`} />
                                </div>
                            </Link>
                        );
                    })
                ) : (
                    <div className={`text-center py-12 rounded-xl border border-dashed ${isDark
                        ? 'bg-zinc-900/50 border-zinc-800'
                        : 'bg-gray-50 border-gray-300'
                        }`}>
                        <MessageSquare className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-zinc-600' : 'text-gray-400'}`} />
                        <p className={`font-medium ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                            Aucune conversation
                        </p>
                        <p className={`text-sm mt-1 ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
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
