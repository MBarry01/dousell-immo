"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Upload, Home, Ruler, Wand2, ArrowRight } from "lucide-react";
import { AddressAutocomplete } from "@/components/forms/address-autocomplete";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";

export default function MagicTransformation() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [displayedText, setDisplayedText] = useState("");

  // Interactive Form State
  const [propertyTitle, setPropertyTitle] = useState("Villa Saly Portudal");
  const [propertyPrice, setPropertyPrice] = useState("1.500.000");
  const [propertySurface, setPropertySurface] = useState("350");
  const [propertyCity, setPropertyCity] = useState("Saly, Sénégal");
  const [propertyRooms, setPropertyRooms] = useState("4");
  const [propertyLat, setPropertyLat] = useState<number | null>(null);
  const [propertyLon, setPropertyLon] = useState<number | null>(null);
  const [propertyImage, setPropertyImage] = useState("https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1600&auto=format&fit=crop");
  const [propertyImageBase64, setPropertyImageBase64] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error("L'image sélectionnée est trop volumineuse (max 15Mo).");
        return;
      }
      const imageUrl = URL.createObjectURL(file);
      setPropertyImage(imageUrl);

      try {
        toast.info("Préparation de l'image...", { id: "image-uploading" });
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 1.5,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        });
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onloadend = () => {
          setPropertyImageBase64(reader.result as string);
          toast.success("Image prête !", { id: "image-uploading" });
        };
      } catch (error) {
        console.error("Error compressing image:", error);
        toast.error("Erreur, l'image n'a pas pu être compréssée.", { id: "image-uploading" });
      }
    }
  };

  const router = useRouter();

  const handlePublish = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setIsPublishing(true);

    // Provide explicit visual feedback for heavy operations
    setTimeout(() => {
      const draftData = {
        title: propertyTitle,
        price: propertyPrice,
        surface: propertySurface,
        city: propertyCity,
        bedrooms: propertyRooms,
        lat: propertyLat,
        lon: propertyLon,
        imageBase64: propertyImageBase64,
      };

      try {
        localStorage.setItem("pending_property_draft", JSON.stringify(draftData));
      } catch (err) {
        console.warn("Stockage brouillon impossible", err);
      }

      const redirectUrl = "/login?tab=register&redirect=" + encodeURIComponent("/compte/traitement-magique");

      try {
        router.push(redirectUrl);
      } catch (routingErr) {
        console.error("Router error, fallback to window.location", routingErr);
        window.location.href = redirectUrl;
      }
    }, 150);
  };

  const fullText = "Saisissez vos données une fois. Sublimez vos biens partout.";

  // Check if we're on mobile to disable performance-heavy animation
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // On mobile, skip the animation loop entirely for performance
    if (isMobile) {
      setDisplayedText(fullText);
      return;
    }

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
  }, [displayedText, fullText, isMobile]);

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
          <h2 className="font-display text-[clamp(1.875rem,5vw,3.75rem)] text-white mb-6">
            Remplissez un formulaire,<br />
            <span className="gradient-text-animated">obtenez une annonce premium</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            <span>{displayedText}</span>
            <span className="animate-pulse text-[#F4C430]">|</span>
          </p>
        </div>

        {/* Card Container */}
        <div className="w-full max-w-4xl mx-auto p-4 perspective-1000 mt-8 md:-mt-20">
          <div className="relative h-[450px] md:h-[520px] w-full">

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
              <div
                className={`absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 bg-[#1A1A1A] border border-white/5 p-4 md:p-6 lg:p-8 flex flex-col justify-between transition-opacity duration-300 ${isFlipped ? 'opacity-0 pointer-events-none z-0' : 'opacity-100 pointer-events-auto z-10'
                  }`}
              >
                {/* En-tête style "Code" */}
                <div className="flex gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/20" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20" />
                  <span className="ml-4 text-xs font-mono text-slate-500">app.dousell.immo/add-property</span>
                </div>

                {/* Formulaire simulé */}
                <div className="space-y-3 md:space-y-4 font-mono text-sm flex-1 flex flex-col justify-center">
                  <div>
                    <label className="text-slate-500 block mb-1.5">Titre de l'annonce</label>
                    <input
                      type="text"
                      value={propertyTitle}
                      onChange={(e) => setPropertyTitle(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-md p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#F4C430]/50 focus:border-[#F4C430]/50 transition-colors placeholder:text-white/20"
                      placeholder="Ex: Villa Saly Portudal"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div className="flex flex-col h-full">
                      <label className="text-slate-500 block mb-1.5 text-xs md:text-sm">Prix / Mois (FCFA)</label>
                      <input
                        type="text"
                        value={propertyPrice}
                        onChange={(e) => setPropertyPrice(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-md p-3 text-white mt-auto focus:outline-none focus:ring-1 focus:ring-[#F4C430]/50 focus:border-[#F4C430]/50 transition-colors placeholder:text-white/20"
                        placeholder="Ex: 1.500.000"
                      />
                    </div>
                    <div className="flex flex-col h-full">
                      <label className="text-slate-500 block mb-1.5 text-xs md:text-sm">Localisation</label>
                      <AddressAutocomplete
                        defaultValue={propertyCity}
                        onChange={(val) => setPropertyCity(val)}
                        onAddressSelect={(details) => {
                          setPropertyCity(details.display_name);
                          setPropertyLat(details.lat ? parseFloat(details.lat) : null);
                          setPropertyLon(details.lon ? parseFloat(details.lon) : null);
                        }}
                        className="w-full"
                        inputClassName="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:ring-[#F4C430]/50 focus:border-[#F4C430]/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div className="flex flex-col h-full">
                      <label className="text-slate-500 block mb-1.5 text-xs md:text-sm">Surface (m2)</label>
                      <input
                        type="text"
                        value={propertySurface}
                        onChange={(e) => setPropertySurface(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-md p-3 text-white mt-auto focus:outline-none focus:ring-1 focus:ring-[#F4C430]/50 focus:border-[#F4C430]/50 transition-colors placeholder:text-white/20"
                        placeholder="Ex: 350"
                      />
                    </div>
                    <div className="flex flex-col h-full">
                      <label className="text-slate-500 block mb-1.5 text-xs md:text-sm">Chambres</label>
                      <input
                        type="number"
                        value={propertyRooms}
                        onChange={(e) => setPropertyRooms(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-md p-3 text-white mt-auto focus:outline-none focus:ring-1 focus:ring-[#F4C430]/50 focus:border-[#F4C430]/50 transition-colors placeholder:text-white/20"
                        placeholder="Ex: 4"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-slate-500 block mb-1 text-xs md:text-sm">Photos (Upload)</label>
                    <div className="relative border-2 border-dashed border-white/10 rounded-lg p-4 md:p-8 flex flex-col items-center text-center justify-center text-slate-500 bg-white/5 hover:border-[#F4C430]/50 transition-colors cursor-pointer overflow-hidden group min-h-[100px] md:min-h-[140px]">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        data-1p-ignore
                        data-lpignore="true"
                      />
                      {propertyImage && propertyImage !== "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1600&auto=format&fit=crop" ? (
                        <div className="absolute inset-0 w-full h-full opacity-40 group-hover:opacity-20 transition-opacity">
                          <img src={propertyImage} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : null}
                      <Upload className="w-6 h-6 md:w-8 md:h-8 mb-1 md:mb-2 opacity-50 relative z-20 group-hover:text-[#F4C430] transition-colors" />
                      <span className="relative z-20 group-hover:text-white transition-colors text-xs md:text-sm">{propertyImage && propertyImage !== "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1600&auto=format&fit=crop" ? "Image chargée. Cliquez pour changer." : "Glisser-déposer ou cliquer pour choisir"}</span>
                    </div>
                  </div>
                </div>

                {/* Le bouton Publier a été déplacé sur la Face 2 */}
              </div>

              {/* ========================================================
                  FACE 2 : CÔTÉ CLIENT (VITRINE)
                  (Rotation 180deg pour être visible au dos)
                 ======================================================== */}
              <div
                className={`absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-2xl shadow-[#F4C430]/20 border border-[#F4C430]/30 transition-opacity duration-300 ${isFlipped ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
                  }`}
                style={{ transform: "rotateY(180deg)" }}
              >
                {/* Image de fond (La Villa) */}
                <div className="absolute inset-0">
                  <img
                    src={propertyImage}
                    alt="Villa Saly"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                </div>

                {/* Contenu de la carte Vitrine */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1 md:gap-0 mb-2">
                    <h3 className="text-xl md:text-3xl font-bold text-white max-w-[70%] truncate">{propertyTitle || "Villa Saly Portudal"}</h3>
                    <span className="bg-black/60 backdrop-blur-md text-[#F4C430] px-2 py-0.5 md:px-3 md:py-1 rounded-full font-bold border border-[#F4C430]/30 text-xs md:text-sm w-fit">
                      À Louer
                    </span>
                  </div>

                  <p className="text-slate-300 mb-3 md:mb-6 flex items-center gap-1 md:gap-2 text-sm md:text-base">
                    <Home size={14} className="md:hidden" /><Home size={16} className="hidden md:block" /> {propertyCity || "Saly, Sénégal"} • <Ruler size={14} className="md:hidden" /><Ruler size={16} className="hidden md:block" /> {propertySurface || "350"} m²
                  </p>

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
                    <div className="flex flex-wrap gap-1 md:gap-2">
                      <span className="text-[10px] md:text-xs bg-white/10 backdrop-blur text-white px-1.5 py-0.5 md:px-2 md:py-1 rounded-md border border-white/10">
                        {propertyRooms ? `${propertyRooms} Ch.` : "4 Ch."}
                      </span>
                    </div>
                    <div className="text-left md:text-right">
                      <span className="text-xl md:text-2xl font-bold text-[#F4C430]">{propertyPrice ? propertyPrice.replace(/\./g, ' ') : "1.500.000"}</span>
                      <span className="text-xs md:text-sm text-slate-400"> FCFA/mois</span>
                    </div>
                  </div>

                  <button
                    onClick={handlePublish}
                    onTouchStart={handlePublish}
                    disabled={isPublishing}
                    className={`w-full mt-3 md:mt-6 text-black font-bold py-2 md:py-3 rounded-full transition-colors flex items-center justify-center gap-2 text-sm md:text-base relative z-50 cursor-pointer ${isFlipped
                      ? 'bg-[#F4C430] hover:bg-[#F4C430]/90 shadow-[0_0_20px_rgba(244,196,48,0.3)] disabled:opacity-70 disabled:cursor-wait'
                      : 'bg-white hover:bg-slate-200 disabled:opacity-70 disabled:cursor-wait'
                      }`}
                  >
                    {isPublishing ? 'Chargement en cours...' : (isFlipped ? 'Publier cette annonce gratuitement' : 'Demander une visite')}
                    {!isPublishing && <ArrowRight size={14} className="md:hidden" />}
                    {!isPublishing && <ArrowRight size={16} className="hidden md:block" />}
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

            {/* Subtitle / Callout - Styled like the main H2 title */}
            <motion.h3

              className="mt-8 font-display text-2xl md:text-3xl lg:text-4xl text-white text-center max-w-3xl mx-auto leading-tight"
            >
              Bénéficiez d'une vitrine visible sur Google. <br className="hidden md:block" />
              <span className="text-[#F4C430]">Recevez des demandes de visite qualifiées.</span>
            </motion.h3>
          </div>
        </div>
      </div>
    </section>
  );
}
