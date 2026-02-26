"use client";

import _Link from "next/link";
import { motion } from "framer-motion";
import {
    Briefcase,
    MapPin,
    Clock,
    Users,
    Rocket,
    Heart,
    Coffee,
    ArrowRight,
    Building2,
    Code,
    Megaphone,
    HeadphonesIcon
} from "lucide-react";

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
};

const avantages = [
    {
        icon: Rocket,
        title: "Croissance rapide",
        description: "Rejoignez une startup en pleine expansion avec de vraies opportunités d'évolution.",
    },
    {
        icon: Users,
        title: "Équipe soudée",
        description: "Une ambiance de travail conviviale où chaque voix compte.",
    },
    {
        icon: Heart,
        title: "Impact réel",
        description: "Contribuez à transformer le marché immobilier sénégalais.",
    },
    {
        icon: Coffee,
        title: "Flexibilité",
        description: "Télétravail partiel, horaires flexibles et équilibre vie pro/perso.",
    },
];

const offres = [
    {
        id: 1,
        title: "Développeur Full-Stack",
        department: "Tech",
        icon: Code,
        location: "Dakar / Remote",
        type: "CDI",
        description: "Rejoignez notre équipe tech pour développer les fonctionnalités de notre plateforme Next.js / Supabase.",
        skills: ["Next.js", "TypeScript", "Supabase", "Tailwind CSS"],
    },
    {
        id: 2,
        title: "Agent Immobilier Senior",
        department: "Commercial",
        icon: Building2,
        location: "Dakar",
        type: "CDI",
        description: "Développez notre portefeuille de biens et accompagnez nos clients dans leurs projets immobiliers.",
        skills: ["Négociation", "Prospection", "Relation client", "Marché local"],
    },
    {
        id: 3,
        title: "Responsable Marketing Digital",
        department: "Marketing",
        icon: Megaphone,
        location: "Dakar",
        type: "CDI",
        description: "Pilotez notre stratégie d'acquisition et de notoriété sur les canaux digitaux.",
        skills: ["SEO/SEA", "Social Media", "Analytics", "Content Marketing"],
    },
    {
        id: 4,
        title: "Chargé(e) de Support Client",
        department: "Support",
        icon: HeadphonesIcon,
        location: "Dakar",
        type: "CDI / Stage",
        description: "Accompagnez nos utilisateurs et assurez une expérience client exceptionnelle.",
        skills: ["Communication", "Empathie", "Résolution de problèmes", "Wolof/Français"],
    },
];

