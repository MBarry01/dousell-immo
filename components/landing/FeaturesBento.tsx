"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Wallet, FileText, BarChart3, ShieldCheck, Mail, Zap } from "lucide-react";

export default function FeaturesBento() {
    return (
        <section className="py-24 bg-black relative overflow-hidden" id="features">
            {/* Background Gradients */}
            <div className="absolute top-0 center w-full h-full bg-[radial-gradient(circle_at_center,_rgba(244,196,48,0.05)_0%,_transparent_70%)] pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-16 space-y-4">
                    <span className="inline-block text-[#F4C430] text-sm font-medium tracking-widest uppercase mb-4">
                        Fonctionnalités
                    </span>
                    <h2 className="font-display text-4xl md:text-5xl text-white max-w-2xl mx-auto">
                        Tout ce dont vous avez besoin pour <span className="gradient-text-animated">piloter</span> votre immobilier
                    </h2>
                    <p className="text-gray-400 max-w-xl mx-auto">
                        Une suite complète d'outils pour automatiser, sécuriser et rentabiliser vos biens, accessible 24/7.
                    </p>
                </div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-3 gap-6 auto-rows-[300px]">

                    {/* Feature 1: Large Card (Main Dashboard) */}
                    <div className="md:col-span-3 md:row-span-2 relative group overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 transition-colors">
                        {/* Image Container - Full Background */}
                        <div className="absolute inset-0 z-0">
                            <Image
                                src="/images/dashboard.png"
                                alt="Tableau de bord Dousell"
                                fill
                                className="object-cover object-left-top transition-transform duration-700 group-hover:scale-105"
                            />
                            {/* Gradient Overlay for Text Readability */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent z-10" />
                        </div>

                        {/* Text Content */}
                        <div className="absolute top-0 bottom-0 left-0 p-8 z-20 flex flex-col justify-center max-w-2xl">

                            <h3 className="text-3xl font-bold text-white mb-4 drop-shadow-md">Tableau de Bord Intuitif</h3>
                            <p className="text-gray-200 text-lg font-medium drop-shadow-md leading-relaxed">
                                Suivez vos loyers, taux d'occupation et finances en temps réel.
                                <br /><span className="text-[#F4C430] text-sm mt-2 block">Une vue d'ensemble claire pour des décisions éclairées.</span>
                            </p>
                        </div>
                    </div>

                    {/* Feature 2: Vertical Card (Payments) */}
                    <div className="md:col-span-1 md:row-span-2 relative group overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm transition-colors hover:bg-zinc-900/80">
                        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-transparent to-black/60 z-10" />

                        <div className="absolute top-8 left-8 z-20 max-w-[80%]">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
                                <Wallet size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 drop-shadow-md">Paiements Automatisés</h3>
                            <p className="text-gray-200 text-sm drop-shadow-md">Encaissement des loyers via Wave/OM. Quittances générées automatiquement.</p>
                        </div>

                        {/* Payment Visual - Full Bleed Bottom */}
                        <div className="absolute inset-x-0 bottom-0 h-3/5 overflow-hidden border-t border-white/10 bg-[#0a0a0a] shadow-lg translate-y-4 transition-transform group-hover:translate-y-2">
                            <div className="w-full h-full relative">
                                <Image
                                    src="/images/pay_rent_cover.png"
                                    alt="Paiement de loyer"
                                    fill
                                    className="object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity"
                                />
                                {/* Bottom Gradient for blending */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Feature 3: Small Card (Contracts) */}
                    <div className="md:col-span-1 md:row-span-1 relative group overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm transition-colors hover:bg-white/10">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                    <FileText size={20} />
                                </div>
                                <Zap size={16} className="text-[#F4C430]" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Contrats Digitaux</h3>
                            <p className="text-gray-400 text-sm">Créez et signez vos baux électroniquement en quelques clics.</p>
                        </div>
                        {/* Mini visual */}
                        <div className="absolute right-4 bottom-4 opacity-20">
                            <FileText size={64} className="text-blue-400" />
                        </div>
                    </div>

                    {/* Feature 4: Small Card (Inventory) */}
                    <div className="md:col-span-1 md:row-span-1 relative group overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm transition-colors hover:bg-white/10">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                    <ShieldCheck size={20} />
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">États des Lieux</h3>
                            <p className="text-gray-400 text-sm">Vérification photo complète et sécurisée sur mobile/tablette.</p>
                        </div>
                        {/* Mini visual */}
                        <div className="absolute right-4 bottom-4 opacity-20">
                            <ShieldCheck size={64} className="text-purple-400" />
                        </div>
                    </div>

                    {/* Feature 5: Wide Card (Support) */}
                    <div className="md:col-span-2 md:row-span-1 relative group overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm transition-colors hover:bg-white/10">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                                    <Mail size={20} />
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Alertes & Rappels</h3>
                            <p className="text-gray-400 text-sm">Ne manquez jamais une échéance de paiement ou de renouvellement.</p>
                        </div>
                        {/* Mini visual */}
                        <div className="absolute right-4 bottom-4 opacity-20">
                            <Mail size={64} className="text-orange-400" />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
