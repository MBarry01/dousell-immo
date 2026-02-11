"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Buildings, MagnifyingGlass, ArrowRight, Sparkle, X } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Modal de bienvenue affiché au-dessus de la page d'accueil
 * Déclenché par ?welcome=true dans l'URL
 * Fermer = rester sur la vitrine (chercher un bien)
 */
export function WelcomeModalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const welcomeParam = searchParams.get("welcome");

  useEffect(() => {
    if (welcomeParam !== "true") {
      setIsOpen(false);
      return;
    }

    const loadUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Pas connecte, retirer le param
        cleanUrl();
        return;
      }

      // Verifier si l'utilisateur a deja une equipe
      const { data: membership } = await supabase
        .from("team_members")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (membership) {
        // Deja une equipe, rediriger vers gestion
        router.replace("/gestion");
        return;
      }

      // Recuperer le nom
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      setUserName(
        profile?.full_name?.split(" ")[0] ||
        user.user_metadata?.full_name?.split(" ")[0] ||
        ""
      );
      setIsOpen(true);
    };

    loadUser();
  }, [welcomeParam, router]);

  const cleanUrl = () => {
    // Retirer ?welcome=true de l'URL sans rechargement
    const params = new URLSearchParams(searchParams.toString());
    params.delete("welcome");
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  };

  const handleClose = () => {
    setIsOpen(false);
    cleanUrl();
  };

  const handleActivateGestion = () => {
    setIsOpen(false);
    cleanUrl();
    router.push("/pro/start");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-[#0a0e17] p-8 shadow-2xl shadow-black/50"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-full p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Fermer"
            >
              <X size={20} weight="bold" />
            </button>

            {/* Success icon */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F4C430]/20">
                  <Sparkle size={32} weight="fill" className="text-[#F4C430]" />
                </div>
                <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Welcome text */}
            <h2 className="mb-2 text-center text-2xl font-bold text-white">
              Bienvenue{userName ? `, ${userName}` : ""} !
            </h2>
            <p className="mb-8 text-center text-white/50">
              Que souhaitez-vous faire ?
            </p>

            {/* Action cards */}
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Chercher un bien */}
              <button
                onClick={handleClose}
                className="group rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition-all duration-200 hover:border-white/20 hover:bg-white/10"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition-colors group-hover:bg-white/15">
                  <MagnifyingGlass size={20} className="text-white" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-white">Chercher un bien</h3>
                <p className="mb-3 text-xs text-white/40">
                  Explorez les annonces immobilieres
                </p>
                <span className="flex items-center gap-1 text-xs font-medium text-[#F4C430] transition-all group-hover:gap-2">
                  Voir les annonces
                  <ArrowRight size={14} />
                </span>
              </button>

              {/* Gerer mes biens */}
              <button
                onClick={handleActivateGestion}
                className="group rounded-2xl border border-[#F4C430]/30 bg-gradient-to-br from-[#F4C430]/10 to-[#F4C430]/5 p-5 text-left transition-all duration-200 hover:border-[#F4C430]/50"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4C430]/20 transition-colors group-hover:bg-[#F4C430]/30">
                  <Buildings size={20} className="text-[#F4C430]" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-white">Gerer mes biens</h3>
                <p className="mb-3 text-xs text-white/40">
                  Gestion locative professionnelle
                </p>
                <span className="flex items-center gap-1 text-xs font-medium text-[#F4C430] transition-all group-hover:gap-2">
                  Essai gratuit 14 jours
                  <ArrowRight size={14} />
                </span>
              </button>
            </div>

            {/* Bottom note */}
            <p className="mt-6 text-center text-[11px] text-white/30">
              Vous pouvez changer d&apos;avis a tout moment depuis votre compte.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
