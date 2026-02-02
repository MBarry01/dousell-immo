"use client";

import Image from "next/image";
import { ExternalLink, MapPin, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";

import { Button } from "@/components/ui/button";

type StaticMapProps = {
  coords: { lat: number; lng: number };
  city: string;
  address?: string;
  landmark?: string;
};

export const StaticMap = ({ coords, city, address, landmark }: StaticMapProps) => {
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);

  // Vérifier si les coordonnées sont valides
  const hasValidCoords = useMemo(() => {
    if (!coords) return false;
    return coords.lat !== 0 && coords.lng !== 0 &&
      !isNaN(coords.lat) && !isNaN(coords.lng) &&
      coords.lat >= -90 && coords.lat <= 90 &&
      coords.lng >= -180 && coords.lng <= 180;
  }, [coords]);

  const mapsLink = hasValidCoords && coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
    : `https://www.google.com/maps/search/${encodeURIComponent(city + (address ? `, ${address}` : ""))}`;

  // Construire l'URL de la carte avec CartoDB Dark Matter (comme la carte principale)
  useEffect(() => {
    if (!hasValidCoords) {
      setMapUrl(null);
      return;
    }

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

    if (mapboxToken && coords) {
      // Utiliser Mapbox avec style dark (comme la carte principale)
      const mapboxMapUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+3B82F6(${coords.lng},${coords.lat})/${coords.lng},${coords.lat},15/800x400@2x?access_token=${mapboxToken}`;
      setMapUrl(mapboxMapUrl);
    } else if (googleApiKey && coords) {
      // Utiliser Google Maps Static API avec un style sombre
      const googleMapUrl = new URL("https://maps.googleapis.com/maps/api/staticmap");
      googleMapUrl.searchParams.set("center", `${coords.lat},${coords.lng}`);
      googleMapUrl.searchParams.set("zoom", "15");
      googleMapUrl.searchParams.set("size", "800x400");
      googleMapUrl.searchParams.set("scale", "2");
      googleMapUrl.searchParams.set("format", "jpg");
      googleMapUrl.searchParams.set("maptype", "roadmap");

      // Style sombre pour correspondre au thème
      googleMapUrl.searchParams.set(
        "style",
        "feature:all|element:labels|visibility:simplified|feature:poi|visibility:off|feature:road|element:labels|visibility:off|feature:water|color:0x1a1a2e|feature:landscape|color:0x16213e"
      );

      // Marqueur personnalisé
      googleMapUrl.searchParams.set(
        "markers",
        `color:0x3B82F6|size:mid|${coords.lat},${coords.lng}`
      );

      googleMapUrl.searchParams.set("key", googleApiKey);
      setMapUrl(googleMapUrl.toString());
    }
  }, [hasValidCoords, coords]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-6 dark:border-white/10 dark:bg-white/5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-white/50">
            LOCALISATION
          </p>
          <h3 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {city}
          </h3>
          {address && (
            <p className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-white/70">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{address}</span>
            </p>
          )}
          {landmark && (
            <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
              {landmark}
            </p>
          )}
        </div>
        <Button
          variant="secondary"
          className="shrink-0 rounded-2xl border border-gray-200 bg-white text-sm font-medium text-gray-900 hover:bg-gray-100 dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
          asChild
        >
          <a href={mapsLink} target="_blank" rel="noreferrer" className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Ouvrir Maps
          </a>
        </Button>
      </div>

      <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 dark:border-white/10 dark:bg-gray-900">
        {hasValidCoords && mapUrl && !mapError ? (
          <>
            <Image
              src={mapUrl}
              alt={`Carte de ${city}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
              quality={90}
              onError={() => setMapError(true)}
              priority={false}
            />
            {/* Marqueur personnalisé au centre */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/30" />
                <div className="relative h-8 w-8 rounded-full bg-blue-500 shadow-lg ring-2 ring-white dark:ring-gray-900" />
                <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
              </div>
            </div>
            {/* Coordonnées en bas à droite */}
            <div className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-mono text-white/90 backdrop-blur-sm">
              {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 p-6 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 dark:bg-white/10">
              <MapPin className="h-8 w-8 text-gray-400 dark:text-white/30" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 dark:text-white/60">
                {hasValidCoords ? "Carte non disponible" : "Coordonnées non disponibles"}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-white/40">
                {hasValidCoords
                  ? 'Cliquez sur "Ouvrir Maps" pour voir la localisation'
                  : 'Les coordonnées GPS ne sont pas configurées pour ce bien'}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
