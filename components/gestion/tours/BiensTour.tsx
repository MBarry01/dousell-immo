'use client';

import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { OnboardingTour, useOnboardingTour, TourStep } from '@/components/onboarding/OnboardingTour';
import { useTheme } from "@/components/theme-provider";

export function BiensTour({ canCreate = false }: { canCreate?: boolean }) {
    const { showTour, closeTour, resetTour } = useOnboardingTour('dousell_biens_tour', 1000);
    const { isDark } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // Attendre que le composant soit monté côté client
    useEffect(() => {
        setMounted(true);

        // Détecter si mobile
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024); // lg breakpoint
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Détecter la visibilité de la bottom nav (sur mobile uniquement)
    useEffect(() => {
        if (!isMobile) {
            setIsBottomNavVisible(false);
            return;
        }

        const scrollContainer = document.querySelector("main.overflow-y-auto");
        if (!scrollContainer) return;

        let lastScrollY = scrollContainer.scrollTop;
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const currentScrollY = scrollContainer.scrollTop;
                    const scrollDelta = currentScrollY - lastScrollY;

                    // Même logique que la bottom nav
                    if (Math.abs(scrollDelta) > 10) {
                        if (scrollDelta > 0 && currentScrollY > 100) {
                            // Scroll vers le bas -> bottom nav cachée
                            setIsBottomNavVisible(false);
                        } else if (scrollDelta < 0) {
                            // Scroll vers le haut -> bottom nav visible
                            setIsBottomNavVisible(true);
                        }
                        lastScrollY = currentScrollY;
                    }

                    ticking = false;
                });
                ticking = true;
            }
        };

        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            scrollContainer.removeEventListener('scroll', handleScroll);
        };
    }, [isMobile]);

    // Étapes du tour pour la page Biens
    const tourSteps: TourStep[] = useMemo(() => {
        const steps = [
            {
                targetId: 'tour-biens-header',
                title: 'Gestion de vos biens',
                description: 'Retrouvez ici l\'ensemble de votre parc immobilier, avec une vue d\'ensemble sur les biens en vente, en location et leur statut de publication.',
                imageSrc: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600',
                imageAlt: 'Propriété immobilière'
            },
            {
                targetId: 'tour-biens-stats',
                title: 'Indicateurs clés',
                description: 'Suivez en un coup d\'œil le nombre de biens en ligne, en attente ou brouillon, ainsi que la répartition vente/location.',
                imageSrc: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600',
                imageAlt: 'Statistiques'
            },
            {
                targetId: 'tour-biens-search-filters',
                title: 'Recherche et Filtres',
                description: 'Trouvez rapidement un bien par nom, ville ou locataire. Filtrez par type (Vente/Location) ou statut pour affiner votre vue.',
                imageSrc: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600',
                imageAlt: 'Recherche'
            }
        ];

        if (canCreate) {
            steps.push({
                targetId: 'tour-biens-add-button',
                title: 'Ajouter un nouveau bien',
                description: 'Créez une nouvelle fiche bien en quelques étapes simples pour commencer à le commercialiser ou le gérer.',
                imageSrc: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=600',
                imageAlt: 'Nouveau bien'
            });
        }

        return steps;
    }, [canCreate]);

    // Position intelligente selon le contexte
    const getButtonPosition = () => {
        if (!isMobile) {
            return 'bottom-6'; // Desktop : position normale
        }
        return isBottomNavVisible ? 'bottom-20' : 'bottom-6'; // Mobile : adaptatif
    };

    // Couleur accent adaptative
    const accentColor = isDark ? '#F4C430' : '#7891A8';

    // Bouton flottant à rendre dans un Portal - adaptatif light/dark
    const floatingButton = mounted ? createPortal(
        <button
            onClick={resetTour}
            className="fixed right-6 z-[100000] p-3 rounded-full shadow-lg backdrop-blur-sm"
            style={{
                bottom: getButtonPosition() === 'bottom-20' ? '5rem' : '1.5rem',
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: `${accentColor}33`,
                borderWidth: '1px',
                borderStyle: 'solid',
                color: `${accentColor}99`,
                transition: 'bottom 0.3s ease-out, background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease'
            }}
            title="Relancer le tutoriel"
            aria-label="Relancer le tutoriel de la page biens"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
            </svg>
        </button>,
        document.body
    ) : null;

    return (
        <>
            <OnboardingTour
                steps={tourSteps}
                isOpen={showTour}
                onClose={closeTour}
                onComplete={closeTour}
                storageKey="dousell_biens_tour"
                isDark={isDark}
            />

            {!showTour && floatingButton}
        </>
    );
}
