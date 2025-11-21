"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Shield, Sparkles, MapPin, ArrowRight, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

const valeurs = [
  {
    icon: Shield,
    title: "Confiance",
    description: "Transactions sécurisées, contrats transparents et accompagnement personnalisé pour chaque projet immobilier.",
  },
  {
    icon: Sparkles,
    title: "Innovation",
    description: "Plateforme mobile-first et outils modernes pour simplifier votre recherche et vos démarches immobilières.",
  },
  {
    icon: MapPin,
    title: "Expertise Locale",
    description: "Connaissance approfondie du marché sénégalais, de Dakar à la Petite Côte, pour vous guider vers le bien idéal.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export default function AProposPage() {
  return (
    <div className="space-y-12 py-10">
      {/* Hero Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.6 }}
        className="rounded-[36px] border border-white/10 bg-gradient-to-br from-[#0d101b] via-[#05080c] to-[#05080c] p-8 text-white shadow-2xl sm:p-12"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">
          Notre mission
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
          Rendre l&apos;immobilier transparent au Sénégal
        </h1>
        <p className="mt-6 text-lg text-white/70 sm:text-xl">
          Dousell Immo révolutionne l&apos;expérience immobilière en combinant expertise locale et technologie moderne. Nous mettons à votre disposition une plateforme intuitive pour trouver, vendre ou louer votre bien en toute confiance.
        </p>
      </motion.section>

      {/* Qui sommes-nous */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-6"
      >
        <div>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            Qui sommes-nous ?
          </h2>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80 sm:p-8">
          <p className="leading-relaxed">
            Fondée avec la vision de démocratiser l&apos;accès à l&apos;immobilier au Sénégal, Dousell Immo est née d&apos;un constat simple : trouver un bien de qualité, que ce soit à Dakar, Saly ou en région, ne devrait pas être un parcours du combattant.
          </p>
          <p className="mt-4 leading-relaxed">
            Notre équipe, composée d&apos;experts locaux et de passionnés de technologie, a développé une plateforme qui allie la chaleur de l&apos;accompagnement humain aux avantages du digital. Chaque bien est vérifié, chaque transaction est sécurisée, et chaque client est accompagné de A à Z.
          </p>
          <p className="mt-4 leading-relaxed">
            Que vous cherchiez une villa aux Almadies, un appartement à Mermoz, un terrain à Diamniadio ou une location à Saly, nous sommes là pour vous guider vers la meilleure décision.
          </p>
        </div>
      </motion.section>

      {/* Nos Valeurs */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="space-y-6"
      >
        <div>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            Nos Valeurs
          </h2>
          <p className="mt-2 text-white/60">
            Les principes qui guident chaque décision et chaque interaction
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {valeurs.map((valeur, index) => {
            const Icon = valeur.icon;
            return (
              <motion.div
                key={valeur.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
                  <Icon className="h-6 w-6 text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold">{valeur.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {valeur.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* L'équipe */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="space-y-6"
      >
        <div>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            L&apos;équipe
          </h2>
          <p className="mt-2 text-white/60">
            Des experts passionnés à votre service
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-amber-500/30">
              <Image
                src="/agent1.png"
                alt="Mohamadou Barry"
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-semibold text-white">
                Mohamadou Barry
              </h3>
              <p className="mt-1 text-amber-400">Fondateur & Expert Immobilier</p>
              <p className="mt-4 text-sm leading-relaxed text-white/70">
                Avec plus de 10 ans d&apos;expérience dans l&apos;immobilier dakarois, Mohamadou a créé Dousell Immo pour rendre l&apos;accès à la propriété plus accessible et transparent. Spécialisé dans les quartiers premium (Almadies, Plateau, Mermoz) et les zones en développement (Diamniadio, Saly), il accompagne chaque client avec expertise et bienveillance.
              </p>
              <div className="mt-4 flex items-center justify-center gap-4 sm:justify-start">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full"
                  asChild
                >
                  <a
                    href="https://wa.me/330751081579"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contacter
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="rounded-[36px] border border-white/10 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-8 text-center text-white sm:p-12"
      >
        <h2 className="text-3xl font-semibold sm:text-4xl">
          Prêt à concrétiser votre projet ?
        </h2>
        <p className="mt-4 text-lg text-white/70">
          Planifiez une visite ou contactez-nous pour discuter de vos besoins immobiliers
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            className="h-[50px] rounded-full bg-white px-8 text-black hover:bg-white/90"
            asChild
          >
            <Link href="/planifier-visite">
              Planifier une visite
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-[50px] rounded-full border border-white/20 bg-white/5 px-8 text-white hover:bg-white/10"
            asChild
          >
            <Link href="/recherche">
              Découvrir les biens
            </Link>
          </Button>
        </div>
      </motion.section>
    </div>
  );
}

