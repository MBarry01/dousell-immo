'use client';

import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { OnboardingTour, useOnboardingTour, TourStep } from '@/components/onboarding/OnboardingTour';
import { useTheme } from "@/components/theme-provider";

export function ComptabiliteTour() {
    const { showTour, closeTour, resetTour } = useOnboardingTour('dousell_compta_tour', 1000);
    const { isDark } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Use setTimeout to avoid synchronous setState in effect
        setTimeout(() => setMounted(true), 0);
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        // Use setTimeout to avoid synchronous setState in effect
        setTimeout(checkMobile, 0);
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!isMobile) {
            // Use setTimeout to avoid synchronous setState in effect
            setTimeout(() => setIsBottomNavVisible(false), 0);
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

                    if (Math.abs(scrollDelta) > 10) {
                        if (scrollDelta > 0 && currentScrollY > 100) {
                            // Use setTimeout to avoid synchronous setState in effect
            setTimeout(() => setIsBottomNavVisible(false), 0);
                        } else if (scrollDelta < 0) {
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

    const tourSteps: TourStep[] = useMemo(() => [
        {
            targetId: 'tour-compta-export',
            title: 'Exports & Rapports',
            description: 'SÃ©lectionnez l\'annÃ©e fiscale et tÃ©lÃ©chargez un rapport PDF complet ou exportez vos donnÃ©es pour votre comptable.',
            imageSrc: 'https://images.unsplash.com/photo-1618044733300-9472054094ee?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Export Compta'
        },
        {
            targetId: 'tour-compta-kpi',
            title: 'Tableau de Bord Financier',
            description: 'Suivez en temps rÃ©el les loyers encaissÃ©s, en attente et les retards de paiement (avec taux de recouvrement).',
            imageSrc: 'https://images.unsplash.com/photo-1591696205602-2f950c417cb9?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'KPI Compta'
        },
        {
            targetId: 'tour-compta-chart',
            title: 'Analyses Visuelles',
            description: 'Visualisez l\'Ã©volution mensuelle de vos revenus et la rÃ©partition des paiements via des graphiques interactifs.',
            imageSrc: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Charts Compta'
        },
        {
            targetId: 'tour-compta-tabs',
            title: 'DÃ©tails & DÃ©penses',
            description: 'Naviguez entre les onglets pour gÃ©rer vos dÃ©penses dÃ©ductibles et analyser la rentabilitÃ© nette bien par bien.',
            imageSrc: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Onglets Compta'
        }
    ], []);

    const getButtonPosition = () => {
        if (!isMobile) {
            return 'bottom-6';
        }
        return isBottomNavVisible ? 'bottom-20' : 'bottom-6';
    };

    const accentColor = isDark ? '#F4C430' : '#7891A8';

    const floatingButton = mounted ? createPortal(
        <button
            onClick={resetTour}
            className="fixed right-6 z-\[9990\] p-3 rounded-full shadow-lg backdrop-blur-sm"
            style={{
                bottom: getButtonPosition() === 'bottom-20' ? 'calc(5rem + env(safe-area-inset-bottom, 0px))' : 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: `${accentColor}33`,
                borderWidth: '1px',
                borderStyle: 'solid',
                color: `${accentColor}99`,
                transition: 'bottom 0.3s ease-out, background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease'
            }}
            title="Relancer le tutoriel"
            aria-label="Relancer le tutoriel comptabilitÃ©"
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
                storageKey="dousell_compta_tour"
                isDark={isDark}
            />

            {!showTour && floatingButton}
        </>
    );
}
