"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowRight, Sparkles, Wand2 } from "lucide-react";

export default function MagicSection() {
    const [isRevealed, setIsRevealed] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);

    // Intersection Observer pour détecter quand la section est visible
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isInView) {
                    setIsInView(true);
                    // Délai avant de lancer l'animation de révélation
                    setTimeout(() => setIsRevealed(true), 800);
                }
            },
            { threshold: 0.3 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, [isInView]);

    // Fonction pour relancer l'animation
    const replayAnimation = () => {
        setIsRevealed(false);
        setTimeout(() => setIsRevealed(true), 100);
    };

    return (
        <section ref={sectionRef} className="py-24 bg-zinc-950 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F4C430]/5 rounded-full blur-[120px]" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <span className="inline-block text-[#F4C430] text-sm font-medium tracking-widest uppercase mb-4">
                        De la donnée à la vitrine
                    </span>
                    <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-white mb-6">
                        Remplissez un formulaire,<br />
                        <span className="gradient-text-animated">obtenez une annonce premium</span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Vos données brutes se transforment automatiquement en vitrines qui font vendre.
                    </p>
                </div>

                <div className="relative grid md:grid-cols-[1fr,auto,1fr] gap-8 items-center max-w-6xl mx-auto">
                    {/* LEFT: SaaS Form (Boring Input) */}
                    <div className="relative group perspective-1000">
                        <div className="absolute -inset-1 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                        <div className="relative bg-zinc-900 border border-white/10 p-6 rounded-2xl transform transition-transform duration-500 group-hover:rotate-y-2">
                            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-4">
                                <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                                <span className="ml-2 text-xs text-zinc-500 font-mono">app.dousell.immo/add-property</span>
                            </div>

                            {/* Fake Form */}
                            <div className="space-y-4 font-mono text-sm">
                                <div className="space-y-2">
                                    <div className="text-zinc-500 text-xs">Titre de l'annonce</div>
                                    <div className="bg-black/30 w-full p-2 rounded text-zinc-300 border border-zinc-800">Villa Saly Portudal</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="text-zinc-500 text-xs">Prix / Mois</div>
                                        <div className="bg-black/30 w-full p-2 rounded text-zinc-300 border border-zinc-800">1.500.000 FCFA</div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-zinc-500 text-xs">Surface (m2)</div>
                                        <div className="bg-black/30 w-full p-2 rounded text-zinc-300 border border-zinc-800">350</div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-zinc-500 text-xs">Photos (Upload)</div>
                                    <div className="bg-black/30 w-full p-8 rounded border-2 border-dashed border-zinc-800 flex items-center justify-center text-zinc-600">
                                        Glisser-déposer les fichiers
                                    </div>
                                </div>
                            </div>

                            <div className="absolute -bottom-4 -right-4 bg-zinc-800 text-xs px-3 py-1 rounded-full text-zinc-400 border border-zinc-700 shadow-xl">
                                Saisie Admin
                            </div>
                        </div>
                    </div>

                    {/* MIDDLE: Magic Button */}
                    <div className="flex flex-col items-center justify-center gap-4 py-8 md:py-0">
                        <button
                            onClick={replayAnimation}
                            className="relative group cursor-pointer"
                        >
                            {/* Glow pulsant */}
                            <div className={`absolute inset-0 bg-[#F4C430] blur-xl transition-opacity duration-500 ${isRevealed ? 'opacity-40' : 'opacity-20 animate-pulse'}`}></div>

                            {/* Cercle principal */}
                            <div className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 ${
                                isRevealed
                                    ? 'bg-[#F4C430] shadow-[#F4C430]/50 scale-110'
                                    : 'bg-zinc-800 border-2 border-[#F4C430]/50 hover:border-[#F4C430] hover:scale-105'
                            }`}>
                                {isRevealed ? (
                                    <Sparkles className="w-7 h-7 text-black animate-spin" style={{ animationDuration: '3s' }} />
                                ) : (
                                    <Wand2 className="w-7 h-7 text-[#F4C430] group-hover:rotate-12 transition-transform" />
                                )}
                            </div>

                            {/* Particules lors de la révélation */}
                            {isRevealed && (
                                <>
                                    <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-[#F4C430] rounded-full animate-ping" style={{ animationDuration: '1s' }}></div>
                                    <div className="absolute -top-2 -right-2 w-1.5 h-1.5 bg-[#F4C430] rounded-full animate-bounce"></div>
                                    <div className="absolute -bottom-2 -left-2 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </>
                            )}
                        </button>

                        {/* Label */}
                        <span className={`text-xs font-medium transition-all duration-300 ${
                            isRevealed ? 'text-[#F4C430]' : 'text-zinc-500'
                        }`}>
                            {isRevealed ? 'Magie opérée ✨' : 'Cliquez pour transformer'}
                        </span>

                        <ArrowRight className={`w-6 h-6 md:rotate-0 rotate-90 transition-all duration-500 ${
                            isRevealed ? 'text-[#F4C430] translate-x-1' : 'text-zinc-600'
                        }`} />
                    </div>

                    {/* RIGHT: Visual Showcase (Beautiful Output) - Avec animation de révélation */}
                    <div className={`relative group perspective-1000 transition-all duration-1000 ${
                        isRevealed
                            ? 'opacity-100 translate-x-0 scale-100'
                            : 'opacity-0 translate-x-10 scale-95'
                    }`}>
                        {/* Glow animé */}
                        <div className={`absolute -inset-1 bg-gradient-to-r from-[#F4C430] to-yellow-600 rounded-2xl blur transition-all duration-1000 ${
                            isRevealed ? 'opacity-50' : 'opacity-0'
                        }`}></div>

                        {/* Effet de scan/révélation */}
                        <div className={`absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-2xl ${isRevealed ? 'opacity-0' : 'opacity-100'}`}>
                            <div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F4C430]/30 to-transparent"
                                style={{
                                    transform: isRevealed ? 'translateX(100%)' : 'translateX(-100%)',
                                    transition: 'transform 0.8s ease-out'
                                }}
                            ></div>
                        </div>

                        <div className={`relative bg-black border rounded-2xl overflow-hidden transform transition-all duration-700 shadow-2xl ${
                            isRevealed
                                ? 'border-[#F4C430]/30 group-hover:-rotate-y-2'
                                : 'border-white/5'
                        }`}>
                            {/* Image Cover */}
                            <div className="relative h-48 w-full overflow-hidden">
                                <Image
                                    src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"
                                    alt="Villa"
                                    fill
                                    className={`object-cover transition-all duration-1000 ${
                                        isRevealed ? 'scale-100 brightness-100' : 'scale-110 brightness-50 blur-sm'
                                    }`}
                                />
                                <div className={`absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold border border-white/10 transition-all duration-500 delay-300 ${
                                    isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                                }`}>
                                    À Louer
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className="p-6">
                                <div className={`flex justify-between items-start mb-4 transition-all duration-500 delay-200 ${
                                    isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                                }`}>
                                    <div>
                                        <h3 className="text-xl font-display text-white mb-1">Villa Saly Portudal</h3>
                                        <p className="text-zinc-400 text-sm">Saly, Sénégal • 350 m²</p>
                                    </div>
                                    <div className="text-[#F4C430] font-bold text-lg">
                                        1.5M <span className="text-xs font-normal text-zinc-500">/ mois</span>
                                    </div>
                                </div>

                                <div className={`flex gap-2 mb-6 transition-all duration-500 delay-400 ${
                                    isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                                }`}>
                                    <span className="px-2 py-1 bg-white/5 rounded text-xs text-white/70">4 Chambres</span>
                                    <span className="px-2 py-1 bg-white/5 rounded text-xs text-white/70">Piscine</span>
                                    <span className="px-2 py-1 bg-white/5 rounded text-xs text-white/70">Meublé</span>
                                </div>

                                <button className={`w-full py-3 bg-white text-black font-semibold rounded-xl text-sm hover:bg-gray-200 transition-all duration-500 delay-500 ${
                                    isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                                }`}>
                                    Demander une visite
                                </button>
                            </div>

                            <div className={`absolute -bottom-4 -left-4 bg-[#F4C430] text-xs px-3 py-1 rounded-full text-black font-bold border border-[#F4C430] shadow-xl shadow-[#F4C430]/20 transition-all duration-500 delay-700 ${
                                isRevealed ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                            }`}>
                                Vitrine Client ✨
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
