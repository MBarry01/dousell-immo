'use client';

import { useMemo, useState, useEffect } from 'react';
import { OnboardingTour, useOnboardingTour, TourStep } from '@/components/onboarding/OnboardingTour';

interface HomeTourProps {
    hasProperties?: boolean;
}

export function HomeTour({ hasProperties = false }: HomeTourProps) {
    const { showTour, closeTour, resetTour } = useOnboardingTour('dousell_home_tour', 1500);
    const [isMobile, setIsMobile] = useState(false);

    // Détecter mobile vs desktop
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Étapes du tour - différentes selon mobile/desktop
    const tourSteps: TourStep[] = useMemo(() => {
        if (isMobile) {
            // Mobile: cibler le header + bottom nav
            return [
                {
                    targetId: 'tour-home-add-mobile',
                    title: 'Déposer une annonce',
                    description: 'Publiez votre bien gratuitement en quelques clics.',
                    imageSrc: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
                    imageAlt: 'Déposer annonce'
                },
                {
                    targetId: 'tour-home-search',
                    title: 'Rechercher un bien',
                    description: 'Explorez des milliers d\'annonces immobilières vérifiées au Sénégal.',
                    imageSrc: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=600',
                    imageAlt: 'Recherche immobilière'
                },
                {
                    targetId: 'tour-home-gestion',
                    title: 'Gestion Locative',
                    description: 'Gérez vos biens, loyers et locataires en toute simplicité.',
                    imageSrc: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
                    imageAlt: 'Gestion locative'
                },
                {
                    targetId: 'tour-home-account',
                    title: 'Votre Compte',
                    description: 'Retrouvez vos favoris, documents et informations personnelles.',
                    imageSrc: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
                    imageAlt: 'Compte utilisateur'
                }
            ];
        } else {
            // Desktop: cibler le header
            return [
                {
                    targetId: 'tour-home-nav-search-desktop',
                    title: 'Parcourir les annonces',
                    description: 'Explorez des milliers d\'annonces immobilières vérifiées au Sénégal.',
                    imageSrc: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=600',
                    imageAlt: 'Recherche immobilière'
                },
                {
                    targetId: 'tour-home-add-desktop',
                    title: 'Déposer une annonce',
                    description: 'Publiez votre bien gratuitement en quelques clics. Photos, description, prix.',
                    imageSrc: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
                    imageAlt: 'Déposer annonce'
                },
                {
                    targetId: 'tour-home-menu-desktop',
                    title: 'Votre Espace',
                    description: 'Accédez à votre profil, gestion locative, favoris et paramètres.',
                    imageSrc: 'https://images.unsplash.com/photo-1761839256602-0e28a5ab928d?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                    imageAlt: 'Menu utilisateur'
                }
            ];
        }
    }, [isMobile]);

    // Reset automatique au premier chargement pour test
    useEffect(() => {
        localStorage.removeItem('dousell_home_tour');
    }, []);

    return (
        <>
            <OnboardingTour
                steps={tourSteps}
                isOpen={showTour}
                onClose={closeTour}
                onComplete={closeTour}
                storageKey="dousell_home_tour"
            />

            {/* Bouton pour relancer le tour */}
            <button
                onClick={resetTour}
                className="fixed bottom-20 right-4 z-50 p-2.5 rounded-full transition-all duration-200 shadow-lg bg-black/80 border border-white/10 text-white/50 hover:text-white hover:border-white/20 md:bottom-4"
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
