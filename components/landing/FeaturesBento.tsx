"use client";

import React from "react";
import Image from "next/image";
import { Wallet, FileText, ShieldCheck, Mail, LayoutDashboard, CheckCircle2, type LucideIcon } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { CldImageSafe } from "@/components/ui/CldImageSafe";

// Feature data
const features = [
    {
        id: 1,
        image: "doussel/static/banners/dash-mock",
        title: "Votre Patrimoine dans votre Poche",
        paragraphs: [
            "Fini les cahiers de notes raturés et les fichiers Excel perdus. Gérez vos biens immobiliers comme un véritable professionnel depuis votre téléphone, que vous soyez à Dakar, Paris ou New York.",
            "Visualisez instantanément qui a payé, qui est en retard, et combien votre patrimoine vous rapporte réellement chaque mois. Plus de devinettes, place à la clarté financière.",
            "Baux, quittances, factures, photos... Tout est centralisé, sécurisé et accessible à vie en un clic. Votre bureau tient désormais dans votre poche."
        ],
        icon: LayoutDashboard,
        iconColor: "text-[#F4C430]",
        iconBg: "bg-[#F4C430]/10",
    },
    {
        id: 2,
        image: "doussel/static/features/paiement",
        title: "Encaissez sans courir après personne",
        paragraphs: [
            "Ne perdez plus votre énergie à relancer les retardataires. Dousell envoie automatiquement les rappels de paiement par SMS et email avant et après l'échéance.",
            "Vos locataires règlent leur loyer via leur méthode préférée (Wave, Orange Money, Carte Bancaire) directement depuis leur espace. L'argent est tracé, sécurisé.",
            "Dès validation du paiement, la quittance est générée et envoyée instantanément au locataire. Plus besoin de rédiger, d'imprimer ou de se déplacer pour remettre un papier."
        ],
        icon: Wallet,
        iconColor: "text-[#F4C430]",
        iconBg: "bg-[#F4C430]/10",
    },
    {
        id: 3,
        image: "doussel/static/features/document",
        title: "Des Contrats en Béton, Signés en 2 minutes",
        paragraphs: [
            "Utilisez des modèles de baux 100% conformes à la législation sénégalaise. Protégez-vous avec des contrats solides, relus par des experts juridiques.",
            "Idéal pour la diaspora : signez et faites signer vos locataires électroniquement depuis n'importe où dans le monde. Plus besoin d'envoyer un cousin avec le stylo.",
            "Fini les baux égarés ou abîmés par l'humidité. Retrouvez n'importe quel contrat en 3 clics dans votre coffre-fort numérique, même 5 ans après le départ du locataire."
        ],
        icon: FileText,
        iconColor: "text-[#F4C430]",
        iconBg: "bg-[#F4C430]/10",
    },
    {
        id: 4,
        image: "doussel/static/features/etat-lieux",
        title: "L'État des Lieux Incontestable",
        paragraphs: [
            "Prenez des photos datées et géolocalisées directement via l'application. Figez l'état réel du bien à l'entrée pour éviter tout litige à la sortie.",
            "Ne ratez aucun détail : notre outil vous guide pièce par pièce (prises, peinture, robinetterie) pour un constat exhaustif et professionnel.",
            "Le jour du départ, la comparaison est automatique. Le calcul des retenues sur caution devient factuel, transparent et apaisé pour tout le monde."
        ],
        icon: ShieldCheck,
        iconColor: "text-[#F4C430]",
        iconBg: "bg-[#F4C430]/10",
    },
    {
        id: 5,
        image: "doussel/static/features/alerte",
        title: "Votre Assistant Personnel 24/7",
        paragraphs: [
            "Laissez Dousell gérer votre agenda mental. Fin de bail, révision de loyer annuelle, régularisation de charges... l'application pense à tout pour vous.",
            "Dormez sur vos deux oreilles. Vous ne raterez plus jamais une date importante ou une échéance légale qui pourrait vous coûter cher.",
            "Montrez à vos locataires que vous gérez votre bien avec sérieux. Une communication fluide, moderne et proactive renforce la confiance et fidélise les bons payeurs."
        ],
        icon: Mail,
        iconColor: "text-[#F4C430]",
        iconBg: "bg-[#F4C430]/10",
    },
];

