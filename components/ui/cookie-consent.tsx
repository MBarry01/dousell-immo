"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/hooks/use-cookie-consent";

export function CookieConsent() {
  const { hasAnswered, grantConsent, denyConsent, isLoading } =
    useCookieConsent();

  // Ne pas afficher si déjà répondu ou si en cours de chargement
  if (isLoading || hasAnswered) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        key="cookie-consent"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className="fixed bottom-0 left-0 right-0 z-[100] w-full border-t border-white/10 bg-black/90 p-4 backdrop-blur-md md:p-6"
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <p className="text-sm leading-relaxed text-white/90 md:text-base">
                Nous utilisons des cookies pour améliorer votre expérience,
                analyser le trafic et personnaliser le contenu. En continuant,
                vous acceptez notre utilisation des cookies.
              </p>
            </div>
            <div className="flex shrink-0 gap-3 md:flex-row">
              <Button
                variant="ghost"
                size="default"
                onClick={denyConsent}
                className="flex-1 md:flex-initial"
              >
                Refuser
              </Button>
              <Button
                variant="primary"
                size="default"
                onClick={grantConsent}
                className="flex-1 md:flex-initial"
              >
                Accepter
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
