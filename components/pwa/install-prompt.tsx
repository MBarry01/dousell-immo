"use client";

import { useEffect, useState } from "react";
import { Download, X, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Platform = "ios" | "android" | "other";

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "other";

  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);

  if (isIOS) return "ios";
  if (isAndroid) return "android";
  return "other";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true ||
    document.referrer.includes("android-app://")
  );
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    setIsInstalled(isStandalone());

    // Detect platform
    setPlatform(detectPlatform());

    // Check if user dismissed recently
    const checkDismissed = () => {
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (dismissed) {
        const dismissedDate = new Date(dismissed);
        const daysSinceDismissed =
          (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
        // Show again after 1 day instead of 7 days
        if (daysSinceDismissed < 1) {
          return false;
        }
      }
      return true;
    };

    // Handle beforeinstallprompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      if (checkDismissed() && !isStandalone()) {
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setIsVisible(true);
      }
    };

    // For iOS, show prompt after a delay if not installed
    if (platform === "ios" && !isStandalone() && checkDismissed()) {
      // Show iOS prompt after 3 seconds on mobile
      const timer = setTimeout(() => {
        if (window.innerWidth <= 768) {
          setIsVisible(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }

    // For Android/Chrome, listen for beforeinstallprompt
    if (platform !== "ios") {
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      // Fallback: Show prompt on mobile Android after delay if no beforeinstallprompt
      const fallbackTimer = setTimeout(() => {
        if (
          platform === "android" &&
          window.innerWidth <= 768 &&
          !isStandalone() &&
          checkDismissed()
        ) {
          // Check if deferredPrompt was set in the meantime
          if (!deferredPrompt) {
            setIsVisible(true);
          }
        }
      }, 5000);

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        clearTimeout(fallbackTimer);
      };
    }
  }, [platform]);

  const handleInstall = async () => {
    if (platform === "ios") {
      setShowIOSInstructions(true);
      return;
    }

    // Android/Chrome: Use native prompt if available
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
          toast.success("Installation en cours...");
          setIsVisible(false);
          setDeferredPrompt(null);
        } else {
          toast.info("Installation annulée");
        }
      } catch (error) {
        console.error("Error during install:", error);
        toast.error("Erreur lors de l'installation");
      }
      return;
    }

    // Fallback: Show instructions for manual installation
    if (platform === "android") {
      toast.info("Utilisez le menu de votre navigateur pour installer l'app");
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowIOSInstructions(false);
    // Store dismissal in localStorage to avoid showing again for 1 day
    localStorage.setItem(
      "pwa-install-dismissed",
      new Date().toISOString()
    );
  };

  if (isInstalled) {
    return null;
  }

  // iOS Instructions Modal
  if (showIOSInstructions) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b0f18] p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Installer sur iOS
              </h3>
              <button
                onClick={handleDismiss}
                className="text-white/50 hover:text-white"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 text-sm text-white/80">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-white">
                  1
                </div>
                <div>
                  <p className="font-semibold text-white">Appuyez sur le bouton Partager</p>
                  <p className="text-xs text-white/60">En bas de l&apos;écran (icône carrée avec flèche)</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-white">
                  2
                </div>
                <div>
                  <p className="font-semibold text-white">Sélectionnez &quot;Sur l&apos;écran d&apos;accueil&quot;</p>
                  <p className="text-xs text-white/60">Faites défiler si nécessaire</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-white">
                  3
                </div>
                <div>
                  <p className="font-semibold text-white">Confirmez l&apos;installation</p>
                  <p className="text-xs text-white/60">L&apos;app apparaîtra sur votre écran d&apos;accueil</p>
                </div>
              </div>
            </div>
            <Button
              className="mt-6 w-full rounded-full"
              onClick={handleDismiss}
            >
              J&apos;ai compris
            </Button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Main install prompt
  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        key="install-prompt-banner"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed inset-x-4 bottom-20 z-[45] md:bottom-4 md:left-auto md:right-4 md:w-96"
      >
        <div className="rounded-2xl border border-white/10 bg-[#0b0f18]/95 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white">
                Installer Dousell Immo
              </h3>
              <p className="mt-1 text-xs text-white/70">
                Ajoutez l&apos;app à votre écran d&apos;accueil pour un accès
                rapide
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/50 hover:text-white"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 rounded-full border border-white/10 bg-white/5 text-white"
              onClick={handleDismiss}
            >
              Plus tard
            </Button>
            <Button
              size="sm"
              className="flex-1 rounded-full"
              onClick={handleInstall}
            >
              {platform === "ios" ? (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  Installer
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Installer
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

