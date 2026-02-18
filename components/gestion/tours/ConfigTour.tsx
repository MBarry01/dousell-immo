'use client';

import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { OnboardingTour, useOnboardingTour, TourStep } from '@/components/onboarding/OnboardingTour';
import { useTheme } from "@/components/theme-provider";

export function ConfigTour() {
    const { showTour, closeTour, resetTour } = useOnboardingTour('dousell_config_tour', 1000);
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
            targetId: 'tour-config-tabs',
            title: 'Paramètres avancés',
            description: 'Configurez votre espace de travail. Personnalisez votre profil et votre image de marque (logo, couleurs) pour vos documents.',
            imageSrc: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Config Tabs'
        },
        {
            targetId: 'tour-config-subscription', // Will need to add this ID if possible, or just guide generally
            title: 'Votre Abonnement',
            description: 'Gérez votre offre (Starter, Pro, Business), consultez vos factures et mettez à jour votre méthode de paiement.',
            imageSrc: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Abonnement'
        },
        {
            targetId: 'tour-config-api', // Will need to add this ID if possible
            title: 'Intégrations API',
            description: 'Connectez vos outils externes via notre API pour automatiser vos processus de gestion.',
            imageSrc: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'API'
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
            aria-label="Relancer le tutoriel configuration"
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
                storageKey="dousell_config_tour"
                isDark={isDark}
            />

            {!showTour && floatingButton}
        </>
    );
}
