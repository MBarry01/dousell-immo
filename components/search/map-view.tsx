"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import type { LatLngExpression, DivIcon } from "leaflet";

import { PropertyCard } from "@/components/property/property-card";
import { Button } from "@/components/ui/button";
import type { Property } from "@/types/property";

// Import dynamique pour éviter les erreurs SSR
const L = typeof window !== "undefined" ? require("leaflet") : null;

// Fix pour les icônes Leaflet avec Next.js
if (typeof window !== "undefined" && L) {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

type MapViewProps = {
  properties: Property[];
  showCarousel?: boolean;
};

// Coordonnées de Dakar par défaut
const DAKAR_CENTER: LatLngExpression = [14.7167, -17.4677];
const DEFAULT_ZOOM = 11;

// Formatage du prix en format court (ex: "1.5M", "500k")
const formatPrice = (price: number): string => {
  if (price >= 1_000_000) {
    const millions = price / 1_000_000;
    return `${millions % 1 === 0 ? millions : millions.toFixed(1)}M`;
  }
  if (price >= 1_000) {
    const thousands = price / 1_000;
    return `${thousands % 1 === 0 ? thousands : thousands.toFixed(1)}k`;
  }
  return price.toString();
};

// Composant pour centrer la carte automatiquement
const MapCenter = ({ center, zoom }: { center: LatLngExpression; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
};

// Composant de marqueur personnalisé avec prix
const PriceMarker = ({
  property,
  isActive,
  onClick,
  onRedirect,
}: {
  property: Property;
  isActive: boolean;
  onClick: () => void;
  onRedirect: () => void;
}) => {
  const position: LatLngExpression = [
    property.location.coords.lat,
    property.location.coords.lng,
  ];

  // Créer une icône HTML personnalisée pour le prix
  const icon = useMemo(() => {
    if (typeof window === "undefined" || !L) return undefined;

    const priceText = formatPrice(property.price);
    const isActiveClass = isActive ? "scale-110 bg-black text-white z-50" : "bg-white text-black";
    
    return L.divIcon({
      className: "custom-price-marker",
      html: `
        <div class="price-pill ${isActiveClass} inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-bold shadow-md transition-all duration-200 cursor-pointer" style="font-size: 12px; min-width: 50px; white-space: nowrap;">
          ${priceText}
        </div>
      `,
      iconSize: [80, 28],
      iconAnchor: [40, 14],
      popupAnchor: [0, -14],
    }) as DivIcon;
  }, [property.price, isActive]);

  if (!icon) return null;

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{
        click: (e) => {
          // Simple clic : faire défiler vers la carte dans le carousel
          onClick();
        },
        mouseover: (e) => {
          const target = e.target;
          const element = target?.getElement();
          if (element) {
            const pill = element.querySelector(".price-pill");
            if (pill && !isActive) {
              pill.classList.remove("bg-white", "text-black");
              pill.classList.add("bg-black", "text-white", "scale-105");
            }
          }
        },
        mouseout: (e) => {
          const target = e.target;
          const element = target?.getElement();
          if (element) {
            const pill = element.querySelector(".price-pill");
            if (pill && !isActive) {
              pill.classList.remove("bg-black", "text-white", "scale-105");
              pill.classList.add("bg-white", "text-black");
            }
          }
        },
      }}
    />
  );
};

