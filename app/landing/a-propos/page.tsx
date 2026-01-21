"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Shield, Sparkles, MapPin, ArrowRight, MessageCircle } from "lucide-react";
import DousellNavbar from "@/components/landing/DousellNavbar";
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
        <main className="bg-black min-h-screen">
            <DousellNavbar />

            <div className="container mx-auto px-6 pt-32 pb-20">
                {/* Hero Section */}
                <motion.section
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    transition={{ duration: 0.6 }}
                    className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-8 text-white shadow-2xl sm:p-12 mb-20"
                >
                    {/* Image de fond pour desktop */}
                    <div className="absolute inset-0 hidden md:block">
                        <Image
                            src="https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&w=1920"
                            alt="Skyline de Dakar"
                            fill
                            className="object-cover opacity-10"
                            priority
                        />
                    </div>

                    {/* Contenu */}
                    <div className="relative z-10">
                        <p className="text-xs uppercase tracking-[0.3em] text-[#F4C430]">
                            Notre mission
                        </p>
                        <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl font-display">
                            Rendre l&apos;immobilier transparent au Sénégal
                        </h1>
                        <p className="mt-6 text-lg text-white/70 sm:text-xl font-light">
                            Dousell Immo révolutionne l&apos;expérience immobilière en combinant expertise locale et technologie moderne. Nous mettons à votre disposition une plateforme intuitive pour trouver, vendre ou louer votre bien en toute confiance.
                        </p>
                    </div>
                </motion.section>

                {/* Qui sommes-nous */}
                <motion.section
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="space-y-6 mb-20"
                >
                    <div>
                        <h2 className="text-2xl font-bold text-white sm:text-3xl font-display">
                            Qui sommes-nous ?
                        </h2>
                    </div>

                    {/* Grille avec image et texte */}
                    <div className="grid gap-8 md:grid-cols-2">
                        {/* Texte */}
                        <div className="order-2 rounded-2xl border border-white/10 bg-zinc-900/50 p-6 text-white/80 sm:p-8 md:order-1 backdrop-blur-sm">
                            <p className="leading-relaxed mb-4">
                                Fondée avec la vision de démocratiser l&apos;accès à l&apos;immobilier au Sénégal, Dousell Immo est née d&apos;un constat simple : trouver un bien de qualité, que ce soit à Dakar, Saly ou en région, ne devrait pas être un parcours du combattant.
                            </p>
                            <p className="mb-4 leading-relaxed">
                                Notre équipe, composée d&apos;experts locaux et de passionnés de technologie, a développé une plateforme qui allie la chaleur de l&apos;accompagnement humain aux avantages du digital. Chaque bien est vérifié, chaque transaction est sécurisée, et chaque client est accompagné de A à Z.
                            </p>
                            <p className="leading-relaxed">
                                Que vous cherchiez une villa aux Almadies, un appartement à Mermoz, un terrain à Diamniadio ou une location à Saly, nous sommes là pour vous guider vers la meilleure décision.
                            </p>
                        </div>

                        {/* Image */}
                        <div className="order-1 relative h-[300px] overflow-hidden rounded-2xl border border-white/10 md:order-2 md:h-auto">
                            <Image
                                src="https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=800"
                                alt="Professionnels africains travaillant ensemble"
                                fill
                                className="object-cover transition-transform duration-700 hover:scale-105"
                            />
                        </div>
                    </div>
                </motion.section>

                {/* Nos Valeurs */}
                <motion.section
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="relative overflow-hidden rounded-[36px] border border-white/10 p-8 sm:p-12 mb-20"
                >
                    {/* Image de fond avec overlay */}
                    <div className="absolute inset-0">
                        <Image
                            src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1920"
                            alt="Architecture moderne"
                            fill
                            className="object-cover opacity-5"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/80 via-black/90 to-black" />
                    </div>

                    {/* Contenu */}
                    <div className="relative z-10 space-y-8">
                        <div className="text-center md:text-left">
                            <h2 className="text-2xl font-bold text-white sm:text-3xl font-display">
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
                                        className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:-translate-y-1"
                                    >
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F4C430]/10">
                                                <Icon className="h-6 w-6 text-[#F4C430]" />
                                            </div>
                                            <h3 className="text-xl font-bold">{valeur.title}</h3>
                                        </div>
                                        <p className="text-sm leading-relaxed text-white/70">
                                            {valeur.description}
                                        </p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </motion.section>

                {/* L'équipe */}
                <motion.section
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="space-y-6 mb-20"
                >
                    <div>
                        <h2 className="text-2xl font-bold text-white sm:text-3xl font-display">
                            L&apos;équipe
                        </h2>
                        <p className="mt-2 text-white/60">
                            Des experts passionnés à votre service
                        </p>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                        {/* Mohamadou Barry - Fondateur */}
                        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8 hover:border-[#F4C430]/30 transition-all">
                            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-[#F4C430]/30">
                                    <Image
                                        src="/agent1.png"
                                        alt="Mohamadou Barry"
                                        width={96}
                                        height={96}
                                        className="h-full w-full object-cover object-[center_top]"
                                    />
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <h3 className="text-xl font-bold text-white">
                                        Mohamadou Barry
                                    </h3>
                                    <p className="mt-1 text-[#F4C430] text-sm font-medium uppercase tracking-wide">Co-fondateur - Technicien</p>
                                    <p className="mt-4 text-sm leading-relaxed text-white/70">
                                        Spécialisé dans l&apos;aspect technique et technologique de l&apos;immobilier, Mohamadou a créé Dousell Immo pour rendre l&apos;accès à la propriété plus accessible grâce aux solutions digitales innovantes. Expert en plateformes et outils technologiques pour faciliter vos transactions immobilières.
                                    </p>
                                    <div className="mt-6 flex items-center justify-center gap-4 sm:justify-start">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-full border-[#F4C430]/30 hover:bg-[#F4C430]/10 text-[#F4C430] hover:text-[#F4C430]"
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

                        {/* Amadou Barry - Cofondateur */}
                        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8 hover:border-[#F4C430]/30 transition-all">
                            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-[#F4C430]/30">
                                    <Image
                                        src="/agent2.png"
                                        alt="Amadou Barry"
                                        width={96}
                                        height={96}
                                        className="h-full w-full object-cover object-[center_top]"
                                    />
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <h3 className="text-xl font-bold text-white">
                                        Amadou Barry
                                    </h3>
                                    <p className="mt-1 text-[#F4C430] text-sm font-medium uppercase tracking-wide">Co-Fondateur - Expert Immobilier</p>
                                    <p className="mt-4 text-sm leading-relaxed text-white/70">
                                        Expert terrain et cofondateur de Dousell Immo, Amadou apporte sa connaissance approfondie du marché immobilier dakarois. Spécialisé dans les visites, l&apos;accompagnement sur le terrain et la relation client, il est votre contact privilégié pour toutes vos démarches immobilières concrètes.
                                    </p>
                                    <div className="mt-6 flex items-center justify-center gap-4 sm:justify-start">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-full border-[#F4C430]/30 hover:bg-[#F4C430]/10 text-[#F4C430] hover:text-[#F4C430]"
                                            asChild
                                        >
                                            <a
                                                href="https://wa.me/221781385281"
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
                    </div>
                </motion.section>

                {/* CTA */}
                <motion.section
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="relative overflow-hidden rounded-[36px] border border-white/10 p-8 text-center text-white sm:p-12"
                >
                    {/* Image de fond avec overlay doré */}
                    <div className="absolute inset-0">
                        <Image
                            src="https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg?auto=compress&cs=tinysrgb&w=1920"
                            alt="Villa de luxe"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/80 via-black/80 to-black/90" />
                    </div>

                    {/* Contenu */}
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold sm:text-4xl font-display">
                            Prêt à concrétiser votre projet ?
                        </h2>
                        <p className="mt-4 text-lg text-white/90 font-light">
                            Planifiez une visite ou contactez-nous pour discuter de vos besoins immobiliers
                        </p>
                        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Button
                                size="lg"
                                className="h-[50px] rounded-full bg-[#F4C430] px-8 text-black hover:bg-[#E5B82A] font-bold"
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
                                className="h-[50px] rounded-full border-2 border-white/30 bg-white/10 px-8 text-white backdrop-blur-sm hover:bg-white/20"
                                asChild
                            >
                                <Link href="/recherche">
                                    Découvrir les biens
                                </Link>
                            </Button>
                        </div>
                    </div>
                </motion.section>
            </div>
        </main>
    );
}
