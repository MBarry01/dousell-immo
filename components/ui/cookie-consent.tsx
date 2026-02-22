"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCookieConsent } from "@/hooks/use-cookie-consent";

function Toggle({
  value,
  onChange,
  disabled = false,
}: {
  value: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      disabled={disabled}
      onClick={() => onChange?.(!value)}
      className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none ${
        disabled ? "cursor-not-allowed opacity-90" : "cursor-pointer"
      } ${value ? "bg-[#F4C430]" : "bg-white/15"}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full shadow-md transition-transform duration-200 ${
          value
            ? "translate-x-[1.875rem] bg-black"
            : "translate-x-1 bg-white/70"
        }`}
      />
    </button>
  );
}

export function CookieConsent() {
  const { hasAnswered, grantConsent, grantCustomConsent, isLoading } =
    useCookieConsent();
  const [marketing, setMarketing] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  if (isLoading || hasAnswered) return null;

  const handleAcceptSelection = () => {
    grantCustomConsent({ marketing, analytics });
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="cookie-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99] bg-black/60 backdrop-blur-sm"
      />

      {/* Card */}
      <motion.div
        key="cookie-consent"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
        className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-md md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f18] shadow-2xl">

          {/* Titre */}
          <div className="px-6 pb-4 pt-6">
            <h2 className="text-lg font-semibold text-white">Cookies</h2>
          </div>

          <div className="mx-6 h-px bg-white/10" />

          {/* Cookies nécessaires */}
          <div className="px-6 py-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-white">
                Cookies nécessaires
              </span>
              <Toggle value={true} disabled />
            </div>
            <p className="text-xs leading-relaxed text-white/55">
              Les cookies nécessaires sont requis pour le fonctionnement du
              site. Les cookies optionnels de marketing et d&apos;analyse nous
              aident à mesurer les campagnes et permettent à nos partenaires,
              notamment Google, de proposer des{" "}
              <a
                href="/legal/privacy"
                className="underline underline-offset-2 transition-colors hover:text-white/80"
              >
                publicités personnalisées
              </a>
              .
            </p>
          </div>

          <div className="mx-6 h-px bg-white/10" />

          {/* Cookies marketing */}
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm font-medium text-white">
              Cookies marketing
            </span>
            <Toggle value={marketing} onChange={setMarketing} />
          </div>

          {/* Cookies analytiques */}
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm font-medium text-white">
              Cookies analytiques
            </span>
            <Toggle value={analytics} onChange={setAnalytics} />
          </div>

          {/* Disclaimer */}
          <div className="px-6 pb-5">
            <p className="text-xs leading-relaxed text-white/45">
              En acceptant, vous consentez à l&apos;utilisation des cookies aux
              fins spécifiées. Vous pouvez retirer votre consentement et
              désactiver le partage de données à tout moment via les paramètres
              de confidentialité en bas de nos pages.
            </p>
          </div>

          <div className="mx-6 h-px bg-white/10" />

          {/* Boutons */}
          <div className="flex flex-col gap-3 p-6">
            <button
              onClick={handleAcceptSelection}
              className="w-full rounded-xl border border-white/20 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5 active:scale-95"
            >
              Accepter la sélection
            </button>
            <button
              onClick={grantConsent}
              className="w-full rounded-xl bg-[#F4C430] py-3 text-sm font-semibold text-black transition-all hover:bg-[#e5b820] active:scale-95"
            >
              Tout accepter
            </button>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
