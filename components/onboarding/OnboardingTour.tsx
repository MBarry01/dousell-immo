'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- TYPES ---
export interface TourStep {
  targetId: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt?: string;
}

interface OnboardingTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  storageKey?: string;
  isDark?: boolean; // Support mode light/dark
}

// --- COMPOSANT PRINCIPAL ---
export function OnboardingTour({
  steps,
  isOpen,
  onClose,
  onComplete,
  storageKey = 'dousell_tour',
  isDark = true
}: OnboardingTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isPositioned, setIsPositioned] = useState(false);

  // Variables de thème adaptatif (light/dark)
  // Couleur accent : Doré en dark, Bleu nuit grisé en light
  const accentColor = isDark ? '#F4C430' : '#7891A8';

  const theme = {
    // Tooltip background
    bgGradient: isDark
      ? 'linear-gradient(180deg, #1a1b1e 0%, #0f1012 100%)'
      : 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)',
    // Overlay gradient sur l'image
    overlayGradient: isDark
      ? 'from-[#0f1012] via-[#0f1012]/50'
      : 'from-white via-white/50',
    // Arrow background
    arrowBg: isDark ? '#1a1b1e' : '#ffffff',
    arrowGradient: isDark
      ? 'linear-gradient(135deg, #1a1b1e 0%, #0f1012 100%)'
      : 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
    // Textes
    titleText: isDark ? 'text-white' : 'text-gray-900',
    descText: isDark ? 'text-[#a1a1aa]' : 'text-gray-600',
    // Boutons
    closeBtn: isDark
      ? 'bg-black/30 text-white/40 hover:text-white hover:bg-black/50'
      : 'bg-gray-100/80 text-gray-500 hover:text-gray-900 hover:bg-gray-200',
    backBtn: isDark
      ? 'text-[#a1a1aa] hover:text-white border-[#3f3f46] hover:border-[#52525b] hover:bg-[#27272a]'
      : 'text-gray-600 hover:text-gray-900 border-gray-300 hover:border-gray-400 hover:bg-gray-100',
    ignoreBtn: isDark
      ? 'text-[#52525b] hover:text-[#a1a1aa]'
      : 'text-gray-400 hover:text-gray-600',
    // Progress dots
    dotActive: accentColor,
    dotInactive: isDark ? '#3f3f46' : '#e5e7eb',
    // Couleur accent pour bordures et badges
    accent: accentColor
  };

  // Stabiliser targetRect avec un objet sérialisé pour éviter re-renders inutiles
  const targetRectKey = targetRect
    ? `${targetRect.top}-${targetRect.left}-${targetRect.width}-${targetRect.height}`
    : null;

  // SSR Safety
  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloquer le scroll quand le tour est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Position de l'élément cible - useCallback avec dépendances stables
  const updateTargetPosition = useCallback(() => {
    if (!isOpen || steps.length === 0) return;

    const step = steps[currentStepIndex];
    if (!step) return;

    const element = document.getElementById(step.targetId);

    if (element) {
      // Cacher le tooltip pendant le repositionnement
      setIsPositioned(false);

      // Scroll vers l'élément avec marge pour éviter les débordements
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

      // Délai pour laisser le scroll finir et recalculer précisément
      setTimeout(() => {
        const rect = element.getBoundingClientRect();

        // S'assurer que le rect est valide et visible
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect(rect);
          setIsPositioned(true);
        } else {
          console.warn('[OnboardingTour] Element rect invalid:', step.targetId, rect);
          setTargetRect(null);
          setIsPositioned(false);
        }
      }, 400);
    } else {
      console.warn(`[OnboardingTour] Element with id "${step.targetId}" not found`);
      setTargetRect(null);
      setIsPositioned(false);
    }
  }, [currentStepIndex, isOpen, steps]);

  // Effet pour mettre à jour la position - NE PAS dépendre de updateTargetPosition
  useEffect(() => {
    updateTargetPosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIndex, isOpen]); // Seulement quand l'étape change

  // Effet séparé pour les événements resize/scroll
  useEffect(() => {
    let rafId: number | null = null;

    // Mise à jour fluide pendant le scroll avec requestAnimationFrame
    const handleScroll = () => {
      if (rafId !== null) return; // Déjà une mise à jour en cours

      rafId = requestAnimationFrame(() => {
        if (isPositioned && targetRect) {
          const step = steps[currentStepIndex];
          if (step) {
            const element = document.getElementById(step.targetId);
            if (element) {
              const rect = element.getBoundingClientRect();
              // Mettre à jour si le rect a changé (même légèrement)
              if (
                Math.abs(rect.top - targetRect.top) > 1 ||
                Math.abs(rect.left - targetRect.left) > 1
              ) {
                setTargetRect(rect);
              }
            }
          }
        }
        rafId = null;
      });
    };

    const handleResize = () => {
      updateTargetPosition();
    };

    // Écouter le scroll sur le conteneur scrollable principal
    const scrollContainer = document.querySelector('main.overflow-y-auto');

    window.addEventListener('resize', handleResize);
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      // Fallback sur window si le conteneur n'existe pas
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      } else {
        window.removeEventListener('scroll', handleScroll);
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPositioned, currentStepIndex]); // Pas de dépendance sur targetRect pour éviter boucle

  // Navigation
  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, 'true');
    }
    onComplete();
  };

  const handleIgnore = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, 'true');
    }
    onClose();
  };

  // Calcul intelligent de la position du Tooltip
  const tooltipStyle = useMemo(() => {
    if (!targetRect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', placement: 'center' as const };
    }

    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    // Responsive: adapter les dimensions selon l'appareil
    const isMobile = viewportWidth < 768;
    const isTablet = viewportWidth >= 768 && viewportWidth < 1024;

    const spacing = isMobile ? 12 : 16; // Espace entre target et tooltip
    const tooltipWidth = isMobile ? Math.min(320, viewportWidth - 24) : (isTablet ? 340 : 360);
    const tooltipHeight = isMobile ? 360 : 380;
    const margin = isMobile ? 8 : 12; // Marge par rapport aux bords de l'écran

    // Espace disponible de chaque côté de l'élément cible
    const spaceRight = viewportWidth - targetRect.right - margin;
    const spaceLeft = targetRect.left - margin;
    const spaceBottom = viewportHeight - targetRect.bottom - margin;
    const spaceTop = targetRect.top - margin;

    let top = 0;
    let left = 0;
    let placement: 'right' | 'left' | 'bottom' | 'top' | 'center' = 'right';

    // Préférence: droite > gauche > bas > haut

    // 1. Essayer à DROITE (aligné verticalement avec la cible)
    if (spaceRight >= tooltipWidth + spacing) {
      left = targetRect.right + spacing;
      top = Math.max(margin, Math.min(targetRect.top, viewportHeight - tooltipHeight - margin));
      placement = 'right';
      return { top, left, placement };
    }

    // 2. Essayer à GAUCHE
    if (spaceLeft >= tooltipWidth + spacing) {
      left = targetRect.left - tooltipWidth - spacing;
      top = Math.max(margin, Math.min(targetRect.top, viewportHeight - tooltipHeight - margin));
      placement = 'left';
      return { top, left, placement };
    }

    // 3. Essayer en BAS (centré horizontalement par rapport à la cible)
    if (spaceBottom >= tooltipHeight + spacing) {
      top = targetRect.bottom + spacing;
      // Centrer le tooltip par rapport à l'élément cible
      const targetCenter = targetRect.left + targetRect.width / 2;
      const tooltipLeft = targetCenter - tooltipWidth / 2;
      left = Math.max(margin, Math.min(tooltipLeft, viewportWidth - tooltipWidth - margin));
      placement = 'bottom';
      return { top, left, placement };
    }

    // 4. Essayer en HAUT (centré horizontalement par rapport à la cible)
    if (spaceTop >= tooltipHeight + spacing) {
      top = targetRect.top - tooltipHeight - spacing;
      // Centrer le tooltip par rapport à l'élément cible
      const targetCenter = targetRect.left + targetRect.width / 2;
      const tooltipLeft = targetCenter - tooltipWidth / 2;
      left = Math.max(margin, Math.min(tooltipLeft, viewportWidth - tooltipWidth - margin));
      placement = 'top';
      return { top, left, placement };
    }

    // 5. FALLBACK: Forcer le tooltip à être visible (centré sur l'écran si besoin)
    // On garantit que le tooltip reste TOUJOURS dans le viewport
    if (spaceBottom >= tooltipHeight / 2) {
      // Assez d'espace en bas, positionner sous l'élément (centré)
      top = Math.max(margin, Math.min(targetRect.bottom + spacing, viewportHeight - tooltipHeight - margin));
      const targetCenter = targetRect.left + targetRect.width / 2;
      const tooltipLeft = targetCenter - tooltipWidth / 2;
      left = Math.max(margin, Math.min(tooltipLeft, viewportWidth - tooltipWidth - margin));
      placement = 'bottom';
    } else if (spaceTop >= tooltipHeight / 2) {
      // Assez d'espace en haut, positionner au-dessus (centré)
      top = Math.max(margin, targetRect.top - tooltipHeight - spacing);
      const targetCenter = targetRect.left + targetRect.width / 2;
      const tooltipLeft = targetCenter - tooltipWidth / 2;
      left = Math.max(margin, Math.min(tooltipLeft, viewportWidth - tooltipWidth - margin));
      placement = 'top';
    } else {
      // Pas assez d'espace vertical, centrer le tooltip sur l'écran
      top = Math.max(margin, (viewportHeight - tooltipHeight) / 2);
      left = Math.max(margin, (viewportWidth - tooltipWidth) / 2);
      placement = 'center';
    }

    return { top, left, placement };
  }, [targetRectKey]); // Utiliser targetRectKey au lieu de targetRect pour éviter re-renders

  if (!mounted || !isOpen || steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // Arrow position helper
  const getArrowStyle = (placement: string) => {
    if (!targetRect) return { display: 'none' };

    const tooltipTop = typeof tooltipStyle.top === 'number' ? tooltipStyle.top : 0;
    const tooltipLeft = typeof tooltipStyle.left === 'number' ? tooltipStyle.left : 0;

    const targetCenterY = targetRect.top + targetRect.height / 2;
    const targetCenterX = targetRect.left + targetRect.width / 2;

    // Calculer la largeur réelle du tooltip selon le viewport
    const viewportWidth = window.innerWidth;
    const isMobile = viewportWidth < 768;
    const isTablet = viewportWidth >= 768 && viewportWidth < 1024;
    const actualTooltipWidth = isMobile ? Math.min(320, viewportWidth - 24) : (isTablet ? 340 : 360);
    const actualTooltipHeight = isMobile ? 360 : 380;

    switch (placement) {
      case 'right': {
        const arrowTop = Math.max(16, Math.min(targetCenterY - tooltipTop, actualTooltipHeight - 20));
        return { top: arrowTop, left: -6, borderLeft: '1px solid rgba(244, 196, 48, 0.2)', borderBottom: '1px solid rgba(244, 196, 48, 0.2)' };
      }
      case 'left': {
        const arrowTop = Math.max(16, Math.min(targetCenterY - tooltipTop, actualTooltipHeight - 20));
        return { top: arrowTop, right: -6, borderRight: '1px solid rgba(244, 196, 48, 0.2)', borderTop: '1px solid rgba(244, 196, 48, 0.2)' };
      }
      case 'bottom': {
        const arrowLeft = Math.max(16, Math.min(targetCenterX - tooltipLeft, actualTooltipWidth - 20));
        return { top: -6, left: arrowLeft, borderTop: '1px solid rgba(244, 196, 48, 0.2)', borderLeft: '1px solid rgba(244, 196, 48, 0.2)' };
      }
      case 'top': {
        const arrowLeft = Math.max(16, Math.min(targetCenterX - tooltipLeft, actualTooltipWidth - 20));
        return { bottom: -6, left: arrowLeft, borderRight: '1px solid rgba(244, 196, 48, 0.2)', borderBottom: '1px solid rgba(244, 196, 48, 0.2)' };
      }
      default: return { display: 'none' };
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] pointer-events-none">
      {/* OVERLAY SOMBRE avec effet Spotlight */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 pointer-events-auto"
        onClick={handleIgnore}
        style={{
          background: targetRect
            ? (() => {
                // Calculer le rayon du spotlight en fonction de la taille de l'élément
                const elementSize = Math.max(targetRect.width, targetRect.height);
                const innerRadius = Math.max(elementSize / 1.6, 50); // Minimum 50px
                const outerRadius = Math.max(elementSize / 1.1, 100); // Minimum 100px
                const centerX = targetRect.left + targetRect.width / 2;
                const centerY = targetRect.top + targetRect.height / 2;

                const overlayColor = isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.5)';
                return `radial-gradient(circle at ${centerX}px ${centerY}px, transparent ${innerRadius}px, ${overlayColor} ${outerRadius}px)`;
              })()
            : isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.5)',
          transition: 'background 0.3s ease'
        }}
      />

      {/* CADRE AUTOUR DE L'ÉLÉMENT (Highlight avec shimmer or) */}
      <AnimatePresence mode="wait">
        {targetRect && (() => {
          // Calcul des dimensions du cadre avec contraintes viewport
          const padding = 6;
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;

          // Position et taille du cadre, contraintes au viewport
          const highlightTop = Math.max(0, targetRect.top - padding);
          const highlightLeft = Math.max(0, targetRect.left - padding);
          const highlightWidth = Math.min(
            targetRect.width + padding * 2,
            viewportWidth - highlightLeft - 4
          );
          const highlightHeight = Math.min(
            targetRect.height + padding * 2,
            viewportHeight - highlightTop - 4
          );

          return (
            <motion.div
              key={`highlight-${currentStepIndex}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="absolute pointer-events-none rounded-lg"
              style={{
                top: highlightTop,
                left: highlightLeft,
                width: highlightWidth,
                height: highlightHeight,
                borderRadius: 12,
                border: `2.5px solid ${accentColor}`,
                boxShadow: isDark
                  ? '0 0 0 4px rgba(244, 196, 48, 0.15), 0 0 20px rgba(244, 196, 48, 0.4), 0 0 40px rgba(244, 196, 48, 0.2)'
                  : '0 0 0 4px rgba(120, 145, 168, 0.15), 0 0 20px rgba(120, 145, 168, 0.4), 0 0 40px rgba(120, 145, 168, 0.2)',
                // Transition seulement pour border-color et box-shadow (pas top/left/width/height car gérés par Framer Motion)
                transitionProperty: 'border-color, box-shadow',
                transitionDuration: '0.3s',
                transitionTimingFunction: 'ease'
              }}
            >
              {/* Shimmer effect */}
              <div
                className="absolute inset-0 overflow-hidden rounded-[10px]"
                style={{
                  background: isDark
                    ? 'linear-gradient(90deg, transparent, rgba(244,196,48,0.2), transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(120,145,168,0.2), transparent)',
                  animation: 'shimmer 2s infinite',
                  transition: 'background 0.3s ease'
                }}
              />
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* LE TOOLTIP CARD (Style Premium) */}
      <AnimatePresence mode="wait">
        {isPositioned && (
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="absolute pointer-events-auto w-[320px] md:w-[340px] lg:w-[360px] max-w-[calc(100vw-24px)]"
            style={{
              top: tooltipStyle.top,
              left: tooltipStyle.left,
            }}
          >
          <div className="relative">
            {/* Arrow */}
            {tooltipStyle.placement !== 'center' && (
              <div
                className="absolute w-3 h-3 rotate-45 z-0"
                style={{
                  ...getArrowStyle(tooltipStyle.placement),
                  background: theme.arrowGradient,
                }}
              />
            )}

            {/* Inner Card Content */}
            <div
              className="relative z-10 overflow-hidden"
              style={{
                background: theme.bgGradient,
                border: `1px solid ${accentColor}33`, // 20% opacity
                borderRadius: '16px',
                boxShadow: isDark
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(244, 196, 48, 0.1)'
                  : '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 30px rgba(120, 145, 168, 0.15)',
                transition: 'background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease'
              }}
            >
              {/* Bouton Fermer */}
              <button
                onClick={handleIgnore}
                className={`absolute top-3 right-3 z-20 p-1.5 rounded-full transition-all duration-200 backdrop-blur-sm ${theme.closeBtn}`}
              >
                <X size={14} />
              </button>

              {/* Numéro d'étape (Badge premium) */}
              <div
                className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: `${accentColor}1A`, // 10% opacity
                  borderColor: `${accentColor}33`, // 20% opacity
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  transition: 'background-color 0.3s ease, border-color 0.3s ease'
                }}
              >
                <span className="text-[11px] font-semibold" style={{ color: accentColor, transition: 'color 0.3s ease' }}>
                  {currentStepIndex + 1} / {steps.length}
                </span>
              </div>

              {/* Image (Haut) avec gradient overlay */}
              <div className="relative h-36 w-full overflow-hidden">
                <Image
                  src={currentStep.imageSrc}
                  alt={currentStep.imageAlt || currentStep.title}
                  fill
                  className="object-cover"
                  unoptimized={currentStep.imageSrc.startsWith('http')}
                />
                {/* Gradient overlay pour fusion avec le contenu */}
                <div className={`absolute inset-0 bg-gradient-to-t ${theme.overlayGradient} to-transparent`} />
                {/* Accent line (couleur adaptative) */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{
                    background: `linear-gradient(to right, transparent, ${accentColor}80, transparent)`,
                    transition: 'background 0.3s ease'
                  }}
                />
              </div>

              {/* Contenu (Bas) */}
              <div className="p-5 pt-3">
                {/* Titre */}
                <h3 className={`${theme.titleText} font-bold text-lg leading-tight mb-2`}>
                  {currentStep.title}
                </h3>

                {/* Description */}
                <p className={`${theme.descText} text-sm leading-relaxed mb-5`}>
                  {currentStep.description}
                </p>

                {/* Footer: Dots + Boutons */}
                <div className="flex items-center justify-between">
                  {/* Progress Dots */}
                  <div className="flex gap-1.5">
                    {steps.map((_, i) => (
                      <motion.div
                        key={i}
                        initial={false}
                        animate={{
                          width: i === currentStepIndex ? 20 : 8,
                          backgroundColor: i === currentStepIndex ? theme.dotActive : theme.dotInactive,
                          opacity: i <= currentStepIndex ? 1 : 0.5
                        }}
                        transition={{ duration: 0.2 }}
                        className="h-2 rounded-full"
                      />
                    ))}
                  </div>

                  {/* Boutons */}
                  <div className="flex items-center gap-2">
                    {/* Bouton Retour */}
                    {!isFirstStep && (
                      <button
                        onClick={handlePrev}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors rounded-lg border ${theme.backBtn}`}
                      >
                        Retour
                      </button>
                    )}

                    {/* Bouton Ignorer (seulement sur première étape) */}
                    {isFirstStep && (
                      <button
                        onClick={handleIgnore}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${theme.ignoreBtn}`}
                      >
                        Ignorer
                      </button>
                    )}

                    {/* Bouton Suivant / Terminer */}
                    <motion.button
                      onClick={handleNext}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg"
                      style={{
                        backgroundColor: accentColor,
                        color: isDark ? '#000000' : '#ffffff',
                        boxShadow: isDark
                          ? '0 0 15px rgba(244, 196, 48, 0.3)'
                          : '0 0 15px rgba(120, 145, 168, 0.3)',
                        transition: 'background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease'
                      }}
                    >
                      {isLastStep ? 'Terminer' : 'Suivant'}
                      {!isLastStep && <ChevronRight className="w-3.5 h-3.5" />}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* CSS pour l'animation shimmer */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>,
    document.body
  );
}

// --- HOOK POUR GÉRER L'ÉTAT DU TOUR ---
export function useOnboardingTour(storageKey: string, delay: number = 1000) {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem(storageKey);
    if (!hasSeenTour) {
      const timer = setTimeout(() => setShowTour(true), delay);
      return () => clearTimeout(timer);
    }
  }, [storageKey, delay]);

  const closeTour = useCallback(() => {
    setShowTour(false);
    localStorage.setItem(storageKey, 'true');
  }, [storageKey]);

  const resetTour = useCallback(() => {
    localStorage.removeItem(storageKey);
    setShowTour(true);
  }, [storageKey]);

  return { showTour, setShowTour, closeTour, resetTour };
}
