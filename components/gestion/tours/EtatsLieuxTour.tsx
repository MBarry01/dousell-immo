'use client';

import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { OnboardingTour, useOnboardingTour, TourStep } from '@/components/onboarding/OnboardingTour';
import { useTheme } from '@/components/workspace/providers/theme-provider';

export function EtatsLieuxTour() {
    const { showTour, closeTour, resetTour } = useOnboardingTour('dousell_edl_tour', 1000);
    const { isDark } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // Attendre que le composant soit monté côté client
    useEffect(() => {
        setMounted(true);

        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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

                    if (Math.abs(scrollDelta) > 10) {
                        if (scrollDelta > 0 && currentScrollY > 100) {
                            setIsBottomNavVisible(false);
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
            targetId: 'tour-edl-list',
            title: 'Historique des rapports',
            description: 'Retrouvez ici tous vos états des lieux d\'entrée et de sortie, classés par date. Suivez leur statut (brouillon, complété, signé) en un coup d\'œil.',
            imageSrc: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Liste des états des lieux'
        },
        {
            targetId: 'tour-edl-new',
            title: 'Nouveau constat',
            description: 'Lancez un nouvel état des lieux numérique. Notre assistant vous guidera pièce par pièce pour tout documenter avec photos.',
            imageSrc: 'https://images.unsplash.com/photo-1626178793926-22b28830aa30?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Nouvel état des lieux'
        },
        {
            targetId: 'tour-edl-pdf',
            title: 'Modèle PDF Vierge',
            description: 'Besoin d\'une version papier ? Téléchargez un modèle d\'état des lieux vierge conforme à la loi ALUR pour le remplir manuellement.',
            imageSrc: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'PDF Vierge'
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
            aria-label="Relancer le tutoriel des états des lieux"
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
                storageKey="dousell_edl_tour"
                isDark={isDark}
            />

            {!showTour && floatingButton}
        </>
    );
}
