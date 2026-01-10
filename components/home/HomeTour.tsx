'use client';

import { useMemo } from 'react';
import { OnboardingTour, useOnboardingTour, TourStep } from '@/components/onboarding/OnboardingTour';

interface HomeTourProps {
    hasProperties?: boolean;
}

export function HomeTour({ hasProperties = false }: HomeTourProps) {
    const { showTour, closeTour, resetTour } = useOnboardingTour('dousell_home_tour', 1500);

    // Étapes du tour pour mobile (ciblant la bottom nav)
    const tourSteps: TourStep[] = useMemo(() => [
        {
            targetId: 'tour-home-search',
            title: 'Rechercher un bien',
            description: 'Explorez des milliers d\'annonces immobilières vérifiées au Sénégal. Locations, ventes, terrains.',
            imageSrc: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Recherche immobilière'
        },
        {
            targetId: 'tour-home-gestion',
            title: 'Gestion Locative',
            description: 'Gérez vos biens, loyers et locataires en toute simplicité. Contrats, quittances et relances automatiques.',
            imageSrc: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Gestion locative'
        },
        {
            targetId: 'tour-home-account',
            title: 'Votre Compte',
            description: 'Retrouvez vos favoris, documents et informations personnelles. Publiez vos annonces gratuitement.',
            imageSrc: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Compte utilisateur'
        }
    ], []);

    // Ne pas afficher si l'utilisateur a déjà des propriétés (utilisateur existant)
    if (hasProperties) return null;

    return (
        <>
            <OnboardingTour
                steps={tourSteps}
                isOpen={showTour}
                onClose={closeTour}
                onComplete={closeTour}
                storageKey="dousell_home_tour"
            />

            {/* Bouton pour relancer le tour - Style identique à GestionLocativeClient */}
            <button
                onClick={resetTour}
                className="fixed bottom-20 right-4 z-50 p-2.5 rounded-full transition-all duration-200 shadow-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 md:bottom-4"
                title="Relancer le tutoriel"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <path d="M12 17h.01" />
                </svg>
            </button>
        </>
    );
}
