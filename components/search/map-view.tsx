"use client";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import { useEffect, useMemo, useState, useCallback, memo, useRef } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, useMap, ZoomControl } from "react-leaflet";
import type { LatLngExpression, DivIcon } from "leaflet";

import { PropertyCard } from "@/components/property/property-card";
import { Button } from "@/components/ui/button";
import type { Property } from "@/types/property";

// Import dynamique pour éviter les erreurs SSR
// eslint-disable-next-line @typescript-eslint/no-require-imports
const L = typeof window !== "undefined" ? require("leaflet") : null;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MarkerClusterGroup = typeof window !== "undefined" ? require("leaflet.markercluster") : null;

// Offset vertical pour remonter les marqueurs au-dessus du carousel
const LATITUDE_OFFSET = -0.6; // Décalage vers le sud

// Fix pour les icônes Leaflet avec Next.js
if (typeof window !== "undefined" && L) {
    delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });
}

type MapViewProps = {
    properties: Property[];
    showCarousel?: boolean;
    onClose?: () => void;
    searchQuery?: string;
    onSearchChange?: (value: string) => void;
    embedded?: boolean;
};

// Coordonnées de Dakar par défaut
const DAKAR_CENTER: LatLngExpression = [14.5, -10];
const DEFAULT_ZOOM = 7.6;
const MOBILE_ZOOM = 7; // Zoom plus reculé sur mobile

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

// Composant de clustering pour les marqueurs
const MarkerCluster = ({ children }: { children: React.ReactNode }) => {
    const map = useMap();

    useEffect(() => {
        if (!L || !MarkerClusterGroup) return;

        // Créer un groupe de clusters avec une configuration optimisée
        const cluster = new L.MarkerClusterGroup({
            maxClusterRadius: 60, // Rayon de clustering réduit pour plus de précision
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            disableClusteringAtZoom: 17, // Désactiver le clustering en très gros zoom
            iconCreateFunction: (cluster: { getChildCount: () => number }) => {
                const count = cluster.getChildCount();
                let size = "small";
                let className = "marker-cluster-small";

                if (count > 10) {
                    size = "medium";
                    className = "marker-cluster-medium";
                }
                if (count > 20) {
                    size = "large";
                    className = "marker-cluster-large";
                }

                return L.divIcon({
                    html: `<div class="cluster-pill ${className}"><span>${count}</span></div>`,
                    className: "custom-cluster-icon",
                    iconSize: L.point(50, 50),
                });
            },
        });

        map.addLayer(cluster);

        return () => {
            map.removeLayer(cluster);
        };
    }, [map]);

    return null;
};

