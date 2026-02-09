"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion-wrapper";

export const HeroSection = () => {
  return (
    <>
      {/* Mobile Layout - Immersion Totale */}
      {/* 
        Responsive breakpoints basés sur les standards iOS/Android:
        - iPhone SE (petit): 375px - min-h-[650px] ≈ 97% viewport
        - iPhone 12/13 (moyen): 390px - min-h-[711px] ≈ 85% viewport  
        - iPhone 14 Pro Max (grand): 428px - min-h-[711px] ≈ 77% viewport
        Breakpoint sm:640px pour tablettes petites
      */}
      <section
        className="relative md:hidden min-h-[100svh] overflow-visible rounded-none mb-0 pt-0 pb-0"
        suppressHydrationWarning
      >
        {/* Image de fond - pleine immersion */}
        {/* Taille prédéfinie pour mobile/tablette pour un affichage optimal */}
        {/* Dimensions optimisées pour mobile: largeur fixe selon breakpoints */}
        <div
          className="absolute flex flex-wrap justify-start items-start ml-0 mr-0"
          style={{
            top: 0,
            left: 0,
            width: '100%',
            maxWidth: '100vw',
            height: '404px'
          }}
          suppressHydrationWarning
        >
          <Image
            src="/monument.png"
            alt="Monument Renaissance Africaine"
            fill
            priority
            className="object-cover object-center md:object-contain"
            sizes="(max-width: 360px) 360px, (max-width: 375px) 375px, (max-width: 390px) 390px, (max-width: 414px) 414px, (max-width: 428px) 428px, (max-width: 640px) 640px, (max-width: 768px) 768px, 100vw"
            quality={85}
            style={{
              objectPosition: "center center",
            }}
          />
        </div>

        {/* Heavy Gradient - garantit la lisibilité du texte */}
        {/* Responsive: w-screen pour couvrir toute la largeur de l'écran, débordant du padding parent */}
        {/* Positionnement absolu avec inset-y-0 et w-screen pour garantir la couverture complète des bords */}
        <div
          className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/95 via-black/60 to-transparent"
        />

        {/* Contenu aligné en bas - au-dessus du gradient */}
        {/* 
          Hauteur responsive:
          - Par défaut (< 375px): min-h-[600px] pour très petits écrans
          - 375px+ (iPhone SE): min-h-[650px] 
          - 390px+ (iPhone 12/13): min-h-[703px]
          - Padding horizontal: px-4 sur petits écrans, px-6 sur écrans ≥640px
          - Padding bottom avec safe area: 101px + safe-area-inset-bottom
        */}
        <div className="relative z-20 flex min-h-[100svh] h-full flex-col justify-end px-4 sm:px-6 pb-2 mr-0 pb-safe-nav pt-20">
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight text-white">
              Immobilier au Sénégal
              <span className="sr-only"> : Achat, location et gestion locative</span>
            </h1>
            <p className="text-lg text-white/90 max-w-xl">
              Plus de 500 biens vérifiés à Dakar et sur la Petite Côte.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3">
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
              className="h-[50px] rounded-full border border-white/20 bg-white/10 px-8 text-white hover:bg-white/20"
            >
              <Link href="/planifier-visite">Planifier une visite</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Desktop Layout - Style actuel */}
      <section className="hidden md:flex relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[#0d101b] via-[#05080c] to-[#05080c] p-10 min-h-[500px] items-center text-white shadow-[0_20px_120px_rgba(5,8,12,0.45)]" suppressHydrationWarning>
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="space-y-4">
            <FadeIn delay={0}>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                Immobilier au Sénégal
                <span className="sr-only sm:not-sr-only"> : Achète ou investis en toute confiance</span>
              </h1>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p className="text-lg text-white/70 sm:text-xl">
                <span className="md:hidden">Plus de 500 biens vérifiés à Dakar et sur la Petite Côte.</span>
                <span className="hidden md:inline">Avec plus de 500 biens vérifiés à Dakar et sur la Petite Côte, Dousell Immo s&apos;impose comme la plateforme immobilière de référence au Sénégal. Que ce soit pour l&apos;achat ou la gestion locative, nous connectons propriétaires et investisseurs grâce à des outils digitaux sécurisés.</span>
              </p>
            </FadeIn>
          </div>
          <FadeIn delay={0.2}>
            <div className="flex flex-col gap-3 sm:flex-row">
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
                className="h-[50px] rounded-full border border-white/20 bg-white/5 px-8 text-white hover:bg-white/10"
              >
                <Link href="/planifier-visite">Planifier une visite</Link>
              </Button>
            </div>
          </FadeIn>
        </div>

        {/* Image Monument - fond transparent pour laisser passer le dégradé du hero */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0 }}
          className="absolute inset-0 z-0 w-full h-full pointer-events-none"
          suppressHydrationWarning
        >
          {/* Conteneur qui pousse l'image à droite */}
          <div className="absolute right-0 bottom-0 h-full w-full md:w-3/4 lg:w-2/3" suppressHydrationWarning>
            <Image
              src="/monument.png"
              alt="Monument Renaissance Africaine"
              fill
              priority
              className="object-contain object-right-bottom opacity-55"
              sizes="60vw"
              quality={75}
            />
          </div>
        </motion.div>

        {/* Decorative blur effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="pointer-events-none absolute -right-10 top-10 h-64 w-64 rounded-full bg-amber-200/30 blur-[120px]"
          suppressHydrationWarning
        />
      </section>
    </>
  );
};
