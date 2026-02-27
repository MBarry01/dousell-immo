"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Bed, Bath, Move, ArrowRight, Star, Sparkles } from "lucide-react";
import { Property } from "@/types/property";

export default function FeaturedPropertiesHero() {
  const [properties, setProperties] = useState<Partial<Property>[]>([]);
  const [_loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      try {
        // Ajouter un timestamp pour éviter le cache navigateur
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/properties/featured?limit=3&_t=${timestamp}`, {
          cache: "no-store", // Désactiver le cache
          headers: {
            "Cache-Control": "no-cache"
          }
        });

        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();

        // Log deep pour debug
        console.log("🔥 [FeaturedHero] Raw data received:", data.properties?.length || 0);

        if (data.properties && Array.isArray(data.properties) && data.properties.length > 0) {
          // Filtrer les propriétés invalides ou vides
          const validProps = data.properties.filter((p: Property) => p.id && p.title);

          if (validProps.length > 0) {
            console.log("✅ [FeaturedHero] Setting real properties:", validProps.length);
            setProperties(validProps.slice(0, 3)); // Toujours limiter à 3
            setIsDemo(false);
          } else {
            console.warn("⚠️ [FeaturedHero] Received properties but none were valid");
          }
        } else {
          console.warn("⚠️ [FeaturedHero] No properties found in API response");
        }
      } catch (error) {
        console.error("❌ [FeaturedHero] Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, []);

  return (
    <section className="relative py-12 md:py-20 bg-black overflow-hidden">
      {/* Gradient de fond */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(244,196,48,0.08)_0%,_transparent_60%)]" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Header avec animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-12"
        >
          <span className="inline-block text-[#F4C430] text-[11px] md:text-sm font-medium tracking-widest uppercase mb-2">
            Sélection
          </span>

          <h2 className="font-display text-[clamp(1.5rem,4vw,3rem)] text-white mb-3 md:mb-4">
            Ces biens <span className="gradient-text-animated">vous attendent</span>
          </h2>

          <p className="text-gray-400 text-[clamp(0.875rem,1.5vw,1.125rem)] max-w-xs md:max-w-xl mx-auto">
            Une sélection exclusive de propriétés d&apos;exception.
          </p>
        </motion.div>

        {/* Grille des biens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {properties.map((property, index) => {
            const isExternal = property.isExternal;
            const targetUrl = isExternal
              ? `/biens/ext/${property.id}`
              : (isDemo ? "/recherche" : `/biens/${property.id}`);
            const LinkComponent = Link;
            const linkProps = {};

            return (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="group relative"
              >
                <LinkComponent href={targetUrl} {...linkProps}>
                  <div className="relative rounded-2xl bg-zinc-900/80 border border-white/5 overflow-hidden transition-all duration-500 hover:border-[#F4C430]/30 hover:shadow-[0_20px_50px_-15px_rgba(244,196,48,0.15)]">

                    {/* Image Container avec overlay */}
                    <div className="relative h-48 md:h-56 overflow-hidden">
                      {/* Badge Transaction */}
                      <div className="absolute top-3 left-3 md:top-4 md:left-4 z-20">
                        <span className="inline-flex items-center gap-1 md:gap-1.5 bg-black/70 backdrop-blur-sm text-white text-[11px] md:text-xs font-semibold px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border border-white/10">
                          {property.transaction === "vente" ? (
                            <>
                              <Star className="w-3 h-3 text-[#F4C430]" />
                              Vente
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                              Location
                            </>
                          )}
                        </span>
                      </div>


                      {/* Image */}
                      {property.images && property.images.length > 0 ? (
                        <Image
                          src={property.images[0]}
                          alt={property.title || "Propriété"}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600">
                          <span className="text-sm">Image non disponible</span>
                        </div>
                      )}

                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

                      {/* Prix flottant */}
                      <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 z-20">
                        <motion.div
                          animate={hoveredIndex === index ? { y: -4, scale: 1.02 } : { y: 0, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className="bg-black/80 backdrop-blur-sm rounded-lg md:rounded-xl px-3 py-1.5 md:px-4 md:py-2 border border-white/10"
                        >
                          <span className="text-[#F4C430] font-bold text-base md:text-lg">
                            {new Intl.NumberFormat("fr-FR").format(property.price || 0)} F
                          </span>
                          {property.transaction === "location" && (
                            <span className="text-white/60 text-xs md:text-sm"> /mois</span>
                          )}
                        </motion.div>
                      </div>
                    </div>

                    {/* Contenu */}
                    <div className="p-4 md:p-5">
                      <h3 className="text-base md:text-lg font-semibold text-white mb-1.5 md:mb-2 line-clamp-1 group-hover:text-[#F4C430] transition-colors duration-300">
                        {property.title}
                      </h3>

                      <div className="flex items-center text-gray-400 text-xs md:text-sm mb-3 md:mb-4">
                        <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-1.5 text-[#F4C430] flex-shrink-0" />
                        <span className="line-clamp-1">
                          {property.location?.city}
                          {property.location?.address && `, ${property.location.address}`}
                        </span>
                      </div>

                      {/* Specs */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-3 md:pt-4">
                        <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-300">
                          {property.specs?.bedrooms !== undefined && (
                            <div className="flex items-center gap-1.5">
                              <Bed className="w-4 h-4 text-white/40" />
                              <span>{property.specs.bedrooms}</span>
                            </div>
                          )}
                          {property.specs?.bathrooms !== undefined && (
                            <div className="flex items-center gap-1.5">
                              <Bath className="w-4 h-4 text-white/40" />
                              <span>{property.specs.bathrooms}</span>
                            </div>
                          )}
                          {property.specs?.surface !== undefined && (
                            <div className="flex items-center gap-1.5">
                              <Move className="w-4 h-4 text-white/40" />
                              <span>{property.specs.surface}m²</span>
                            </div>
                          )}
                        </div>

                        {/* Flèche animée */}
                        <motion.div
                          animate={hoveredIndex === index ? { x: 4 } : { x: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center text-[#F4C430]"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </LinkComponent>
              </motion.div>
            );
          })}
        </div>

        {/* CTA vers toutes les annonces */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-8 md:mt-12"
        >
          <Link
            href="/recherche"
            className="inline-flex items-center gap-2 bg-transparent border border-[#F4C430]/30 text-[#F4C430] hover:bg-[#F4C430]/10 px-6 md:px-8 py-3 md:py-3.5 rounded-full text-sm md:text-base font-medium transition-all duration-300 hover:border-[#F4C430]/50 active:scale-[0.98] group"
          >
            Voir toutes les annonces
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
