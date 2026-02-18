"use client";

import { motion } from "framer-motion";
import { Search, MapPin, Key } from "lucide-react";

// Lucide icons are outlined by default. We'll control stroke width in the component.

const steps = [
    {
        icon: Search,
        title: "1. Recherchez",
        desc: "Parcourez notre sélection exclusive de biens vérifiés à Dakar et Saly.",
    },
    {
        icon: MapPin, // Changed to MapPin for "Visitez" as it fits well, or Eye/Calendar could work. MapPin for location visit.
        title: "2. Visitez",
        desc: "Planifiez une visite physique ou virtuelle en un clic, à votre convenance.",
    },
    {
        icon: Key,
        title: "3. Emménagez",
        desc: "Signez votre bail électroniquement et payez votre caution en toute sécurité.",
    },
];

export default function TenantSteps() {
    return (
        <section className="py-24 bg-zinc-950 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#F4C430]/5 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[128px] pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <span className="inline-block text-[#F4C430] text-sm font-medium tracking-widest uppercase mb-4">
                        Comment ça marche
                    </span>
                    <h2 className="font-display text-[clamp(1.875rem,3.5vw,2.25rem)] text-white">
                        Votre prochain chez-vous en <span className="text-[#F4C430]">3 étapes</span>
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 relative">
                    {/* Connector Line (Desktop) */}
                    <div className="hidden md:block absolute top-[2.5rem] left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent border-t border-dashed border-zinc-800 z-0" />

                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2, duration: 0.5 }}
                            className="relative z-10 group"
                        >
                            <div className="flex flex-col items-center text-center">
                                {/* Icon Container - Glassmorphism */}
                                <div className="w-20 h-20 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center mb-8 relative group-hover:border-[#F4C430]/50 transition-all duration-500 shadow-2xl shadow-black/50">
                                    {/* Inner Glow */}
                                    <div className="absolute inset-0 bg-[#F4C430]/0 group-hover:bg-[#F4C430]/10 rounded-2xl transition-colors duration-500" />

                                    <step.icon
                                        className="w-8 h-8 text-gray-300 group-hover:text-[#F4C430] transition-colors duration-500"
                                        strokeWidth={1.5}
                                    />
                                </div>

                                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#F4C430] transition-colors duration-300">
                                    {step.title}
                                </h3>
                                <p className="text-gray-400 leading-relaxed max-w-xs mx-auto text-sm">
                                    {step.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
