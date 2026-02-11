'use client';

import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { OnboardingTour, useOnboardingTour, TourStep } from '@/components/onboarding/OnboardingTour';
import { useTheme } from '@/components/workspace/providers/theme-provider';

export function GestionTour() {
    const { showTour, closeTour, resetTour } = useOnboardingTour('dousell_gestion_tour', 1500);
    const { isDark } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isBottomNavVisible, setIsBottomNavVisible] = useState(false); // Initialize as false
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

        // Initialisation immédiate
        const initVisibility = () => {
            if (scrollContainer.scrollTop > 100) {
                setIsBottomNavVisible(false);
            } else {
                setIsBottomNavVisible(true);
            }
            // On met à jour lastScrollY pour éviter des sauts
            lastScrollY = scrollContainer.scrollTop;
        };

        // 1. Check immédiat
        initVisibility();

        // 2. Check retardé pour la restauration du scroll navigateur
        const timeoutId = setTimeout(initVisibility, 100);

        let lastScrollY = scrollContainer.scrollTop;
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const currentScrollY = scrollContainer.scrollTop;
                    const scrollDelta = currentScrollY - lastScrollY;

                    // Seuil de 10px pour éviter les micro-mouvements
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

    // Étapes du tour pour la page Gestion Locative
    const tourSteps: TourStep[] = useMemo(() => [
        {
            targetId: 'tour-gestion-kpi-cards',
            title: 'Statistiques en temps réel',
            description: 'Suivez vos indicateurs clés : taux d\'occupation, délais de paiement, taux d\'impayés et revenu moyen par bien.',
            imageSrc: 'https://images.unsplash.com/photo-1543286386-713df548e617?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Statistiques de gestion'
        },
        {
            targetId: 'tour-gestion-actions',
            title: 'Actions rapides',
            description: 'Générez vos documents (contrats, quittances, états des lieux) et ajoutez de nouveaux locataires en quelques clics.',
            imageSrc: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Actions de gestion'
        },
        {
            targetId: 'tour-gestion-table',
            title: 'Gestion des baux',
            description: 'Visualisez tous vos baux actifs, suivez les paiements, envoyez des relances et gérez vos locataires.',
            imageSrc: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Tableau de gestion'
        },
        {
            targetId: 'tour-gestion-revenue-chart',
            title: 'Historique des revenus',
            description: 'Analysez vos revenus collectés et attendus sur les 12 derniers mois pour mieux piloter votre activité.',
            imageSrc: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Graphique des revenus'
        }
    ], []);

    // Position intelligente selon le contexte
    const getButtonPosition = () => {
        if (!isMobile) {
            return 'bottom-6'; // Desktop : position normale
        }
        return isBottomNavVisible ? 'bottom-20' : 'bottom-6'; // Mobile : adaptatif
    };

    // Couleur accent adaptative : Doré en dark, Bleu nuit grisé en light
    const accentColor = isDark ? '#F4C430' : '#7891A8';

    // Bouton flottant à rendre dans un Portal - adaptatif light/dark
    const floatingButton = mounted ? createPortal(
        <button
            onClick={resetTour}
            className="fixed right-6 z-[100000] p-3 rounded-full shadow-lg backdrop-blur-sm"
            style={{
                bottom: getButtonPosition() === 'bottom-20' ? '5rem' : '1.5rem',
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: `${accentColor}33`, // 20% opacity
                borderWidth: '1px',
                borderStyle: 'solid',
                color: `${accentColor}99`, // 60% opacity
                transition: 'bottom 0.3s ease-out, background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease'
            }}
            title="Relancer le tutoriel"
            aria-label="Relancer le tutoriel de la page gestion"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
            </svg>
        </button>,
        document.body
    ) : null;

    // Callback pour changer de tab selon l'étape du tour
    const handleStepChange = (index: number) => {
        const step = tourSteps[index];
        if (!step) return;

        // Switch de tab basé sur le targetId
        if (step.targetId === 'tour-gestion-kpi-cards' || step.targetId === 'tour-gestion-revenue-chart') {
            window.dispatchEvent(new CustomEvent('dousell-tour-switch-tab', { detail: 'performance' }));
        } else if (step.targetId === 'tour-gestion-table' || step.targetId === 'tour-gestion-actions') {
            window.dispatchEvent(new CustomEvent('dousell-tour-switch-tab', { detail: 'overview' }));
        }
    };

    return (
        <>
            <OnboardingTour
                steps={tourSteps}
                isOpen={showTour}
                onClose={closeTour}
                onComplete={closeTour}
                storageKey="dousell_gestion_tour"
                isDark={isDark}
                onStepChange={handleStepChange}
            />

            {/* Bouton flottant monté directement dans le body via Portal, caché pendant le tour */}
            {!showTour && floatingButton}
        </>
    );
}
