'use client';

import { useMemo } from 'react';
import { MaintenanceHub } from '../components/MaintenanceHub';
import { OnboardingTour, useOnboardingTour, TourStep } from "@/components/onboarding/OnboardingTour";
import { FloatingHelpButton } from '@/components/ui/floating-help-button';
import { useTheme } from '@/components/workspace/providers/theme-provider';

interface MaintenanceRequest {
    id: string;
    description: string;
    category?: string;
    status: 'open' | 'artisan_found' | 'awaiting_approval' | 'approved' | 'in_progress' | 'completed';
    created_at: string;
    artisan_name?: string;
    artisan_phone?: string;
    artisan_rating?: number;
    artisan_address?: string;
    quoted_price?: number;
    intervention_date?: string;
    owner_approved?: boolean;
}

interface InterventionsPageClientProps {
    requests: MaintenanceRequest[];
}

export function InterventionsPageClient({ requests }: InterventionsPageClientProps) {
    const { isDark } = useTheme();
    const { showTour, closeTour, resetTour } = useOnboardingTour('dousell_interventions_tour', 1500);

    const tourSteps: TourStep[] = useMemo(() => [
        {
            targetId: 'tour-intervention-signaler',
            title: 'Signaler un problème',
            description: 'Cliquez ici pour déclarer une panne ou un besoin de réparation. Notre système trouvera un artisan qualifié.',
            imageSrc: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Signaler une intervention'
        },
        {
            targetId: 'tour-intervention-list',
            title: 'Suivi des interventions',
            description: 'Retrouvez toutes vos demandes ici. Suivez leur statut en temps réel : recherche d\'artisan, devis, validation, travaux en cours.',
            imageSrc: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Liste des interventions'
        }
    ], []);

    return (
        <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
            {/* Premium Onboarding Tour */}
            <OnboardingTour
                steps={tourSteps}
                isOpen={showTour}
                onClose={closeTour}
                onComplete={closeTour}
                storageKey="dousell_interventions_tour"
            />

            {/* Header */}
            <div
                id="tour-intervention-stats"
                className={`border-b ${isDark
                    ? 'border-slate-800 bg-slate-900/50'
                    : 'border-gray-200 bg-white/50'
                    }`}
            >
                <div className="w-full mx-auto px-4 md:px-6 py-4">
                    <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Interventions & Maintenance
                    </h1>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                        Gérez les demandes d'intervention de vos locataires
                    </p>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="w-full mx-auto px-4 md:px-6 py-6">
                <div id="tour-intervention-list" className="w-full">
                    <MaintenanceHub requests={requests} />
                </div>
            </div>

            {/* Bouton pour relancer le tour (Portal) */}
            <FloatingHelpButton onClick={resetTour} />
        </div>
    );
}
