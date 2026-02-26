"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Building,
  MapPin,
  Shield,
  Percent,
  Clock,
  CheckCircle,
  ArrowRight,
  Calculator,
  Users,
  FileText,
  Star,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const projets = [
  {
    id: 1,
    title: "Résidence Teranga",
    location: "Diamniadio",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
    rendement: "12%",
    prix: "À partir de 25M FCFA",
    status: "En cours",
    completion: "T4 2026",
    features: ["10 appartements T3", "Piscine commune", "Parking sécurisé"],
  },
  {
    id: 2,
    title: "Villa Saly Premium",
    location: "Saly Portudal",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    rendement: "15%",
    prix: "À partir de 45M FCFA",
    status: "Nouveau",
    completion: "T2 2027",
    features: ["Villas individuelles", "Vue mer", "Gestion locative incluse"],
  },
  {
    id: 3,
    title: "Almadies Business Center",
    location: "Dakar - Almadies",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    rendement: "10%",
    prix: "À partir de 80M FCFA",
    status: "Dernières unités",
    completion: "T1 2026",
    features: ["Bureaux premium", "Fibre optique", "Services conciergerie"],
  },
];

const avantages = [
  {
    icon: TrendingUp,
    title: "Rendements attractifs",
    description: "8% à 15% de rentabilité locative annuelle selon les projets.",
  },
  {
    icon: Shield,
    title: "Investissement sécurisé",
    description: "Titres fonciers vérifiés, contrats notariés et garanties légales.",
  },
  {
    icon: Building,
    title: "Projets clés en main",
    description: "De la construction à la mise en location, nous gérons tout.",
  },
  {
    icon: Users,
    title: "Accompagnement expert",
    description: "Conseil fiscal, financement et gestion locative personnalisés.",
  },
];

const etapes = [
  {
    step: "01",
    title: "Découverte",
    description: "Échangez avec nos conseillers pour définir vos objectifs d'investissement.",
  },
  {
    step: "02",
    title: "Sélection",
    description: "Choisissez parmi nos projets vérifiés selon votre budget et vos attentes.",
  },
  {
    step: "03",
    title: "Acquisition",
    description: "Signature sécurisée chez le notaire avec accompagnement juridique.",
  },
  {
    step: "04",
    title: "Rentabilité",
    description: "Percevez vos loyers ou plus-values avec notre gestion locative.",
  },
];

