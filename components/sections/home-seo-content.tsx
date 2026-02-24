"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const HomeSEOContent = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <section
            id="seo-section"
            aria-labelledby="seo-title"
            className="mx-auto max-w-4xl px-4 py-12 md:py-20 text-center"
        >
            <h2
                id="seo-title"
                className="mb-6 text-2xl font-bold text-white md:text-3xl"
            >
                Plateforme immobilière au Sénégal
            </h2>

            <div className="relative">
                <motion.div
                    initial={false}
                    animate={{
                        height: isExpanded ? "auto" : "96px"
                    }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }} // Smooth cubic-bezier
                    className={cn(
                        "text-lg leading-relaxed text-white/70 overflow-hidden relative",
                        !isExpanded && "mask-gradient"
                    )}
                >
                    <p>
                        Avec plus de 500 biens vérifiés à Dakar et sur la Petite Côte (Mbour, Saly, Somone),
                        Dousell Immo s'impose comme la plateforme immobilière de référence au Sénégal.
                        Que ce soit pour l'achat d'une villa de luxe, la location d'un studio moderne
                        ou la gestion locative professionnelle, nous connectons propriétaires, agences
                        et investisseurs grâce à des outils digitaux sécurisés et transparents.
                    </p>
                    <p className="mt-4">
                        Notre expertise locale alliée à l'innovation technologique permet de sécuriser
                        chaque étape de votre projet immobilier. De la vérification rigoureuse des titres
                        de propriété à la dématérialisation des contrats de bail, Dousell Immo simplifie
                        l'accès au logement et optimise la rentabilité des investissements immobiliers
                        au Sénégal.
                    </p>
                </motion.div>

                {/* Bouton Voir Plus - Visible sur tous les écrans pour un déploiement fluide */}
                <div className="mt-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2 text-primary hover:bg-white/5 mx-auto"
                    >
                        {isExpanded ? (
                            <>
                                Voir moins <ChevronUp className="h-4 w-4" />
                            </>
                        ) : (
                            <>
                                Voir plus <ChevronDown className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <style jsx>{`
        .mask-gradient {
          mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
        }
      `}</style>
        </section>
    );
};
