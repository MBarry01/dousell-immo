"use client";

import Image from "next/image";
import { ExternalLink, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";

type StaticMapProps = {
  coords: { lat: number; lng: number };
  city: string;
};

export const StaticMap = ({ coords, city }: StaticMapProps) => {
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);
  const mapsLink = `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
  
  // Construire l'URL de la carte (Google Maps ou Mapbox)
  useEffect(() => {
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    
    if (googleApiKey) {
      // Utiliser Google Maps Static API avec un style amélioré
      const googleMapUrl = new URL("https://maps.googleapis.com/maps/api/staticmap");
      googleMapUrl.searchParams.set("center", `${coords.lat},${coords.lng}`);
      googleMapUrl.searchParams.set("zoom", "15");
      googleMapUrl.searchParams.set("size", "800x400");
      googleMapUrl.searchParams.set("scale", "2");
      googleMapUrl.searchParams.set("format", "jpg");
      googleMapUrl.searchParams.set("maptype", "roadmap");
      
      // Style personnalisé pour un rendu plus moderne
      googleMapUrl.searchParams.set(
        "style",
        "feature:all|element:labels|visibility:simplified|feature:poi|visibility:off|feature:road|element:labels|visibility:off"
      );
      
      // Marqueur personnalisé
      googleMapUrl.searchParams.set(
        "markers",
        `color:0x3B82F6|size:mid|${coords.lat},${coords.lng}`
      );
      
      googleMapUrl.searchParams.set("key", googleApiKey);
      
      setMapUrl(googleMapUrl.toString());
    } else if (mapboxToken) {
      // Utiliser Mapbox Static API comme fallback
      const mapboxMapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+3B82F6(${coords.lng},${coords.lat})/${coords.lng},${coords.lat},15/800x400@2x?access_token=${mapboxToken}`;
      setMapUrl(mapboxMapUrl);
    }
  }, [coords.lat, coords.lng]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-6 dark:border-white/10 dark:bg-white/5"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-white/50">
            Localisation
          </p>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {city}
          </h3>
        </div>
        <Button
          variant="secondary"
          className="rounded-2xl border border-gray-200 bg-white text-sm text-gray-900 hover:bg-gray-100 dark:border-white/20 dark:bg-transparent dark:text-white"
          asChild
        >
          <a href={mapsLink} target="_blank" rel="noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Ouvrir Maps
          </a>
        </Button>
      </div>
      <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10">
        {mapUrl && !mapError ? (
          <Image
            src={mapUrl}
            alt={`Carte de ${city}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
            quality={85}
            onError={() => setMapError(true)}
            priority={false}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
            <MapPin className="mb-3 h-12 w-12 text-gray-400 dark:text-white/30" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 dark:text-white/60">
                Carte non disponible
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-white/40">
                Cliquez sur &quot;Ouvrir Maps&quot; pour voir la localisation
              </p>
            </div>
          </div>
        )}
        {/* Overlay avec coordonnées au survol */}
        <div className="absolute bottom-2 right-2 rounded-lg bg-black/50 px-2 py-1 text-xs text-white/80 backdrop-blur-sm">
          {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
        </div>
      </div>
    </motion.div>
  );
};

