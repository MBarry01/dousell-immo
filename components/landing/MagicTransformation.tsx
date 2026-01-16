"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Upload, Home, Ruler, Wand2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MagicTransformation() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [displayedText, setDisplayedText] = useState("");

  const fullText = "Saisissez vos données une fois. Sublimez vos biens partout.";

  useEffect(() => {
    const typeSpeed = 50; // Vitesse de saisie (ms)
    const pauseBeforeRestart = 2000; // Pause avant de recommencer (ms)

    let timeout: NodeJS.Timeout;

    if (displayedText === fullText) {
      // Texte complet - pause puis recommencer
      timeout = setTimeout(() => setDisplayedText(""), pauseBeforeRestart);
    } else {
      // Saisie en cours
      timeout = setTimeout(() => {
        setDisplayedText(fullText.substring(0, displayedText.length + 1));
      }, typeSpeed);
    }

    return () => clearTimeout(timeout);
  }, [displayedText, fullText]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <section className="py-4 bg-zinc-950 overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F4C430]/5 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block text-[#F4C430] text-sm font-medium tracking-widest uppercase mb-4">
            De la donnée à la vitrine
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-white mb-6">
            Remplissez un formulaire,<br />
            <span className="gradient-text-animated">obtenez une annonce premium</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            <span>{displayedText}</span>
            <span className="animate-pulse text-[#F4C430]">|</span>
          </p>
        </div>

        {/* Card Container */}
        <div className="w-full max-w-4xl mx-auto p-4 perspective-1000 -mt-20">
          <div className="relative h-[520px] w-full">

            {/* CONTENEUR ANIMÉ (La carte qui tourne) */}
            <motion.div
              className="w-full h-full relative preserve-3d"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{
                duration: 0.8,
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
              style={{ transformStyle: "preserve-3d" }}
            >

              {/* ========================================================
                  FACE 1 : CÔTÉ ADMIN (SAISIE)
                 ======================================================== */}
              <div className="absolute inset-0 backface-hidden">
                <div className="h-full w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">

                  {/* En-tête style "Code" */}
                  <div className="flex gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                    <div className="w-3 h-3 rounded-full bg-green-500/20" />
                    <span className="ml-4 text-xs font-mono text-slate-500">app.dousell.immo/add-property</span>
                  </div>

                  {/* Formulaire simulé */}
                  <div className="space-y-4 font-mono text-sm">
                    <div>
                      <label className="text-slate-500 block mb-1.5">Titre de l&apos;annonce</label>
                      <div className="bg-white/5 border border-white/10 rounded-md p-3 text-white">
                        Villa Saly Portudal
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-slate-500 block mb-1.5">Prix / Mois (FCFA)</label>
                        <div className="bg-white/5 border border-white/10 rounded-md p-3 text-white">
                          1.500.000
                        </div>
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-1.5">Surface (m2)</label>
                        <div className="bg-white/5 border border-white/10 rounded-md p-3 text-white">
                          350
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-500 block mb-1.5">Photos (Upload)</label>
                      <div className="border-2 border-dashed border-white/10 rounded-lg p-8 flex flex-col items-center justify-center text-slate-500 bg-white/5">
                        <Upload className="w-8 h-8 mb-2 opacity-50" />
                        <span>Glisser-déposer les fichiers</span>
                      </div>
                    </div>
                  </div>

                  {/* Badge Admin en bas à droite */}
                  <div className="absolute bottom-4 right-4 bg-white/10 px-3 py-1 rounded-full text-xs text-white/50 font-mono">
                    Vue Admin
                  </div>
                </div>
              </div>

              {/* ========================================================
                  FACE 2 : CÔTÉ CLIENT (VITRINE)
                  (Rotation 180deg pour être visible au dos)
                 ======================================================== */}
              <div
                className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-2xl shadow-[#F4C430]/20 border border-[#F4C430]/30"
                style={{ transform: "rotateY(180deg)" }}
              >
                {/* Image de fond (La Villa) */}
                <div className="absolute inset-0">
                  <img
                    src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1600&auto=format&fit=crop"
                    alt="Villa Saly"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                </div>

                {/* Contenu de la carte Vitrine */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-3xl font-bold text-white">Villa Saly Portudal</h3>
                    <span className="bg-black/60 backdrop-blur-md text-[#F4C430] px-3 py-1 rounded-full font-bold border border-[#F4C430]/30">
                      À Louer
                    </span>
                  </div>

                  <p className="text-slate-300 mb-6 flex items-center gap-2">
                    <Home size={16} /> Saly, Sénégal • <Ruler size={16} /> 350 m²
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {["4 Chambres", "Piscine", "Meublé"].map(tag => (
                        <span key={tag} className="text-xs bg-white/10 backdrop-blur text-white px-2 py-1 rounded-md border border-white/10">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-[#F4C430]">1.5M</span>
                      <span className="text-sm text-slate-400"> /mois</span>
                    </div>
                  </div>

                  <button className="w-full mt-6 bg-white text-black font-bold py-3 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                    Demander une visite <ArrowRight size={16} />
                  </button>
                </div>

                {/* Glow Effect Doré autour de la carte */}
                <div className="absolute inset-0 border-2 border-[#F4C430]/50 rounded-2xl pointer-events-none shadow-[inset_0_0_50px_rgba(244,196,48,0.2)]" />
              </div>

            </motion.div>
          </div>

          {/* ========================================================
              LE BOUTON MAGIQUE (TRIGGER) - Style MagicSection
             ======================================================== */}
          <div className="flex flex-col items-center justify-center gap-3 mt-4">
            <motion.button
              onClick={handleFlip}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="relative group cursor-pointer"
            >
              {/* Étoiles orbitales autour du bouton */}
              <div className="absolute inset-0 w-20 h-20 -top-3 -left-3">
                {/* Étoile 1 - orbite rapide */}
                <div
                  className="absolute w-2 h-2 transition-all duration-300 group-hover:scale-150"
                  style={{
                    animation: 'orbit 3s linear infinite',
                    top: '50%',
                    left: '50%',
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="#F4C430" className="w-full h-full drop-shadow-[0_0_4px_rgba(244,196,48,0.8)]">
                    <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
                  </svg>
                </div>

                {/* Étoile 2 - orbite moyenne */}
                <div
                  className="absolute w-1.5 h-1.5 transition-all duration-300 group-hover:scale-150"
                  style={{
                    animation: 'orbit 4s linear infinite reverse',
                    animationDelay: '-1s',
                    top: '50%',
                    left: '50%',
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="#FFD700" className="w-full h-full drop-shadow-[0_0_3px_rgba(255,215,0,0.8)]">
                    <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
                  </svg>
                </div>

                {/* Étoile 3 - petite orbite */}
                <div
                  className="absolute w-1 h-1 transition-all duration-300 group-hover:scale-200"
                  style={{
                    animation: 'orbit-small 2.5s linear infinite',
                    animationDelay: '-0.5s',
                    top: '50%',
                    left: '50%',
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="#FFFFFF" className="w-full h-full drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]">
                    <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
                  </svg>
                </div>

                {/* Étoile 4 - hover reveal */}
                <div
                  className="absolute w-1.5 h-1.5 opacity-0 group-hover:opacity-100 transition-all duration-500"
                  style={{
                    animation: 'orbit 5s linear infinite',
                    animationDelay: '-2s',
                    top: '50%',
                    left: '50%',
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="#F4C430" className="w-full h-full drop-shadow-[0_0_4px_rgba(244,196,48,0.9)]">
                    <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
                  </svg>
                </div>
              </div>

              {/* Glow pulsant - plus intense au hover */}
              <div className={cn(
                "absolute inset-0 bg-[#F4C430] blur-xl transition-all duration-500",
                isFlipped ? "opacity-50 scale-125" : "opacity-20 animate-pulse group-hover:opacity-40 group-hover:scale-110"
              )} />

              {/* Cercle externe animé (ring) */}
              <div className={cn(
                "absolute -inset-1 rounded-full border-2 border-[#F4C430]/30 transition-all duration-500",
                "group-hover:border-[#F4C430]/60 group-hover:scale-110",
                isFlipped && "border-[#F4C430]/60 scale-110 animate-ping"
              )} style={{ animationDuration: '2s' }} />

              {/* Cercle principal */}
              <div className={cn(
                "relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-500",
                "border-2",
                isFlipped
                  ? "bg-[#F4C430] border-[#F4C430] shadow-[0_0_30px_rgba(244,196,48,0.6)] scale-110"
                  : "bg-zinc-900 border-[#F4C430]/60 group-hover:border-[#F4C430] group-hover:shadow-[0_0_20px_rgba(244,196,48,0.4)]"
              )}>
                {isFlipped ? (
                  <Sparkles className="w-6 h-6 text-black" style={{ animation: 'spin 3s linear infinite' }} />
                ) : (
                  <Wand2 className="w-6 h-6 text-[#F4C430] group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
                )}
              </div>

              {/* Particules éclatantes lors du flip */}
              {isFlipped && (
                <>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-[#F4C430] rounded-full animate-ping" style={{ animationDuration: '1s' }} />
                  <div className="absolute -top-2 -right-2 w-2 h-2 bg-[#F4C430] rounded-full animate-bounce" />
                  <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-yellow-300 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="absolute -top-2 -left-2 w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  <div className="absolute -bottom-2 -right-2 w-1.5 h-1.5 bg-[#FFD700] rounded-full animate-bounce" style={{ animationDelay: '0.25s' }} />
                </>
              )}

              {/* CSS pour les animations d'orbite */}
              <style jsx>{`
                @keyframes orbit {
                  from {
                    transform: rotate(0deg) translateX(32px) rotate(0deg);
                  }
                  to {
                    transform: rotate(360deg) translateX(32px) rotate(-360deg);
                  }
                }
                @keyframes orbit-small {
                  from {
                    transform: rotate(0deg) translateX(24px) rotate(0deg);
                  }
                  to {
                    transform: rotate(360deg) translateX(24px) rotate(-360deg);
                  }
                }
              `}</style>
            </motion.button>

            {/* Label */}
            <span className={cn(
              "text-xs font-medium transition-all duration-300 mt-2",
              isFlipped ? "text-[#F4C430]" : "text-zinc-500 group-hover:text-zinc-300"
            )}>
              {isFlipped ? "Magie opérée" : "Cliquez pour transformer"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
