"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Bed, Bath, Move, ArrowRight, Star, Sparkles } from "lucide-react";
import { Property } from "@/types/property";

// Données de démonstration pour affichage par défaut
const demoProperties: Partial<Property>[] = [
  {
    id: "demo-1",
    title: "Villa moderne avec piscine",
    price: 850000,
    transaction: "location",
    images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"],
    location: { city: "Dakar", address: "Almadies", landmark: "", coords: { lat: 14.7167, lng: -17.4677 } },
    specs: { bedrooms: 4, bathrooms: 3, surface: 350, rooms: 5, dpe: "B" },
  },
  {
    id: "demo-2",
    title: "Appartement vue mer",
    price: 450000,
    transaction: "location",
    images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"],
    location: { city: "Dakar", address: "Ngor", landmark: "", coords: { lat: 14.7500, lng: -17.5167 } },
    specs: { bedrooms: 3, bathrooms: 2, surface: 180, rooms: 4, dpe: "C" },
  },
  {
    id: "demo-3",
    title: "Penthouse de luxe",
    price: 1200000,
    transaction: "location",
    images: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80"],
    location: { city: "Saly", address: "Saly Portudal", landmark: "", coords: { lat: 14.4500, lng: -17.0167 } },
    specs: { bedrooms: 5, bathrooms: 4, surface: 420, rooms: 7, dpe: "A" },
  },
];

export default function FeaturedPropertiesHero() {
  const [properties, setProperties] = useState<Partial<Property>[]>(demoProperties);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const response = await fetch("/api/properties/featured?limit=3");
        const data = await response.json();
        if (data.properties && data.properties.length > 0) {
          setProperties(data.properties);
          setIsDemo(false);
        }
      } catch (error) {
        console.error("Error fetching featured properties:", error);
        // Garder les données de démo en cas d'erreur
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, []);

  return (
    <section className="relative py-20 bg-black overflow-hidden">
      {/* Gradient de fond */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(244,196,48,0.08)_0%,_transparent_60%)]" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header avec animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-[#F4C430]/10 border border-[#F4C430]/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-[#F4C430]" />
            <span className="text-[#F4C430] text-sm font-medium tracking-wide">
              Coups de coeur
            </span>
          </div>

          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-white mb-4">
            Ces biens <span className="gradient-text-animated">vous attendent</span>
          </h2>

          <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto">
            Une sélection exclusive de propriétés d'exception, prêtes à vous accueillir.
          </p>
        </motion.div>

        {/* Grille des biens */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {properties.map((property, index) => (
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
              <Link href={isDemo ? "/recherche" : `/biens/${property.id}`}>
                <div className="relative rounded-2xl bg-zinc-900/80 border border-white/5 overflow-hidden transition-all duration-500 hover:border-[#F4C430]/30 hover:shadow-[0_20px_50px_-15px_rgba(244,196,48,0.15)]">

                  {/* Image Container avec overlay */}
                  <div className="relative h-56 overflow-hidden">
                    {/* Badge Transaction */}
                    <div className="absolute top-4 left-4 z-20">
                      <span className="inline-flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10">
                        {property.transaction === "vente" ? (
                          <>
                            <Star className="w-3 h-3 text-[#F4C430]" />
                            Vente
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            Location
                          </>
                        )}
                      </span>
                    </div>

                    {/* Badge Coup de coeur */}
                    {index === 0 && (
                      <div className="absolute top-4 right-4 z-20">
                        <motion.span
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.5, type: "spring" }}
                          className="inline-flex items-center gap-1 bg-[#F4C430] text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-[#F4C430]/30"
                        >
                          <Sparkles className="w-3 h-3" />
                          Top
                        </motion.span>
                      </div>
                    )}

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
                    <div className="absolute bottom-4 left-4 z-20">
                      <motion.div
                        animate={hoveredIndex === index ? { y: -4, scale: 1.02 } : { y: 0, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="bg-black/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10"
                      >
                        <span className="text-[#F4C430] font-bold text-lg">
                          {new Intl.NumberFormat("fr-FR").format(property.price || 0)} F
                        </span>
                        {property.transaction === "location" && (
                          <span className="text-white/60 text-sm"> /mois</span>
                        )}
                      </motion.div>
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1 group-hover:text-[#F4C430] transition-colors duration-300">
                      {property.title}
                    </h3>

                    <div className="flex items-center text-gray-400 text-sm mb-4">
                      <MapPin className="w-4 h-4 mr-1.5 text-[#F4C430] flex-shrink-0" />
                      <span className="line-clamp-1">
                        {property.location?.city}
                        {property.location?.address && `, ${property.location.address}`}
                      </span>
                    </div>

                    {/* Specs */}
                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                      <div className="flex items-center gap-4 text-sm text-gray-300">
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
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA vers toutes les annonces */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-12"
        >
          <Link
            href="/recherche"
            className="inline-flex items-center gap-2 bg-transparent border border-[#F4C430]/30 text-[#F4C430] hover:bg-[#F4C430]/10 px-8 py-3.5 rounded-full font-medium transition-all duration-300 hover:border-[#F4C430]/50 group"
          >
            Voir toutes les annonces
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