type FeatureRowProps = {
    image: string;
    title: string;
    paragraphs: string[];
    icon: LucideIcon;
    iconColor: string;
    iconBg: string;
    isReversed?: boolean;
};

// Animation Variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
            duration: 0.5
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 50,
            damping: 20
        }
    }
};

const imageVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, filter: "blur(10px)" },
    visible: {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        transition: {
            duration: 0.8,
            ease: "easeOut"
        }
    }
};

function FeatureRow({ image, title, paragraphs, icon: Icon, iconColor, iconBg, isReversed }: FeatureRowProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 lg:gap-16 items-center`}
        >
            {/* Image Side */}
            <motion.div
                className="w-full lg:w-1/2 relative"
                variants={imageVariants}
            >
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-zinc-900 border border-white/10 shadow-2xl group">
                    <CldImageSafe
                        src={image}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        crop="fill"
                        gravity="auto"
                    />
                    {/* Subtle overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                {/* Decorative elements - Softer glow */}
                <div className={`absolute -z-10 w-72 h-72 rounded-full blur-[120px] opacity-20 ${isReversed ? '-right-24 -bottom-24 bg-[#F4C430]/50' : '-left-24 -bottom-24 bg-[#F4C430]/50'}`} />
            </motion.div>

            {/* Text Side */}
            <motion.div
                className="w-full lg:w-1/2 space-y-8"
                variants={itemVariants}
            >
                <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`w-14 h-14 flex-shrink-0 rounded-2xl ${iconBg} flex items-center justify-center ${iconColor} border border-[#F4C430]/20 shadow-[0_0_15px_rgba(244,196,48,0.1)]`}>
                        <Icon size={28} />
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
                        {title}
                    </h3>
                </div>

                {/* Paragraphs as Bullet Points */}
                <ul className="space-y-5">
                    {paragraphs.map((para, idx) => (
                        <li key={idx} className="flex gap-4 group">
                            <div className="flex-shrink-0 mt-1">
                                <div className="w-6 h-6 rounded-full bg-[#F4C430]/10 flex items-center justify-center group-hover:bg-[#F4C430]/20 transition-colors">
                                    <CheckCircle2 className="w-4 h-4 text-[#F4C430]" />
                                </div>
                            </div>
                            <p className="text-gray-400 text-base md:text-lg leading-relaxed group-hover:text-gray-300 transition-colors">
                                {para}
                            </p>
                        </li>
                    ))}
                </ul>
            </motion.div>
        </motion.div >
    );
}

export default function FeaturesBento() {
    return (
        <section className="py-20 md:py-28 bg-black relative overflow-hidden" id="features">
            {/* Background Gradients */}
            <div className="absolute top-0 center w-full h-full bg-[radial-gradient(circle_at_center,_rgba(244,196,48,0.05)_0%,_transparent_70%)] pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16 md:mb-24 space-y-4"
                >
                    <span className="inline-block text-[#F4C430] text-sm font-medium tracking-widest uppercase mb-4">
                        Fonctionnalités
                    </span>
                    <h2 className="font-display text-[clamp(1.875rem,4vw,3rem)] text-white max-w-2xl mx-auto">
                        Tout ce dont vous avez besoin pour <span className="gradient-text-animated">piloter</span> votre immobilier
                    </h2>
                    <p className="text-gray-400 max-w-xl mx-auto text-sm md:text-base">
                        Une suite complète d'outils pour automatiser, sécuriser et rentabiliser vos biens, accessible 24/7.
                    </p>
                </motion.div>

                {/* Features List - Zigzag Layout */}
                <div className="space-y-24 md:space-y-40">
                    {features.map((feature, index) => (
                        <FeatureRow
                            key={feature.id}
                            {...feature}
                            isReversed={index % 2 === 1}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
