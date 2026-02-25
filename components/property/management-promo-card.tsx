"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { CldImageSafe } from "@/components/ui/CldImageSafe";
import { ArrowRight, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const DISMISS_KEY = "dousell-promo-gestion-dismissed";
const SCROLL_THRESHOLD = 800; // px avant apparition

/**
 * Bandeau promo horizontal "Gestion locative" — apparaît en popup flottant
 * après un scroll suffisant sur les pages de recherche / annonces.
 * Dismissable avec persistance en sessionStorage (revient à la prochaine session).
 */
export const ManagementPromoCard = () => {
    const { user } = useAuth();
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(() => {
        if (typeof window !== "undefined") {
            return !!sessionStorage.getItem(DISMISS_KEY);
        }
        return false;
    });

    useEffect(() => {
        const onScroll = () => {
            if (window.scrollY > SCROLL_THRESHOLD) {
                setVisible(true);
            }
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();

        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const handleDismiss = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDismissed(true);
        sessionStorage.setItem(DISMISS_KEY, "1");
    };

    if (dismissed || !visible) return null;

    const href = user ? "/gestion" : "/pro/start";

    return (
        <div className="fixed left-4 right-4 z-40 mx-auto max-w-3xl animate-in slide-in-from-bottom-8 fade-in-0 duration-500 bottom-above-mobile-nav">
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-[#0c1117]/95 shadow-2xl shadow-black/40 backdrop-blur-xl transition-all hover:border-primary/40 hover:shadow-primary/10">
                <Link
                    href={href}
                    className="group flex items-stretch outline-none"
                >
                    {/* Ligne accent */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

                    {/* Image à gauche - Plus compacte sur mobile */}
                    <div className="relative w-16 shrink-0 sm:w-24">
                        <CldImageSafe
                            src="doussel/static/modals/banner-popup1"
                            alt="Gestion locative Dousell"
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 64px, 96px"
                        />
                        <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-r from-transparent to-[#0c1117]/95 sm:w-8" />
                    </div>

                    {/* Contenu - Espacements réduits sur mobile */}
                    <div className="flex flex-1 items-center justify-between gap-2 px-3 py-3 sm:gap-5 sm:px-5 sm:py-4">
                        {/* Texte - min-w-0 crucial pour le flex-1 truncate */}
                        <div className="min-w-0 flex-1 pr-4 sm:pr-0">
                            <p className="truncate text-[13px] font-bold text-white sm:text-base">
                                Propriétaire d&apos;un bien ?
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-white/50 sm:text-sm">
                                Suivez loyers et contrats en ligne.
                            </p>
                        </div>

                        {/* CTA desktop */}
                        <div className="hidden shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-black transition-all group-hover:gap-2 sm:flex">
                            Gestion locative
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </div>

                        {/* CTA mobile compact - Décalé pour ne pas gêner le X */}
                        <div className="mr-6 flex shrink-0 items-center justify-center rounded-lg bg-primary p-2 sm:hidden">
                            <ArrowRight className="h-3.5 w-3.5 text-black" />
                        </div>
                    </div>
                </Link>

                {/* Bouton fermer - Sorti du Link pour éviter nesting invalide */}
                <button
                    onClick={handleDismiss}
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full text-white/30 transition-colors hover:bg-white/10 hover:text-white/70"
                    aria-label="Fermer"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};
