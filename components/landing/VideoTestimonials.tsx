"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Play, Award, Building, Wallet, Shield } from "lucide-react";
import { CldImageSafe } from "@/components/ui/CldImageSafe";

interface Story {
    id: number;
    badge: string;
    badgeColor?: string;
    companyLogo?: string; // Optional logo URL or component
    quote: string;
    author: string;
    role: string;
    image: string; // Background image URL
    videoUrl?: string; // For the play button action
}

const ownerStories: Story[] = [
    {
        id: 1,
        badge: "GESTION AUTOMATISÉE",
        badgeColor: "bg-emerald-400/20 text-emerald-300",
        quote: "Dousell a complètement automatisé ma gestion. Je ne passe plus mes week-ends à gérer la paperasse.",
        author: "Amadou Sow",
        role: "Propriétaire Multi-biens",
        image: "doussel/static/images/Amadou Sow",
    },
    {
        id: 2,
        badge: "TRANQUILLITÉ",
        badgeColor: "bg-blue-400/20 text-blue-300",
        quote: "Les paiements sont sécurisés et arrivent à l'heure. C'est la tranquillité d'esprit que je cherchais.",
        author: "Fatou Ndiaye",
        role: "Investisseuse à Saly",
        image: "doussel/static/images/Fatou Ndiaye",
    },
    {
        id: 3,
        badge: "EXPERIENCE LOCATAIRE",
        badgeColor: "bg-purple-400/20 text-purple-300",
        quote: "Mes locataires adorent l'application. Ils paient par Wave en 2 clics et reçoivent leur quittance.",
        author: "Jean-Marc Diouf",
        role: "Gestionnaire Immobilier",
        image: "doussel/static/images/Jean Marc Diouf",
    },
    {
        id: 4,
        badge: "SUPPORT PREMIUM",
        badgeColor: "bg-[#F4C430]/20 text-[#F4C430]",
        quote: "Une équipe réactive et à l'écoute. Le support est vraiment au niveau de mes attentes.",
        author: "Aïcha Diallo",
        role: "Propriétaire à Dakar",
        image: "doussel/static/images/Aicha Diallo",
    },
    {
        id: 5,
        badge: "RENTABILITÉ",
        badgeColor: "bg-rose-400/20 text-rose-300",
        quote: "J'ai réduit mes impayés de 100% grâce au système de relance automatique.",
        author: "Moussa Konaté",
        role: "Bailleur Indépendant",
        image: "doussel/static/images/Moussa Konaté",
    },
];

const tenantStories: Story[] = [
    {
        id: 1,
        badge: "VISITES VIRTUELLES",
        badgeColor: "bg-indigo-400/20 text-indigo-300",
        quote: "J'ai visité mon appartement depuis Paris et signé le bail électroniquement. Incroyable !",
        author: "Sophie Diop",
        role: "Expatriée",
        image: "doussel/static/images/Sophie_diop",
    },
    {
        id: 2,
        badge: "TRANSPARENCE",
        badgeColor: "bg-teal-400/20 text-teal-300",
        quote: "Pas de frais cachés, un état des lieux numérique clair. Tout est carré.",
        author: "Cheikh Anta",
        role: "Locataire à Saly",
        image: "doussel/static/images/Cheikh Anta",
    },
    {
        id: 3,
        badge: "PAIEMENT SIMPLE",
        badgeColor: "bg-orange-400/20 text-orange-300",
        quote: "Payer mon loyer avec Wave est super pratique. Je reçois ma quittance instantanément.",
        author: "Aminata Faye",
        role: "Locataire au Plateau",
        image: "doussel/static/testimonials/Anta_Faye",
    },
    {
        id: 4,
        badge: "SUPPORT 24/7",
        badgeColor: "bg-[#F4C430]/20 text-[#F4C430]",
        quote: "J'ai eu un souci de plomberie, j'ai ouvert un ticket et c'était réglé le lendemain.",
        author: "Paul Mendy",
        role: "Locataire à Ouakam",
        image: "doussel/static/images/Paul Mendy",
    },
];

interface VideoTestimonialsProps {
    mode?: "owner" | "tenant";
}

export default function VideoTestimonials({ mode = "owner" }: VideoTestimonialsProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const stories = mode === "owner" ? ownerStories : tenantStories;

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const scrollAmount = 400; // Width of card + gap approximately
            scrollRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    return (
        <section className="py-24 bg-black relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(244,196,48,0.1)_0%,_transparent_60%)]" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col items-center text-center mb-12 gap-6">
                    <div>
                        <span className="inline-block text-[#F4C430] text-sm font-medium tracking-widest uppercase mb-4">
                            Témoignages
                        </span>
                        <h2 className="font-display text-[clamp(2rem,4.5vw,3rem)] text-white">
                            {mode === "owner" ? (
                                <>Ils ont <span className="gradient-text-animated">transformé</span><br />leur gestion</>
                            ) : (
                                <>Ils ont <span className="gradient-text-animated">trouvé</span><br />leur bonheur</>
                            )}
                        </h2>
                    </div>
                </div>
                {/* Carousel Container Wrapper */}
                <div className="relative group">
                    {/* Left Arrow */}
                    <button
                        onClick={() => scroll("left")}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full border border-white/10 bg-black/50 backdrop-blur-md hover:bg-[#F4C430] hover:text-black flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 shadow-xl"
                        aria-label="Scroll left"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    {/* Right Arrow */}
                    <button
                        onClick={() => scroll("right")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full border border-white/10 bg-black/50 backdrop-blur-md hover:bg-[#F4C430] hover:text-black flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 shadow-xl"
                        aria-label="Scroll right"
                    >
                        <ArrowRight size={20} />
                    </button>

                    <div
                        ref={scrollRef}
                        className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {stories.map((story) => (
                            <div
                                key={story.id}
                                className="flex-none w-[300px] md:w-[400px] aspect-[4/5] relative rounded-3xl overflow-hidden group/card snap-center cursor-pointer border border-white/10"
                            >
                                {/* Background Image */}
                                <CldImageSafe
                                    src={story.image}
                                    alt={story.author}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover/card:scale-110"
                                    sizes="(max-width: 768px) 300px, 400px"
                                    crop="fill"
                                    gravity="auto"
                                />

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                                {/* Content */}
                                <div className="absolute inset-0 p-8 flex flex-col justify-between">

                                    {/* Top Row */}
                                    <div className="flex justify-between items-start">
                                        <div className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-bold tracking-wider uppercase backdrop-blur-md ${story.badgeColor || 'bg-white/20 text-white'}`}>
                                            {story.badge}
                                        </div>
                                        {/* Logo Placeholder (or use actual logo) */}
                                        <div className="h-6 w-auto opacity-80 mix-blend-screen">
                                            {/* Replace with actual partner logo */}
                                            <span className="font-display font-bold text-white/50 tracking-widest text-xs">DOUSELL</span>
                                        </div>
                                    </div>

                                    {/* Bottom Content */}
                                    <div>
                                        <blockquote className="text-xl md:text-2xl font-medium text-white mb-6 leading-tight">
                                            &ldquo;{story.quote}&rdquo;
                                        </blockquote>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-bold text-white text-lg">{story.author}</div>
                                                <div className="text-sm text-gray-400">{story.role}</div>
                                            </div>


                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