export default function CarrieresPage() {
    return (
        <main className="bg-black min-h-screen">

            <div className="container mx-auto px-6 pt-32 pb-20">
                {/* Hero Section */}
                <motion.section
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    transition={{ duration: 0.6 }}
                    className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-8 text-white shadow-2xl sm:p-12 mb-20"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(244,196,48,0.15)_0%,_transparent_50%)]" />

                    <div className="relative z-10">
                        <p className="text-xs uppercase tracking-[0.3em] text-[#F4C430]">
                            Rejoignez-nous
                        </p>
                        <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl font-display">
                            Construisons ensemble l&apos;immobilier de demain
                        </h1>
                        <p className="mt-6 max-w-2xl text-lg text-white/70 sm:text-xl font-light">
                            Dousel recrute des talents passionnés pour révolutionner le marché immobilier sénégalais. Rejoignez une équipe ambitieuse et innovante.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4">
                            <a
                                href="#offres"
                                className="inline-flex items-center gap-2 rounded-full bg-[#F4C430] px-6 py-3 font-semibold text-black transition-all hover:bg-[#E5B82A] shadow-lg shadow-[#F4C430]/20"
                            >
                                Voir les offres
                                <ArrowRight className="h-4 w-4" />
                            </a>
                            <a
                                href="mailto:recrutement@dousell.immo"
                                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10"
                            >
                                Candidature spontanée
                            </a>
                        </div>
                    </div>
                </motion.section>

                {/* Pourquoi nous rejoindre */}
                <motion.section
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="space-y-12 mb-20"
                >
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white sm:text-3xl font-display">
                            Pourquoi rejoindre Dousel ?
                        </h2>
                        <p className="mx-auto mt-3 max-w-xl text-white/60">
                            Plus qu&apos;un emploi, une aventure entrepreneuriale au cœur de l&apos;innovation immobilière.
                        </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {avantages.map((avantage, index) => (
                            <motion.div
                                key={avantage.title}
                                variants={fadeUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center transition-all hover:border-[#F4C430]/30 hover:bg-white/10 hover:-translate-y-1"
                            >
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4C430]/10">
                                    <avantage.icon className="h-6 w-6 text-[#F4C430]" />
                                </div>
                                <h3 className="mb-2 font-bold text-white">{avantage.title}</h3>
                                <p className="text-sm text-white/60 leading-relaxed">{avantage.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* Offres d'emploi */}
                <motion.section
                    id="offres"
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="space-y-12 mb-20"
                >
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white sm:text-3xl font-display">
                            Nos offres d&apos;emploi
                        </h2>
                        <p className="mx-auto mt-3 max-w-xl text-white/60">
                            Découvrez les postes ouverts et trouvez votre place dans notre équipe.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {offres.map((offre, index) => (
                            <motion.div
                                key={offre.id}
                                variants={fadeUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="group rounded-2xl border border-white/10 bg-zinc-900/50 p-6 transition-all hover:border-[#F4C430]/30 hover:shadow-lg hover:shadow-[#F4C430]/5 hover:-translate-y-0.5"
                            >
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F4C430]/10 group-hover:bg-[#F4C430]/20 transition-colors">
                                            <offre.icon className="h-6 w-6 text-[#F4C430]" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-[#F4C430] transition-colors">
                                                {offre.title}
                                            </h3>
                                            <p className="mt-1 text-sm text-white/60">{offre.description}</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {offre.skills.map((skill) => (
                                                    <span
                                                        key={skill}
                                                        className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70 border border-white/5"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-start gap-2 sm:items-end sm:text-right text-nowrap pl-4 sm:pl-0 border-l border-white/10 sm:border-l-0">
                                        <div className="flex items-center gap-4 text-sm text-white/50">
                                            <span className="flex items-center gap-1.5">
                                                <MapPin className="h-3.5 w-3.5" />
                                                {offre.location}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Briefcase className="h-3.5 w-3.5" />
                                                {offre.type}
                                            </span>
                                        </div>
                                        <a
                                            href={`mailto:recrutement@dousell.immo?subject=Candidature : ${offre.title}`}
                                            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#F4C430] px-5 py-2 text-sm font-bold text-black transition-all hover:bg-[#E5B82A] shadow-md shadow-[#F4C430]/10"
                                        >
                                            Postuler
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* CTA Candidature spontanée */}
                <motion.section
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="rounded-[36px] border border-white/10 bg-gradient-to-r from-[#F4C430]/10 via-zinc-900 to-zinc-900 p-8 text-center sm:p-12 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#F4C430]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold text-white sm:text-3xl font-display">
                            Vous ne trouvez pas votre poste ?
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-white/60">
                            Envoyez-nous votre candidature spontanée. Nous sommes toujours à la recherche de talents motivés !
                        </p>
                        <a
                            href="mailto:recrutement@dousell.immo?subject=Candidature spontanée"
                            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#F4C430] px-8 py-4 font-bold text-black transition-all hover:bg-[#E5B82A] shadow-lg shadow-[#F4C430]/20 hover:scale-105 active:scale-95"
                        >
                            Candidature spontanée
                            <ArrowRight className="h-4 w-4" />
                        </a>
                    </div>
                </motion.section>
            </div>
        </main>
    );
}