// Composant de marqueur personnalisé avec prix - Optimisé avec memo
const PriceMarker = memo(({
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
    const position: LatLngExpression = useMemo(() => [
        property.location.coords.lat,
        property.location.coords.lng,
    ], [property.location.coords.lat, property.location.coords.lng]);

    // Créer une icône HTML personnalisée pour le prix
    const icon = useMemo(() => {
        if (typeof window === "undefined" || !L) return undefined;

        const priceText = formatPrice(property.price);
        const isVerified = property.verification_status === "verified";

        // Style doré pour les biens vérifiés
        const verifiedClass = isVerified
            ? "bg-[#F4C430] text-black border-2 border-white shadow-[0_0_15px_rgba(244,196,48,0.5)]"
            : "bg-primary text-primary-foreground";

        // Style actif (cliqué) - sans scale CSS, on gère la taille via iconSize
        const activeClass = isActive
            ? "bg-white text-black z-50 border-white border-2 animate-bounce-subtle"
            : verifiedClass;

        // Z-index supérieur pour les biens vérifiés
        const zIndex = isActive ? 1000 : (isVerified ? 100 : 1);

        // Tailles adaptées : actif + vérifié = encore plus large pour le badge
        const iconWidth = isActive
            ? (isVerified ? 160 : 100)  // Actif: vérifié 160px, normal 100px
            : (isVerified ? 90 : 80);   // Inactif: vérifié 90px, normal 80px
        const iconHeight = isActive ? 36 : 28;
        const fontSize = isActive ? 14 : 12;

        return L.divIcon({
            className: "custom-price-marker",
            html: `
        <div class="price-pill ${activeClass} inline-flex items-center justify-center rounded-full px-3 py-1.5 font-bold shadow-md transition-all duration-200 cursor-pointer" style="font-size: ${fontSize}px; min-width: 50px; white-space: nowrap; z-index: ${zIndex};">
          ${isVerified ? `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#F4C430" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="min-width: 14px; margin-right: 4px;">
              <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.78 4.78 4 4 0 0 1-6.74 0 4 4 0 0 1-4.78-4.78Z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          ` : ''}${priceText}
        </div>
      `,
            iconSize: [iconWidth, iconHeight],
            iconAnchor: [iconWidth / 2, iconHeight / 2],
            popupAnchor: [0, -iconHeight / 2],
        }) as DivIcon;
    }, [property.price, property.verification_status, isActive]);

    if (!icon) return null;

    return (
        <Marker
            position={position}
            icon={icon}
            zIndexOffset={isActive ? 1000 : (property.verification_status === "verified" ? 100 : 0)}
            eventHandlers={{
                click: () => {
                    onClick();
                },
                mouseover: (e) => {
                    const target = e.target;
                    const element = target?.getElement();
                    if (element) {
                        const pill = element.querySelector(".price-pill");
                        if (pill && !isActive) {
                            const currentBg = property.verification_status === "verified" ? "bg-[#F4C430]" : "bg-primary";
                            const currentText = property.verification_status === "verified" ? "text-black" : "text-primary-foreground";
                            pill.classList.remove(currentBg, currentText);
                            pill.classList.add("bg-white", "text-black", "scale-105");
                        }
                    }
                },
                mouseout: (e) => {
                    const target = e.target;
                    const element = target?.getElement();
                    if (element) {
                        const pill = element.querySelector(".price-pill");
                        if (pill && !isActive) {
                            pill.classList.remove("bg-white", "text-black", "scale-105");
                            if (property.verification_status === "verified") {
                                pill.classList.add("bg-[#F4C430]", "text-black");
                            } else {
                                pill.classList.add("bg-primary", "text-primary-foreground");
                            }
                        }
                    }
                },
            }}
        />
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.property.id === nextProps.property.id &&
        prevProps.isActive === nextProps.isActive &&
        prevProps.property.price === nextProps.property.price &&
        prevProps.property.verification_status === nextProps.property.verification_status
    );
});

export const MapView = ({ properties, showCarousel = true, onClose, searchQuery = "", onSearchChange, embedded = false }: MapViewProps) => {
    const router = useRouter();
    const [activeId, setActiveId] = useState<string | undefined>(properties[0]?.id);
    const [mapEnabled, setMapEnabled] = useState(true);
    const [mounted, setMounted] = useState(false); // Fix hydration mismatch
    const [visibleCount, setVisibleCount] = useState(15); // Pagination du carousel
    const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);
    const [longitudeOffset, setLongitudeOffset] = useState(2);
    const carouselRef = useRef<HTMLDivElement>(null); // Ref pour le scroll detection
    const initialCenterDone = useRef(false); // Ref pour le centrage initial

    // Filtrer les propriétés qui ont des coordonnées valides
    const propertiesWithCoords = useMemo(
        () => {
            const valid = properties.filter(
                (p) =>
                    p.location?.coords &&
                    p.location.coords.lat !== 0 &&
                    p.location.coords.lng !== 0
            );
            return valid;
        },
        [properties]
    );

    // Calculer le centre de la carte (moyenne des coordonnées ou Dakar par défaut)
    // Offset vertical déplacé en dehors du composant
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

        // Appliquer les offsets
        return [center.lat + LATITUDE_OFFSET, center.lng + longitudeOffset];
    }, [propertiesWithCoords, longitudeOffset]);

    // Gestion de l'activation de la carte selon le contexte
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
        // Initial check
        if (media.matches) {
            setZoomLevel(MOBILE_ZOOM);
            setLongitudeOffset(0.5); // Moins de décalage sur mobile
        } else {
            setZoomLevel(DEFAULT_ZOOM);
            setLongitudeOffset(2);
        }

        const handler = () => {
            enableBasedOnContext();
            if (media.matches) {
                setZoomLevel(MOBILE_ZOOM);
                setLongitudeOffset(0.5);
            } else {
                setZoomLevel(DEFAULT_ZOOM);
                setLongitudeOffset(2);
            }
        };

        media.addEventListener("change", handler);
        return () => media.removeEventListener("change", handler);
    }, []);

    useEffect(() => {
        setTimeout(() => setMounted(true), 0);
    }, []);

    // Effet pour centrer la carte active au chargement
    useEffect(() => {
        if (mounted && activeId && !initialCenterDone.current && carouselRef.current) {
            // Petit délai pour laisser le temps au rendu
            setTimeout(() => {
                const element = document.getElementById(`property-${activeId}`);
                if (element) {
                    element.scrollIntoView({ behavior: "auto", block: "nearest", inline: "start" });
                    initialCenterDone.current = true;
                }
            }, 100);
        }
    }, [mounted, activeId]);

    const handleMarkerClick = useCallback((propertyId: string) => {
        setActiveId(propertyId);

        // Si la propriété n'est pas encore visible dans le carousel, augmenter la limite pour l'inclure
        const index = propertiesWithCoords.findIndex(p => p.id === propertyId);
        if (index >= visibleCount) {
            setVisibleCount(prev => Math.max(prev, index + 5)); // +5 de marge
        }

        // Scroll vers la carte correspondante dans le carousel
        setTimeout(() => {
            const element = document.getElementById(`property-${propertyId}`);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
            }
        }, 100);
    }, []);

    const handleMarkerRedirect = useCallback((property: Property) => {
        // Pour les annonces externes, naviguer vers la page teaser interne
        if (property.isExternal) {
            router.push(`/biens/ext/${property.id}`);
        } else {
            // Rediriger vers la page de détail du bien
            router.push(`/biens/${property.id}`);
        }
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
        <div className={embedded
            ? "relative w-full h-[300px] overflow-hidden bg-zinc-900 rounded-[28px]"
            : "fixed inset-0 z-[9999] w-full overflow-hidden bg-black"
        }>
            {/* Barre de recherche discrète + bouton fermer sur mobile - Uniquement si non embedded */}
            {!embedded && onClose && (
                <div className="absolute top-[calc(1rem+env(safe-area-inset-top))] left-14 right-4 z-50 flex items-center gap-2">
                    {/* ... (search bar content) ... */}
                    <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-full bg-black/80 backdrop-blur-sm border border-white/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Ville ou code postal"
                            value={searchQuery}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/50 border-none outline-none"
                        />
                    </div>
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-black/80 backdrop-blur-sm border border-white/20 text-white shadow-lg hover:bg-black transition-colors"
                        aria-label="Fermer la carte"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
            {mapEnabled ? (
                <MapContainer
                    center={mapCenter}
                    zoom={zoomLevel}
                    scrollWheelZoom={false} // Désactiver le zoom molette pour ne pas gêner le scroll page
                    className="h-full w-full rounded-[32px] z-0"
                    style={{ height: "100%", width: "100%", zIndex: 0 }}
                    zoomControl={false}
                    attributionControl={false}
                >
                    <ZoomControl position="topleft" />
                    {/* TileLayer CartoDB Dark Matter */}
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        subdomains="abcd"
                        maxZoom={19}
                    />

                    {/* Centrer la carte */}
                    <MapCenter center={mapCenter} zoom={zoomLevel} />

                    {/* Marqueurs avec prix */}
                    {propertiesWithCoords.map((property) => (
                        <PriceMarker
                            key={property.id}
                            property={property}
                            isActive={property.id === activeId}
                            onClick={() => handleMarkerClick(property.id)}
                            onRedirect={() => handleMarkerRedirect(property)}
                        />
                    ))}
                </MapContainer>
            ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-white/70">
                    <p>Mode économie de données activé sur mobile.</p>
                    <Button
                        className="rounded-full px-4 py-2 hover:bg-primary/90"
                        onClick={() => {
                            console.log("🔄 Activation manuelle de la carte");
                            setMapEnabled(true);
                        }}
                    >
                        Charger la carte
                    </Button>
                </div>
            )}

            {/* Carousel des biens en bas - Optimisé: affiche seulement les 10 premiers + actif */}
            {showCarousel && propertiesWithCoords.length > 0 && (
                <div className="pointer-events-none absolute inset-x-0 bottom-4 px-4 z-10">
                    <div
                        ref={carouselRef}
                        onScroll={(e) => {
                            const container = e.currentTarget;
                            // Point de focalisation à gauche (avec une marge)
                            const focusPoint = container.scrollLeft + 50;

                            // Trouver la carte la plus proche du début (gauche)
                            const cards = Array.from(container.children);
                            let closestId = null;
                            let minDistance = Infinity;

                            cards.forEach((card) => {
                                if (card.id.startsWith("property-")) {
                                    // Distance entre le début de la carte et le point focal
                                    const cardStart = (card as HTMLElement).offsetLeft;
                                    const distance = Math.abs(cardStart - focusPoint);
                                    if (distance < minDistance) {
                                        minDistance = distance;
                                        closestId = card.id.replace("property-", "");
                                    }
                                }
                            });

                            if (closestId && closestId !== activeId) {
                                // Mettre à jour l'ID actif sans scroller (car on scrolle déjà)
                                setActiveId(closestId);
                            }
                        }}
                        className="pointer-events-auto scrollbar-hide flex gap-3 overflow-x-auto pb-2 relative snap-x snap-mandatory scroll-smooth"
                    >
                        {propertiesWithCoords.slice(0, visibleCount).map((property) => (
                            <div
                                key={`mini-${property.id}`}
                                id={`property-${property.id}`}
                                onClick={() => {
                                    handleMarkerRedirect(property);
                                }}
                                className="min-w-[280px] cursor-pointer flex-shrink-0 snap-start"
                            >
                                <PropertyCard
                                    property={property}
                                    variant="horizontal"
                                    className={
                                        property.id === activeId
                                            ? "bg-[#F4C430]/15 border-[#F4C430] shadow-[0_0_15px_rgba(244,196,48,0.15)] transition-all duration-300"
                                            : "bg-neutral-900/60 backdrop-blur-md border border-white/10 hover:bg-neutral-900/80 transition-all duration-300"
                                    }
                                />
                            </div>
                        ))}
                        {propertiesWithCoords.length > visibleCount && (
                            <div
                                onClick={() => setVisibleCount(prev => prev + 15)}
                                className="min-w-[280px] flex-shrink-0 flex flex-col items-center justify-center rounded-[28px] border border-white/10 bg-white/5 p-6 text-center text-white/70 cursor-pointer hover:bg-white/10 transition-colors snap-center"
                            >
                                <p className="text-lg font-bold mb-1">Voir plus</p>
                                <p className="text-sm">+{propertiesWithCoords.length - visibleCount} autres biens</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Styles CSS pour la carte Leaflet */}
            <style jsx global>{`
        .leaflet-container {
          background: #1a1a1a;
        }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0) scale(1.25); }
          50% { transform: translateY(-10px) scale(1.25); }
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 2s infinite;
        }
        .custom-price-marker {
          background: transparent !important;
          border: none !important;
          overflow: visible !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .leaflet-marker-icon {
          overflow: visible !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .price-pill {
          user-select: none;
          pointer-events: none;
        }
        .leaflet-control-zoom {
          border: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          margin-top: calc(4rem + env(safe-area-inset-top, 0px) + 8px) !important; /* Sous le header + status bar PWA */
          margin-left: calc(12px + env(safe-area-inset-left, 0px)) !important; /* Marge gauche safe */
        }
        .leaflet-control-zoom a {
          background-color: rgba(20, 20, 20, 0.9); /* Fond plus sombre pour le contraste */
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
        }
        .leaflet-control-zoom a:hover {
          background-color: rgba(40, 40, 40, 0.9);
        }
        .leaflet-control-attribution {
          background-color: rgba(0, 0, 0, 0.5);
          color: rgba(255, 255, 255, 0.7);
          font-size: 10px;
        }
        .leaflet-control-attribution a {
          color: rgba(255, 255, 255, 0.8);
        }
        /* Styles pour les clusters */
        .custom-cluster-icon {
          background: transparent !important;
          border: none !important;
        }
        .cluster-pill {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          font-weight: bold;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
        }
        .cluster-pill:hover {
          transform: scale(1.1);
        }
        .marker-cluster-small {
          background: linear-gradient(135deg, #F4C430 0%, #D4A028 100%);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        .marker-cluster-medium {
          background: linear-gradient(135deg, #D4A028 0%, #B48820 100%);
          border: 2px solid rgba(255, 255, 255, 0.4);
          width: 60px;
          height: 60px;
        }
        .marker-cluster-large {
          background: linear-gradient(135deg, #B48820 0%, #947018 100%);
          border: 2px solid rgba(255, 255, 255, 0.5);
          width: 70px;
          height: 70px;
          font-size: 18px;
        }
      `}</style>
        </div>
    );
};
