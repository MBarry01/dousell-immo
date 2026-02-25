"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Building2, Search, ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { CldImageSafe } from "@/components/ui/CldImageSafe";
import confetti from "canvas-confetti";

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
  const [hasTeam, setHasTeam] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
        cleanUrl();
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, keep_first_login")
        .eq("id", user.id)
        .single();

      setUserName(
        profile?.full_name?.split(" ")[0] ||
        user.user_metadata?.full_name?.split(" ")[0] ||
        ""
      );
      // Vérifier si l'utilisateur a déjà une équipe active
      const { data: memberships } = await supabase
        .from("team_members")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1);

      setHasTeam(!!memberships && memberships.length > 0);
      setIsOpen(true);

      // Marquer first_login comme false, sauf pour les comptes de test (keep_first_login = true)
      if (!profile?.keep_first_login) {
        await supabase.from("profiles").update({ first_login: false }).eq("id", user.id);
      }
    };

    loadUser();
  }, [welcomeParam, router]);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const myConfetti = confetti.create(canvasRef.current, {
        resize: true,
        useWorker: true,
      });

      const duration = 4 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = {
        startVelocity: 15,
        spread: 45,
        ticks: 200,
        zIndex: 100,
        gravity: 0.8,
        scalar: 0.7
      };

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const colors = ['#FFD700', '#FFA500', '#B8860B', '#DAA520', '#D4AF37'];

        // Firing sober pulses from bottom corners of the banner
        myConfetti({
          ...defaults,
          particleCount: 8,
          origin: { x: 0, y: 1 },
          angle: 60,
          colors: colors
        });
        myConfetti({
          ...defaults,
          particleCount: 8,
          origin: { x: 1, y: 1 },
          angle: 120,
          colors: colors
        });
      }, 800);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const cleanUrl = () => {
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
    // Redimensionner intelligemment : 
    // Si l'utilisateur a déjà une équipe, aller au dashboard.
    // Sinon, aller au wizard de création.
    router.push(hasTeam ? "/gestion" : "/pro/start");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#0a0e17] shadow-2xl shadow-black/60"
          >
            {/* ── BANNER IMAGE ── */}
            <div className="relative h-48 w-full overflow-hidden sm:h-56">
              <canvas
                ref={canvasRef}
                className="pointer-events-none absolute inset-0 z-20 h-full w-full"
              />
              <CldImageSafe
                src="doussel/static/modals/bannerlogin1"
                alt="Bienvenue sur Dousell Immo"
                fill
                className="object-cover object-center"
                priority
              />
              {/* Gradient overlay bas → haut pour transition vers le fond du modal */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e17] via-[#0a0e17]/20 to-transparent" />

              {/* Bouton fermer */}
              <button
                onClick={handleClose}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/70 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white"
                aria-label="Fermer"
              >
                <X size={16} strokeWidth={2.5} />
              </button>

              {/* Badge compte créé */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 backdrop-blur-sm">
                  <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs font-semibold text-emerald-400">Compte créé avec succès</span>
                </div>
              </div>
            </div>

            {/* ── CONTENU ── */}
            <div className="px-6 pb-6 pt-4">
              {/* Titre */}
              <h2 className="mb-1 text-center text-xl font-bold text-white">
                Bienvenue{userName ? `, ${userName}` : ""}&nbsp;! 🎉
              </h2>
              <p className="mb-6 text-center text-sm text-white/50">
                Que souhaitez-vous faire dès maintenant ?
              </p>

              {/* Action cards */}
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Chercher un bien */}
                <button
                  onClick={handleClose}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-all duration-200 hover:border-white/20 hover:bg-white/10"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 transition-colors group-hover:bg-white/15">
                      <Search size={16} className="text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Chercher un bien</h3>
                  </div>
                  <p className="mb-3 text-xs text-white/40">
                    Explorez les annonces immobilières
                  </p>
                  <span className="flex items-center gap-1 text-xs font-medium text-[#F4C430] transition-all group-hover:gap-2">
                    Voir les annonces
                    <ArrowRight size={13} />
                  </span>
                </button>

                {/* Gérer mes biens */}
                <button
                  onClick={handleActivateGestion}
                  className="group rounded-2xl border border-[#F4C430]/30 bg-gradient-to-br from-[#F4C430]/10 to-[#F4C430]/5 p-4 text-left transition-all duration-200 hover:border-[#F4C430]/50 hover:from-[#F4C430]/15"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F4C430]/20 transition-colors group-hover:bg-[#F4C430]/30">
                      <Building2 size={16} className="text-[#F4C430]" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Gérer mes biens</h3>
                  </div>
                  <p className="mb-3 text-xs text-white/40">
                    Gestion locative professionnelle
                  </p>
                  <span className="flex items-center gap-1 text-xs font-medium text-[#F4C430] transition-all group-hover:gap-2">
                    Essai gratuit 14 jours
                    <ArrowRight size={13} />
                  </span>
                </button>
              </div>

              {/* Note bas */}
              <p className="mt-5 text-center text-[11px] text-white/25">
                Vous pouvez changer d&apos;avis à tout moment depuis votre compte.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
