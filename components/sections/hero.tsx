"use client";

import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { CldImageSafe } from "@/components/ui/CldImageSafe";

export const HeroSection = () => {
  return (
    <>
      {/* ========== MOBILE HERO — Immersion plein écran ========== */}
      <section
        className="relative md:hidden overflow-hidden"
        style={{ minHeight: "100svh" }}
        suppressHydrationWarning
      >
        {/* Image de fond — taille naturelle, ancrée en haut */}
        <div className="absolute inset-0">
          <CldImageSafe
            src="doussel/static/banners/monument"
            alt="Monument Renaissance Africaine"
            fill
            priority
            className="object-contain object-top"
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 100vw"
          />
        </div>

        {/* Gradient fort en bas pour lisibilité du texte */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black from-30% via-black/70 via-60% to-transparent" />

        {/* Contenu ancré en bas — remonté agressivement pour la nav bar (160px) */}
        <div
          className="relative z-20 flex flex-col justify-end px-4 sm:px-6 pt-20"
          style={{
            minHeight: "100svh",
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 160px)",
          }}
        >
          <div className="space-y-1 mb-4">
            <h1 className="text-[clamp(1.75rem,7vw,2.25rem)] font-semibold leading-tight text-white">
              Immobilier au Sénégal
              <span className="sr-only"> : Achat, location et gestion locative</span>
            </h1>
            <p className="text-[clamp(1rem,3.5vw,1.125rem)] text-white/90 max-w-xl">
              Plus de 500 biens vérifiés à Dakar et sur la Petite Côte.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              asChild
              size="lg"
              className="h-[50px] rounded-full px-8"
            >
              <Link href="/recherche">Découvrir les biens</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-[50px] rounded-full border border-white/20 bg-white/10 px-8 text-white hover:bg-white/20 hover:text-white"
            >
              <Link href="/compte/deposer">Publier un bien</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Desktop Layout - Style actuel */}
      <section className="hidden md:flex relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[#0d101b] via-[#05080c] to-[#05080c] p-6 lg:p-10 min-h-[420px] lg:min-h-[500px] items-center text-white shadow-[0_20px_120px_rgba(5,8,12,0.45)]" suppressHydrationWarning>
        <div className="relative z-10 max-w-[55%] lg:max-w-2xl space-y-5 lg:space-y-6">
          <div className="space-y-3 lg:space-y-4">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
              <h1 className="text-[clamp(1.75rem,4vw,3rem)] font-semibold leading-tight">
                Immobilier au Sénégal
                <span className="sr-only sm:not-sr-only"> : Achète ou investis en toute confiance</span>
              </h1>
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both delay-100">
              <p className="text-[clamp(0.9375rem,1.5vw,1.25rem)] text-white/70">
                <span className="md:hidden">Plus de 500 biens vérifiés à Dakar et sur la Petite Côte.</span>
                <span className="hidden md:inline">Avec plus de 500 biens vérifiés à Dakar et sur la Petite Côte, Dousel s'impose comme la plateforme immobilière de référence au Sénégal. Que ce soit pour l'achat ou la gestion locative, nous connectons propriétaires et investisseurs grâce à des outils digitaux sécurisés.</span>
              </p>
            </div>
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both delay-200">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-[46px] lg:h-[50px] rounded-full px-6 lg:px-8 text-[clamp(0.875rem,1.2vw,1rem)]"
              >
                <Link href="/recherche">Découvrir les biens</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-[46px] lg:h-[50px] rounded-full border border-white/20 bg-white/5 px-6 lg:px-8 text-white hover:bg-white/10 hover:text-white text-[clamp(0.875rem,1.2vw,1rem)]"
              >
                <Link href="/compte/deposer">Publier un bien</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Image Monument - fond transparent pour laisser passer le dégradé du hero */}
        <div
          className="absolute inset-0 z-0 w-full h-full pointer-events-none animate-in fade-in slide-in-from-right-8 duration-1000 fill-mode-both"
          suppressHydrationWarning
        >
          {/* Conteneur qui pousse l'image à droite */}
          <div className="absolute right-0 bottom-0 h-full w-full md:w-1/2 lg:w-2/3" suppressHydrationWarning>
            <CldImageSafe
              src="doussel/static/banners/monument"
              alt="Monument Renaissance Africaine"
              fill
              priority
              className="object-contain object-right-bottom opacity-55"
              sizes="60vw"
            />
          </div>
        </div>

        {/* Decorative blur effect */}
        <div
          className="pointer-events-none absolute -right-10 top-10 h-64 w-64 rounded-full bg-amber-200/30 blur-[120px] animate-in fade-in duration-700 fill-mode-both delay-300"
          suppressHydrationWarning
        />
      </section>
    </>
  );
};
