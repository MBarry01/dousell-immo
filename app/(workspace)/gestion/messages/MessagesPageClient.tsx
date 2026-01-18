'use client';

import { useMemo } from 'react';
import { MessageSquare, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTheme } from '@/components/workspace/providers/theme-provider';
import { OnboardingTour, useOnboardingTour, TourStep } from "@/components/onboarding/OnboardingTour";

interface Lease {
    id: string;
    tenant_name: string;
    property?: { title: string } | { title: string }[];
}

interface MessagesPageClientProps {
    activeConversations: Lease[];
    tenantsWithoutConversation: Lease[];
}

export function MessagesPageClient({
    activeConversations,
    tenantsWithoutConversation
}: MessagesPageClientProps) {
    const { isDark } = useTheme();
    const { showTour, closeTour, resetTour } = useOnboardingTour('dousell_messagerie_tour', 1500);

    const tourSteps: TourStep[] = useMemo(() => [
        {
            targetId: 'tour-msg-new',
            title: 'Nouveau message',
            description: 'Démarrez une conversation avec un locataire. Sélectionnez-le dans la liste pour lui envoyer un message.',
            imageSrc: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Nouveau message'
        },
        {
            targetId: 'tour-msg-list',
            title: 'Vos conversations',
            description: 'Retrouvez ici toutes vos conversations avec vos locataires. Cliquez sur une conversation pour l\'ouvrir.',
            imageSrc: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Liste des conversations'
        }
    ], []);

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Premium Onboarding Tour */}
            <OnboardingTour
                steps={tourSteps}
                isOpen={showTour}
                onClose={closeTour}
                onComplete={closeTour}
                storageKey="dousell_messagerie_tour"
            />

            <div className="flex items-center justify-between">
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
                    activeConversations.map((lease) => (
                        <Link
                            key={lease.id}
                            href={`/gestion/messages/${lease.id}`}
                            className={`p-4 rounded-xl border flex items-center justify-between transition-all ${isDark
                                ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">
                                    {(lease.tenant_name || 'L')[0].toUpperCase()}
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
                            <ChevronRight className={`w-5 h-5 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`} />
                        </Link>
                    ))
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

            {/* Bouton pour relancer le tour */}
            <button
                onClick={resetTour}
                className={`fixed bottom-4 right-4 z-50 p-2.5 rounded-full transition-all duration-200 shadow-lg ${isDark
                    ? 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                    : 'bg-white border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300'
                    }`}
                title="Relancer le tutoriel"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <path d="M12 17h.01" />
                </svg>
            </button>
        </div>
    );
}