export const MapView = ({ properties, showCarousel = true }: MapViewProps) => {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | undefined>(properties[0]?.id);
  const [mapEnabled, setMapEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Filtrer les propriétés qui ont des coordonnées valides
  const propertiesWithCoords = useMemo(
    () =>
      properties.filter(
        (p) =>
          p.location?.coords &&
          p.location.coords.lat !== 0 &&
          p.location.coords.lng !== 0
      ),
    [properties]
  );

  // Calculer le centre de la carte (moyenne des coordonnées ou Dakar par défaut)
  const mapCenter = useMemo<LatLngExpression>(() => {
    if (propertiesWithCoords.length === 0) return DAKAR_CENTER;

    const center = propertiesWithCoords.reduce(
      (acc, property) => {
        acc.lat += property.location.coords.lat;
        acc.lng += property.location.coords.lng;
        return acc;
      },
      { lat: 0, lng: 0 }
    );
    center.lat /= propertiesWithCoords.length;
    center.lng /= propertiesWithCoords.length;

    return [center.lat, center.lng];
  }, [propertiesWithCoords]);

  // Gestion du montage côté client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Gestion de l'activation de la carte selon le contexte
  useEffect(() => {
    if (typeof window === "undefined") return;

    const enableBasedOnContext = () => {
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      const saveData =
        typeof navigator !== "undefined"
          ? (navigator as Navigator & {
              connection?: { saveData?: boolean };
            }).connection?.saveData
          : undefined;
      // Sur desktop, activer par défaut. Sur mobile, permettre l'activation manuelle
      setMapEnabled(!isMobile && !saveData);
    };

    enableBasedOnContext();

    const media = window.matchMedia("(max-width: 768px)");
    const handler = () => enableBasedOnContext();
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  const handleMarkerClick = useCallback((propertyId: string) => {
    setActiveId(propertyId);
    // Scroll vers la carte correspondante dans le carousel
    setTimeout(() => {
      const element = document.getElementById(`property-${propertyId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }, 100);
  }, []);

  const handleMarkerRedirect = useCallback((propertyId: string) => {
    // Rediriger vers la page de détail du bien
    router.push(`/biens/${propertyId}`);
  }, [router]);

  if (!mounted) {
    return (
      <div className="flex h-[70vh] items-center justify-center rounded-[32px] border border-white/10 bg-white/5 text-white/70">
        Chargement de la carte…
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="flex h-[70vh] items-center justify-center rounded-[32px] border border-white/10 bg-white/5 text-white/70">
        Aucun bien ne correspond à ta recherche.
      </div>
    );
  }

  if (propertiesWithCoords.length === 0) {
    return (
      <div className="flex h-[70vh] items-center justify-center rounded-[32px] border border-white/10 bg-white/5 text-white/70">
        <div className="text-center">
          <p className="mb-2">Aucune coordonnée disponible pour afficher la carte.</p>
          <p className="text-sm text-white/50">
            Les biens n&apos;ont pas de localisation géographique.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[70vh] w-full overflow-hidden rounded-[32px] border border-white/10 bg-black/20">
      {mapEnabled ? (
        <MapContainer
          center={mapCenter}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={false} // Désactiver le zoom molette pour ne pas gêner le scroll
          className="h-full w-full rounded-[32px] z-0"
          zoomControl={true}
          attributionControl={true}
        >
          {/* TileLayer CartoDB Dark Matter */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={19}
          />

          {/* Centrer la carte */}
          <MapCenter center={mapCenter} zoom={DEFAULT_ZOOM} />

          {/* Marqueurs avec prix */}
          {propertiesWithCoords.map((property) => (
            <PriceMarker
              key={property.id}
              property={property}
              isActive={property.id === activeId}
              onClick={() => handleMarkerClick(property.id)}
              onRedirect={() => handleMarkerRedirect(property.id)}
            />
          ))}
        </MapContainer>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-white/70">
          <p>Mode économie de données activé sur mobile.</p>
          <Button
            className="rounded-full bg-white px-4 py-2 text-black hover:bg-white/90"
            onClick={() => setMapEnabled(true)}
          >
            Charger la carte
          </Button>
        </div>
      )}

      {/* Carousel des biens en bas */}
      {showCarousel && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 px-4 z-10">
          <div className="pointer-events-auto scrollbar-hide flex gap-3 overflow-x-auto pb-2">
            {propertiesWithCoords.map((property) => (
              <div
                key={`mini-${property.id}`}
                id={`property-${property.id}`}
                onClick={() => {
                  // Rediriger vers la page de détail du bien
                  handleMarkerRedirect(property.id);
                }}
                className="min-w-[280px] cursor-pointer"
              >
                <PropertyCard
                  property={property}
                  variant="horizontal"
                  className={
                    property.id === activeId
                      ? "border-white/40 bg-white/10"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Styles CSS pour la carte Leaflet */}
      <style jsx global>{`
        .leaflet-container {
          background: #1a1a1a;
        }
        .custom-price-marker {
          background: transparent !important;
          border: none !important;
        }
        .price-pill {
          user-select: none;
          pointer-events: none;
        }
        .leaflet-control-zoom {
          border: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        .leaflet-control-zoom a {
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .leaflet-control-zoom a:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        .leaflet-control-attribution {
          background-color: rgba(0, 0, 0, 0.5);
          color: rgba(255, 255, 255, 0.7);
          font-size: 10px;
        }
        .leaflet-control-attribution a {
          color: rgba(255, 255, 255, 0.8);
        }
      `}</style>
    </div>
  );
};
