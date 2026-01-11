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
}

// --- COMPOSANT PRINCIPAL ---
export function OnboardingTour({
  steps,
  isOpen,
  onClose,
  onComplete,
  storageKey = 'dousell_premium_tour'
}: OnboardingTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isPositioned, setIsPositioned] = useState(false);

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

  // Position de l'élément cible
  const updateTargetPosition = useCallback(() => {
    if (!isOpen || steps.length === 0) return;

    const step = steps[currentStepIndex];
    if (!step) return;

    const element = document.getElementById(step.targetId);

    if (element) {
      // Cacher le tooltip pendant le repositionnement
      setIsPositioned(false);

      // Scroll vers l'élément
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Petit délai pour laisser le scroll finir
      setTimeout(() => {
        setTargetRect(element.getBoundingClientRect());
        setIsPositioned(true);
      }, 350);
    } else {
      setTargetRect(null);
      setIsPositioned(false);
    }
  }, [currentStepIndex, isOpen, steps]);

  useEffect(() => {
    updateTargetPosition();

    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition);

    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition);
    };
  }, [updateTargetPosition]);

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
  // RÈGLE: Le tooltip doit être PROCHE de l'élément mais JAMAIS le chevaucher
  const tooltipStyle = useMemo(() => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', placement: 'center' as const };

    const spacing = 16; // Espace entre target et tooltip
    const tooltipWidth = 340;
    const tooltipHeight = 380;
    const margin = 12; // Marge par rapport aux bords de l'écran

    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    // Espace disponible de chaque côté de l'élément cible
    const spaceRight = viewportWidth - targetRect.right - margin;
    const spaceLeft = targetRect.left - margin;
    const spaceBottom = viewportHeight - targetRect.bottom - margin;
    const spaceTop = targetRect.top - margin;

    let top = 0;
    let left = 0;
    let placement: 'right' | 'left' | 'bottom' | 'top' | 'center' = 'right';

    // Préférence: droite > gauche > bas > haut
    // Le tooltip est placé JUSTE À CÔTÉ de l'élément, aligné avec lui

    // 1. Essayer à DROITE (aligné verticalement avec la cible)
    if (spaceRight >= tooltipWidth + spacing) {
      left = targetRect.right + spacing;
      // Aligner le haut du tooltip avec le haut de la cible, ajuster si déborde
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

    // 3. Essayer en BAS (aligné horizontalement avec la cible)
    if (spaceBottom >= tooltipHeight + spacing) {
      top = targetRect.bottom + spacing;
      // Aligner la gauche du tooltip avec la gauche de la cible, ajuster si déborde
      left = Math.max(margin, Math.min(targetRect.left, viewportWidth - tooltipWidth - margin));
      placement = 'bottom';
      return { top, left, placement };
    }

    // 4. Essayer en HAUT
    if (spaceTop >= tooltipHeight + spacing) {
      top = targetRect.top - tooltipHeight - spacing;
      left = Math.max(margin, Math.min(targetRect.left, viewportWidth - tooltipWidth - margin));
      placement = 'top';
      return { top, left, placement };
    }

    // 5. FALLBACK: Positionner juste en dessous à droite de la cible (décalé pour éviter chevauchement)
    // On place le tooltip là où il y a le plus d'espace, mais proche de la cible
    const bestVertical = spaceBottom > spaceTop ? 'bottom' : 'top';
    const bestHorizontal = spaceRight > spaceLeft ? 'right' : 'left';

    if (bestVertical === 'bottom') {
      top = Math.min(targetRect.bottom + spacing, viewportHeight - tooltipHeight - margin);
    } else {
      top = Math.max(margin, targetRect.top - tooltipHeight - spacing);
    }

    if (bestHorizontal === 'right') {
      left = Math.min(targetRect.right + spacing, viewportWidth - tooltipWidth - margin);
    } else {
      left = Math.max(margin, targetRect.left - tooltipWidth - spacing);
    }

    placement = 'center';
    return { top, left, placement };
  }, [targetRect]);

  if (!mounted || !isOpen || steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // Arrow position helper - calcule la position pour pointer vers l'élément cible
  const getArrowStyle = (placement: string) => {
    if (!targetRect) return { display: 'none' };

    const tooltipTop = typeof tooltipStyle.top === 'number' ? tooltipStyle.top : 0;
    const tooltipLeft = typeof tooltipStyle.left === 'number' ? tooltipStyle.left : 0;

    // Calculer où la flèche doit pointer (centre de l'élément cible)
    const targetCenterY = targetRect.top + targetRect.height / 2;
    const targetCenterX = targetRect.left + targetRect.width / 2;

    switch (placement) {
      case 'right': {
        // Flèche à gauche du tooltip, pointant vers la cible
        const arrowTop = Math.max(16, Math.min(targetCenterY - tooltipTop, 360));
        return { top: arrowTop, left: -6, borderLeft: '1px solid rgba(244, 196, 48, 0.2)', borderBottom: '1px solid rgba(244, 196, 48, 0.2)' };
      }
      case 'left': {
        // Flèche à droite du tooltip
        const arrowTop = Math.max(16, Math.min(targetCenterY - tooltipTop, 360));
        return { top: arrowTop, right: -6, borderRight: '1px solid rgba(244, 196, 48, 0.2)', borderTop: '1px solid rgba(244, 196, 48, 0.2)' };
      }
      case 'bottom': {
        // Flèche en haut du tooltip
        const arrowLeft = Math.max(16, Math.min(targetCenterX - tooltipLeft, 320));
        return { top: -6, left: arrowLeft, borderTop: '1px solid rgba(244, 196, 48, 0.2)', borderLeft: '1px solid rgba(244, 196, 48, 0.2)' };
      }
      case 'top': {
        // Flèche en bas du tooltip
        const arrowLeft = Math.max(16, Math.min(targetCenterX - tooltipLeft, 320));
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
            ? `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${Math.max(targetRect.width, targetRect.height) / 1.8}px, rgba(0,0,0,0.75) ${Math.max(targetRect.width, targetRect.height) / 1.2}px)`
            : 'rgba(0,0,0,0.75)'
        }}
      />

      {/* CADRE AUTOUR DE L'ÉLÉMENT (Highlight avec shimmer or) */}
      <AnimatePresence mode="wait">
        {targetRect && (
          <motion.div
            key={`highlight-${currentStepIndex}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute pointer-events-none rounded-lg"
            style={{
              top: targetRect.top - 6,
              left: targetRect.left - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
              borderRadius: 12,
              border: '2.5px solid #F4C430',
              boxShadow: '0 0 0 4px rgba(244, 196, 48, 0.15), 0 0 20px rgba(244, 196, 48, 0.4), 0 0 40px rgba(244, 196, 48, 0.2)',
            }}
          >
            {/* Shimmer effect */}
            <div
              className="absolute inset-0 overflow-hidden rounded-[10px]"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(244,196,48,0.2), transparent)',
                animation: 'shimmer 2s infinite'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* LE TOOLTIP CARD (Style HP OMEN Premium) */}
      <AnimatePresence mode="wait">
        {isPositioned && (
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="absolute pointer-events-auto w-[340px]"
            style={{
              top: tooltipStyle.top,
              left: tooltipStyle.left,
            }}
          >
          <div className="relative">
            {/* Arrow */}
            {tooltipStyle.placement !== 'center' && (
              <div
                className="absolute w-3 h-3 bg-[#1a1b1e] rotate-45 z-0"
                style={{
                  ...getArrowStyle(tooltipStyle.placement),
                  background: 'linear-gradient(135deg, #1a1b1e 0%, #0f1012 100%)',
                }}
              />
            )}

            {/* Inner Card Content */}
            <div
              className="relative z-10 overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, #1a1b1e 0%, #0f1012 100%)',
                border: '1px solid rgba(244, 196, 48, 0.2)',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(244, 196, 48, 0.1)'
              }}
            >
              {/* Bouton Fermer */}
              <button
                onClick={handleIgnore}
                className="absolute top-3 right-3 z-20 p-1.5 rounded-full transition-all duration-200 bg-black/30 backdrop-blur-sm text-white/40 hover:text-white hover:bg-black/50"
              >
                <X size={14} />
              </button>

              {/* Numéro d'étape (Badge premium) */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F4C430]/10 border border-[#F4C430]/20">
                <span className="text-[11px] font-semibold text-[#F4C430]">
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
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1012] via-[#0f1012]/50 to-transparent" />
                {/* Accent line gold */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#F4C430]/50 to-transparent" />
              </div>

              {/* Contenu (Bas) */}
              <div className="p-5 pt-3">
                {/* Titre */}
                <h3 className="text-white font-bold text-lg leading-tight mb-2">
                  {currentStep.title}
                </h3>

                {/* Description */}
                <p className="text-[#a1a1aa] text-sm leading-relaxed mb-5">
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
                          backgroundColor: i === currentStepIndex ? '#F4C430' : '#3f3f46',
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
                        className="px-3 py-1.5 text-xs font-medium text-[#a1a1aa] hover:text-white transition-colors rounded-lg border border-[#3f3f46] hover:border-[#52525b] hover:bg-[#27272a]"
                      >
                        Retour
                      </button>
                    )}

                    {/* Bouton Ignorer (seulement sur première étape) */}
                    {isFirstStep && (
                      <button
                        onClick={handleIgnore}
                        className="px-3 py-1.5 text-xs font-medium text-[#52525b] hover:text-[#a1a1aa] transition-colors"
                      >
                        Ignorer
                      </button>
                    )}

                    {/* Bouton Suivant / Terminer */}
                    <motion.button
                      onClick={handleNext}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all',
                        'bg-[#F4C430] hover:bg-[#d4a82a] text-black',
                        'shadow-[0_0_15px_rgba(244,196,48,0.3)]'
                      )}
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
