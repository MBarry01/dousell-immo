"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true);
      }
    };
    checkInstalled();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      toast.success("Installation en cours...");
      setIsVisible(false);
      setDeferredPrompt(null);
    } else {
      toast.info("Installation annulée");
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in localStorage to avoid showing again for 7 days
    localStorage.setItem(
      "pwa-install-dismissed",
      new Date().toISOString()
    );
  };

  useEffect(() => {
    // Check if user dismissed recently
    const checkDismissed = () => {
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (dismissed) {
        const dismissedDate = new Date(dismissed);
        const daysSinceDismissed =
          (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) {
          setIsVisible(false);
        }
      }
    };
    checkDismissed();
  }, []);

  if (isInstalled || !isVisible || !deferredPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed inset-x-4 bottom-20 z-50 md:bottom-4 md:left-auto md:right-4 md:w-96"
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
              className="flex-1 rounded-full bg-white text-black"
              onClick={handleInstall}
            >
              <Download className="mr-2 h-4 w-4" />
              Installer
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