export default function InvestissementPage() {
  return (
    <div className="space-y-16 py-10">
      {/* Hero Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-card via-background to-background p-8 text-white shadow-2xl sm:p-12 lg:p-16"
      >
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=80"
            alt="Investissement immobilier"
            fill
            className="object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#F4C430]/10 px-4 py-1.5 text-sm font-medium text-[#F4C430]">
            <TrendingUp className="h-4 w-4" />
            Investissement Immobilier
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Investissez dans l&apos;immobilier{" "}
            <span className="bg-gradient-to-r from-[#F4C430] to-[#FFD700] bg-clip-text text-transparent">
              sénégalais
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/70">
            Accédez à des projets immobiliers à forte rentabilité, sélectionnés et vérifiés par nos experts.
            Investissement sécurisé, rendements attractifs.
          </p>

          {/* Stats inline */}
          <div className="mt-8 flex flex-wrap gap-8">
            <div>
              <div className="text-3xl font-bold text-[#F4C430]">8-15%</div>
              <div className="text-sm text-white/60">Rendement annuel</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#F4C430]">100+</div>
              <div className="text-sm text-white/60">Investisseurs satisfaits</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#F4C430]">25M+</div>
              <div className="text-sm text-white/60">FCFA investis</div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="#projets"
              className="inline-flex items-center gap-2 rounded-full bg-[#F4C430] px-6 py-3 font-semibold text-black transition-all hover:bg-[#E5B82A] hover:scale-105"
            >
              Voir les projets
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="mailto:investissement@dousell.immo?subject=Demande d'information investissement"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10"
            >
              Parler à un conseiller
            </a>
          </div>
        </div>
      </motion.section>

      {/* Avantages */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {avantages.map((avantage, index) => (
          <motion.div
            key={avantage.title}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="rounded-2xl border border-white/10 bg-card p-6 text-center transition-all hover:border-[#F4C430]/30"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4C430]/10">
              <avantage.icon className="h-6 w-6 text-[#F4C430]" />
            </div>
            <h3 className="mb-2 font-semibold text-white">{avantage.title}</h3>
            <p className="text-sm text-white/60">{avantage.description}</p>
          </motion.div>
        ))}
      </motion.section>

      {/* Projets */}
      <motion.section
        id="projets"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="space-y-10"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Nos projets d&apos;investissement
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/60">
            Des opportunités immobilières sélectionnées pour leur potentiel de rentabilité et leur sécurité juridique.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {projets.map((projet, index) => (
            <motion.div
              key={projet.id}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-card transition-all hover:border-[#F4C430]/30 hover:shadow-lg hover:shadow-[#F4C430]/5"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={projet.image}
                  alt={projet.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Status badge */}
                <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${
                  projet.status === "Nouveau"
                    ? "bg-emerald-500 text-white"
                    : projet.status === "Dernières unités"
                    ? "bg-amber-500 text-black"
                    : "bg-white/20 text-white backdrop-blur-sm"
                }`}>
                  {projet.status}
                </span>

                {/* Rendement */}
                <div className="absolute bottom-4 right-4 rounded-xl bg-[#F4C430] px-3 py-1.5 text-center">
                  <div className="text-lg font-bold text-black">{projet.rendement}</div>
                  <div className="text-[10px] text-black/70">Rendement</div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="mb-2 flex items-center gap-2 text-xs text-white/50">
                  <MapPin className="h-3 w-3" />
                  {projet.location}
                  <span className="mx-2">•</span>
                  <Clock className="h-3 w-3" />
                  Livraison {projet.completion}
                </div>

                <h3 className="mb-1 text-lg font-semibold text-white group-hover:text-[#F4C430] transition-colors">
                  {projet.title}
                </h3>

                <p className="mb-4 text-sm font-medium text-[#F4C430]">{projet.prix}</p>

                <ul className="mb-4 space-y-1">
                  {projet.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-white/60">
                      <CheckCircle className="h-3 w-3 text-[#F4C430]" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  href={`mailto:investissement@dousell.immo?subject=Intéressé par ${projet.title}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-sm font-medium text-white transition-all hover:bg-[#F4C430] hover:text-black"
                >
                  En savoir plus
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Process */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="rounded-[36px] border border-white/10 bg-gradient-to-br from-card via-background to-card p-8 sm:p-12"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Comment investir avec Dousel ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/60">
            Un processus simple et transparent, de la découverte à la rentabilité.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {etapes.map((etape, index) => (
            <motion.div
              key={etape.step}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative"
            >
              {/* Connector line */}
              {index < etapes.length - 1 && (
                <div className="absolute left-1/2 top-8 hidden h-0.5 w-full bg-gradient-to-r from-[#F4C430]/50 to-transparent lg:block" />
              )}

              <div className="relative text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F4C430]/10 text-2xl font-bold text-[#F4C430]">
                  {etape.step}
                </div>
                <h3 className="mb-2 font-semibold text-white">{etape.title}</h3>
                <p className="text-sm text-white/60">{etape.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="rounded-[36px] border border-[#F4C430]/20 bg-gradient-to-r from-[#F4C430]/10 via-card to-card p-8 text-center sm:p-12"
      >
        <Calculator className="mx-auto h-12 w-12 text-[#F4C430]" />
        <h2 className="mt-6 text-3xl font-bold text-white sm:text-4xl">
          Simulez votre investissement
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/60">
          Échangez avec nos conseillers pour calculer votre rentabilité et trouver le projet adapté à votre budget.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a
            href="mailto:investissement@dousell.immo?subject=Simulation d'investissement"
            className="inline-flex items-center gap-2 rounded-full bg-[#F4C430] px-8 py-4 font-semibold text-black transition-all hover:bg-[#E5B82A] hover:scale-105"
          >
            Demander une simulation gratuite
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="tel:+221338600000"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 font-semibold text-white transition-all hover:bg-white/10"
          >
            +221 33 860 00 00
          </a>
        </div>
        <p className="mt-6 text-sm text-white/40">
          Conseil gratuit • Sans engagement • Expertise locale
        </p>
      </motion.section>
    </div>
  );
}
