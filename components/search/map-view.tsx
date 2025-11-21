"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { PropertyCard } from "@/components/property/property-card";
import { Button } from "@/components/ui/button";
import type { Property } from "@/types/property";

type MapViewProps = {
  properties: Property[];
  showCarousel?: boolean;
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const buildStaticMapUrl = (
  properties: Property[],
  activeId: string | undefined
) => {
  if (!MAPBOX_TOKEN) return null;
  if (!properties.length) return null;

  const center = properties.reduce(
    (acc, property) => {
      acc.lat += property.location.coords.lat;
      acc.lng += property.location.coords.lng;
      return acc;
    },
    { lat: 0, lng: 0 }
  );
  center.lat /= properties.length;
  center.lng /= properties.length;

  const markers = properties
    .slice(0, 10)
    .map((property) => {
      const color = property.id === activeId ? "F2C94C" : "FFFFFF";
      return `pin-s+${color}(${property.location.coords.lng},${property.location.coords.lat})`;
    })
    .join(",");

  return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${markers}/${center.lng},${center.lat},12/900x600@2x?access_token=${MAPBOX_TOKEN}`;
};

export const MapView = ({ properties, showCarousel = true }: MapViewProps) => {
  const [activeId, setActiveId] = useState(properties[0]?.id);
  const [mapEnabled, setMapEnabled] = useState(false);
  const hasProperties = properties.length > 0;

  useEffect(() => {
    const enableBasedOnContext = () => {
      const isMobile =
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 768px)").matches;
      const saveData =
        typeof navigator !== "undefined"
          ? (navigator as Navigator & {
              connection?: { saveData?: boolean };
            }).connection?.saveData
          : undefined;
      setMapEnabled(!isMobile && !saveData);
    };
    enableBasedOnContext();
    if (typeof window !== "undefined") {
      const media = window.matchMedia("(max-width: 768px)");
      const handler = () => enableBasedOnContext();
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }
  }, []);

  const mapUrl = useMemo(
    () => (hasProperties ? buildStaticMapUrl(properties, activeId) : null),
    [properties, activeId, hasProperties]
  );

  if (!hasProperties) {
    return (
      <div className="flex h-[70vh] items-center justify-center rounded-[32px] border border-white/10 bg-white/5 text-white/70">
        Aucun bien ne correspond à ta recherche.
      </div>
    );
  }

  return (
    <div className="relative h-[70vh] w-full overflow-hidden rounded-[32px] border border-white/10 bg-black/20">
      {mapEnabled ? (
        mapUrl ? (
          <Image
            src={mapUrl}
            alt="Carte des biens"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-white/70">
            <p>Ajoute la variable d&apos;env `NEXT_PUBLIC_MAPBOX_TOKEN`.</p>
          </div>
        )
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-white/70">
          <p>Mode économie de données activé sur mobile.</p>
          <Button
            className="rounded-full bg-white px-4 py-2 text-black"
            onClick={() => setMapEnabled(true)}
          >
            Charger la carte
          </Button>
        </div>
      )}
      {showCarousel && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 px-4">
          <div className="pointer-events-auto scrollbar-hide flex gap-3 overflow-x-auto pb-2">
            {properties.map((property) => (
              <div
                key={`mini-${property.id}`}
                onClick={() => setActiveId(property.id)}
                className="min-w-[280px]"
              >
                <PropertyCard
                  property={property}
                  variant="horizontal"
                  className={
                    property.id === activeId
                      ? "border-white/40 bg-white/10"
                      : "border-transparent opacity-70"
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

