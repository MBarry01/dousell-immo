"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  FileText,
  Calculator,
  Video,
  Bell,
  Shield,
  CheckCircle,
  ArrowRight,
  Calendar,
  PieChart,
  MessageSquare,
  Wrench,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const features = [
  {
    icon: Users,
    title: "Gestion des copropriétaires",
    description: "Annuaire complet, suivi des quotes-parts et historique des échanges avec chaque copropriétaire.",
  },
  {
    icon: Calculator,
    title: "Comptabilité transparente",
    description: "Budget prévisionnel, appels de fonds automatiques et suivi des charges en temps réel.",
  },
  {
    icon: Video,
    title: "AG en ligne",
    description: "Organisez vos assemblées générales en visio avec vote électronique sécurisé.",
  },
  {
    icon: FileText,
    title: "Documents centralisés",
    description: "PV d'AG, règlement de copropriété, contrats... Tout accessible en un clic.",
  },
  {
    icon: Bell,
    title: "Notifications intelligentes",
    description: "Rappels automatiques pour les impayés, échéances et convocations.",
  },
  {
    icon: Wrench,
    title: "Gestion des travaux",
    description: "Suivi des interventions, devis comparatifs et planning des maintenances.",
  },
];

const benefits = [
  "Réduction des impayés de 40%",
  "Gain de temps sur l'administratif",
  "Meilleure communication copropriétaires",
  "Conformité juridique garantie",
  "Accès 24/7 aux documents",
  "Support dédié en français",
];

const stats = [
  { value: "50+", label: "Copropriétés gérées" },
  { value: "2000+", label: "Copropriétaires" },
  { value: "98%", label: "Satisfaction" },
  { value: "24h", label: "Délai de réponse" },
];

export default function SyndicPage() {
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
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80"
            alt="Immeuble moderne"
            fill
            className="object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        </div>

        <div className="relative z-10 grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#F4C430]/10 px-4 py-1.5 text-sm font-medium text-[#F4C430]">
              <Building2 className="h-4 w-4" />
              Syndic de Copropriété
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Gérez votre copropriété en toute{" "}
              <span className="bg-gradient-to-r from-[#F4C430] to-[#FFD700] bg-clip-text text-transparent">
                sérénité
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/70">
              Une plateforme moderne pour les syndics professionnels et bénévoles.
              Comptabilité, AG en ligne, gestion des travaux... Tout est simplifié.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="#contact"
                className="inline-flex items-center gap-2 rounded-full bg-[#F4C430] px-6 py-3 font-semibold text-black transition-all hover:bg-[#E5B82A] hover:scale-105"
              >
                Demander une démo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10"
              >
                Découvrir les fonctionnalités
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm"
              >
                <div className="text-3xl font-bold text-[#F4C430]">{stat.value}</div>
                <div className="mt-1 text-sm text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        id="features"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="space-y-10"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Tout ce dont votre copropriété a besoin
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/60">
            Des outils puissants et intuitifs pour une gestion simplifiée au quotidien.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group rounded-2xl border border-white/10 bg-card p-6 transition-all hover:border-[#F4C430]/30 hover:shadow-lg hover:shadow-[#F4C430]/5"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4C430]/10 transition-colors group-hover:bg-[#F4C430]/20">
                <feature.icon className="h-6 w-6 text-[#F4C430]" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white group-hover:text-[#F4C430] transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-white/60">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Benefits Section */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="rounded-[36px] border border-white/10 bg-gradient-to-br from-[#F4C430]/5 via-card to-card p-8 sm:p-12"
      >
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Pourquoi choisir Dousell Syndic ?
            </h2>
            <p className="mt-4 text-white/60">
              Une solution pensée pour les réalités du marché sénégalais, avec un accompagnement personnalisé.
            </p>
            <ul className="mt-8 space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F4C430]/20">
                    <CheckCircle className="h-4 w-4 text-[#F4C430]" />
                  </div>
                  <span className="text-white/80">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="absolute inset-0 bg-[#F4C430]/10 blur-3xl rounded-full" />
            <div className="relative rounded-2xl border border-white/10 bg-card p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="font-semibold text-white">Tableau de bord Syndic</h4>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-400">En ligne</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <PieChart className="h-5 w-5 text-[#F4C430]" />
                    <span className="text-sm text-white/80">Budget 2026</span>
                  </div>
                  <span className="text-sm font-semibold text-[#F4C430]">85% collecté</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-[#F4C430]" />
                    <span className="text-sm text-white/80">Prochaine AG</span>
                  </div>
                  <span className="text-sm text-white/60">15 Fév 2026</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-[#F4C430]" />
                    <span className="text-sm text-white/80">Messages</span>
                  </div>
                  <span className="rounded-full bg-[#F4C430] px-2 py-0.5 text-xs font-semibold text-black">3 nouveaux</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        id="contact"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="rounded-[36px] border border-[#F4C430]/20 bg-gradient-to-r from-[#F4C430]/10 via-card to-card p-8 text-center sm:p-12"
      >
        <Shield className="mx-auto h-12 w-12 text-[#F4C430]" />
        <h2 className="mt-6 text-3xl font-bold text-white sm:text-4xl">
          Prêt à moderniser votre copropriété ?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/60">
          Demandez une démonstration gratuite et découvrez comment Dousell peut transformer la gestion de votre immeuble.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a
            href="mailto:syndic@dousell.immo?subject=Demande de démo Syndic"
            className="inline-flex items-center gap-2 rounded-full bg-[#F4C430] px-8 py-4 font-semibold text-black transition-all hover:bg-[#E5B82A] hover:scale-105"
          >
            Demander une démo gratuite
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="tel:+221338600000"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 font-semibold text-white transition-all hover:bg-white/10"
          >
            Nous appeler
          </a>
        </div>
        <p className="mt-6 text-sm text-white/40">
          Essai gratuit 30 jours • Sans engagement • Support inclus
        </p>
      </motion.section>
    </div>
  );
}
