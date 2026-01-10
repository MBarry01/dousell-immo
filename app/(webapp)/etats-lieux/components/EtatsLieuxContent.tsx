"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import { Plus, FileText, CheckCircle, Clock, Edit, ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DeleteInventoryButton } from './DeleteInventoryButton';
import {
    ThemedPage,
    ThemedCard,
    ThemedText,
    ThemedEmptyState,
    ThemedBadge,
    ThemedAlert
} from '../../components/ThemedComponents';
import { useTheme } from '../../theme-provider';
import { OnboardingTour, useOnboardingTour, TourStep } from '@/components/onboarding/OnboardingTour';

const statusConfig: Record<string, { label: string; variant: "default" | "warning" | "success"; icon: any }> = {
    'draft': { label: 'Brouillon', variant: 'default', icon: Edit },
    'completed': { label: 'Complété', variant: 'warning', icon: Clock },
    'signed': { label: 'Signé', variant: 'success', icon: CheckCircle },
};

const typeLabels: Record<string, string> = {
    'entry': 'Entrée',
    'exit': 'Sortie',
};

export function EtatsLieuxContent({ reports, error }: { reports: any[]; error: string | null }) {
    const { isDark } = useTheme();
    const { showTour, closeTour, resetTour } = useOnboardingTour('dousell_etats_lieux_tour', 1500);

    const tourSteps: TourStep[] = useMemo(() => [
        {
            targetId: 'tour-edl-new',
            title: 'Créer un état des lieux',
            description: 'Documentez l\'état du bien à l\'entrée ou à la sortie d\'un locataire. Le rapport sera généré automatiquement.',
            imageSrc: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Nouvel état des lieux'
        },
        {
            targetId: 'tour-edl-pdf',
            title: 'PDF Vierge',
            description: 'Téléchargez un formulaire vierge à imprimer pour réaliser l\'état des lieux sur papier.',
            imageSrc: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'PDF vierge'
        },
        {
            targetId: 'tour-edl-list',
            title: 'Vos rapports',
            description: 'Retrouvez tous vos états des lieux ici. Cliquez sur un rapport pour le consulter, le modifier ou le faire signer.',
            imageSrc: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Liste des rapports'
        }
    ], []);

    return (
        <ThemedPage>
            {/* Premium Onboarding Tour */}
            <OnboardingTour
                steps={tourSteps}
                isOpen={showTour}
                onClose={closeTour}
                onComplete={closeTour}
                storageKey="dousell_etats_lieux_tour"
            />

            {/* Header */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <Link
                        href="/gestion-locative"
                        className={`transition-colors shrink-0 ${isDark
                                ? 'text-white/60 hover:text-white'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="min-w-0">
                        <ThemedText as="h1" variant="primary" className="text-lg sm:text-2xl font-semibold truncate">
                            États des Lieux
                        </ThemedText>
                        <ThemedText as="p" variant="muted" className="text-sm">
                            {reports.length} rapport{reports.length !== 1 ? 's' : ''}
                        </ThemedText>
                    </div>
                </div>
                <div className="flex gap-1.5 sm:gap-2 shrink-0">
                    <div id="tour-edl-pdf">
                        <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className={isDark
                                ? 'border-slate-700 text-slate-300 hover:bg-slate-800 px-2 sm:px-3'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-100 px-2 sm:px-3'
                            }
                        >
                            <Link href="/etats-lieux/formulaire-vierge">
                                <Printer className="w-4 h-4 sm:mr-2" />
                                <span className="hidden sm:inline">PDF Vierge</span>
                            </Link>
                        </Button>
                    </div>
                    <div id="tour-edl-new">
                        <Button asChild size="sm" className={`px-2 sm:px-3 ${isDark ? "bg-[#F4C430] hover:bg-[#D4A420] text-black" : "bg-slate-900 hover:bg-slate-800 text-white"}`}>
                            <Link href="/etats-lieux/new">
                                <Plus className="w-4 h-4 sm:mr-2" />
                                <span className="hidden sm:inline">Nouveau</span>
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* List */}
            {error ? (
                <ThemedAlert variant="error">
                    Erreur: {error}
                </ThemedAlert>
            ) : reports.length === 0 ? (
                <ThemedEmptyState
                    icon={FileText}
                    title="Aucun état des lieux"
                    description="Créez votre premier état des lieux pour documenter l'état du bien à l'entrée ou à la sortie du locataire."
                    action={
                        <Button asChild className={isDark ? "bg-[#F4C430] hover:bg-[#D4A420] text-black" : "bg-slate-900 hover:bg-slate-800 text-white"}>
                            <Link href="/etats-lieux/new">
                                <Plus className="w-4 h-4 mr-2" />
                                Créer un état des lieux
                            </Link>
                        </Button>
                    }
                />
            ) : (
                <div id="tour-edl-list" className="grid gap-3">
                    {reports.map((report, index) => {
                        const status = statusConfig[report.status] || statusConfig['draft'];
                        const StatusIcon = status.icon;

                        return (
                            <ThemedCard
                                key={report.id}
                                hover
                                className="p-4 flex items-start justify-between gap-4 group"
                            >
                                <Link
                                    href={`/etats-lieux/${report.id}`}
                                    className="flex-1 min-w-0 flex items-start justify-between gap-4"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${report.type === 'entry'
                                                    ? isDark
                                                        ? 'bg-blue-500/20 text-blue-300'
                                                        : 'bg-blue-100 text-blue-700'
                                                    : isDark
                                                        ? 'bg-orange-500/20 text-orange-300'
                                                        : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                {typeLabels[report.type]}
                                            </span>
                                            <ThemedBadge variant={status.variant}>
                                                <StatusIcon className="w-3 h-3" />
                                                {status.label}
                                            </ThemedBadge>
                                        </div>

                                        <ThemedText as="h3" variant="primary" className="font-medium truncate">
                                            {report.lease?.property_address || 'Adresse non renseignée'}
                                        </ThemedText>
                                        <ThemedText as="p" variant="muted" className="text-sm">
                                            {report.lease?.tenant_name || 'Locataire'}
                                        </ThemedText>
                                    </div>

                                    <div className="text-right text-xs">
                                        <ThemedText variant="muted">
                                            {format(new Date(report.report_date), 'd MMM yyyy', { locale: fr })}
                                        </ThemedText>
                                        {report.signed_at && (
                                            <p className={`mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'
                                                }`}>
                                                Signé le {format(new Date(report.signed_at), 'd MMM', { locale: fr })}
                                            </p>
                                        )}
                                    </div>
                                </Link>

                                <div className={`pl-2 border-l self-stretch flex items-center ${isDark ? 'border-slate-800' : 'border-gray-200'
                                    }`}>
                                    <DeleteInventoryButton id={report.id} />
                                </div>
                            </ThemedCard>
                        );
                    })}
                </div>
            )}

            {/* Bouton pour relancer le tour */}
            <button
                onClick={resetTour}
                className={`fixed bottom-4 right-4 z-50 p-2.5 rounded-full transition-all duration-200 shadow-lg ${
                    isDark
                        ? 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                        : 'bg-white border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300'
                }`}
                title="Relancer le tutoriel"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <path d="M12 17h.01"/>
                </svg>
            </button>
        </ThemedPage>
    );
}
