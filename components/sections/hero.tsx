"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion-wrapper";

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[#0d101b] via-[#05080c] to-[#05080c] p-6 text-white shadow-[0_20px_120px_rgba(5,8,12,0.45)] sm:p-10 md:min-h-[500px] flex items-center">
      <div className="relative z-10 max-w-2xl space-y-6 mt-8 md:mt-0">
        <div className="space-y-4">
          <FadeIn delay={0.2}>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              L&apos;immobilier de confiance, de Dakar à la Petite Côte.
            </h1>
          </FadeIn>
          <FadeIn delay={0.3}>
            <p className="text-lg text-white/70 sm:text-xl">
              Accédez à une sélection exclusive de villas, terrains et appartements. Almadies, Saly, Diamniadio ou en région : trouvez votre bien idéal sans surprise.
            </p>
          </FadeIn>
        </div>
        <FadeIn delay={0.4}>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-[50px] rounded-full bg-white px-8 text-black hover:bg-white/90"
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
        transition={{ duration: 1, delay: 0.2 }}
        className="absolute inset-0 z-0 w-full h-full pointer-events-none hidden md:block"
      >
        {/* Conteneur qui pousse l'image à droite */}
        <div className="absolute right-0 bottom-0 h-full w-full md:w-3/4 lg:w-2/3">
          <Image
            src="/monument.png"
            alt="Monument Renaissance Africaine"
            fill
            priority
            className="object-contain object-right-bottom opacity-55"
            sizes="(max-width: 768px) 100vw, 60vw"
            quality={75}
          />
        </div>
      </motion.div>

      {/* Decorative blur effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="pointer-events-none absolute -right-10 top-10 hidden h-64 w-64 rounded-full bg-amber-200/30 blur-[120px] md:block"
      />
    </section>
  );
};
