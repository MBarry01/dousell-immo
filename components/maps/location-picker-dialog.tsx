"use client";

import "leaflet/dist/leaflet.css";

import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { MapPin } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Import dynamique pour éviter les erreurs SSR
const L = typeof window !== "undefined" ? require("leaflet") : null;

// Fix pour les icônes Leaflet avec Next.js
if (typeof window !== "undefined" && L) {
  delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

// Coordonnées de Dakar par défaut
const DAKAR_CENTER: LatLngExpression = [14.7167, -17.4677];
const DEFAULT_ZOOM = 12;

interface LocationPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationSelect: (lat: number, lng: number) => void;
  initialPosition?: { lat: number; lng: number } | null;
  initialAddress?: string;
  isLoading?: boolean;
}

/**
 * Composant interne pour gérer les clics sur la carte
 */
function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    },
  });
  return null;
}

/**
 * Composant interne pour centrer la carte sur une position
 */
function MapCenter({ center, zoom }: { center: LatLngExpression; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

export function LocationPickerDialog({
  open,
  onOpenChange,
  onLocationSelect,
  initialPosition,
  initialAddress,
  isLoading = false,
}: LocationPickerDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<LatLngExpression>(
    initialPosition ? [initialPosition.lat, initialPosition.lng] : DAKAR_CENTER
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialPosition) {
      setSelectedPosition([initialPosition.lat, initialPosition.lng]);
    } else if (open && initialAddress && !initialPosition) {
      // Si pas de position initiale mais une adresse, on essaie de géocoder
      const geocodeAddress = async () => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              initialAddress
            )}&limit=1`,
            {
              headers: {
                "User-Agent": "Doussel-Immo-App/1.0",
              },
            }
          );
          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              const lat = parseFloat(data[0].lat);
              const lon = parseFloat(data[0].lon);
              setSelectedPosition([lat, lon]);
            }
          }
        } catch (error) {
          console.warn("Geocoding failed for initial address:", error);
        }
      };
      geocodeAddress();
    }
  }, [initialPosition, initialAddress, open]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setSelectedPosition([lat, lng]);
  }, []);

  const handleConfirm = useCallback(() => {
    const [lat, lng] = selectedPosition as [number, number];
    onLocationSelect(lat, lng);
    // On ne ferme plus le dialog ici, c'est le parent qui le fera après le chargement
    // onOpenChange(false); 
  }, [selectedPosition, onLocationSelect]);

  if (!mounted) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0 bg-[#0b0f18] border-white/10">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-white text-xl font-semibold">
            Choisir la localisation sur la carte
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Cliquez sur la carte pour placer le marqueur, puis confirmez votre choix
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 relative min-h-0">
          {mounted && (
            <MapContainer
              center={selectedPosition}
              zoom={DEFAULT_ZOOM}
              scrollWheelZoom={true}
              className="h-full w-full z-0"
              zoomControl={true}
              attributionControl={true}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                subdomains="abcd"
                maxZoom={19}
              />
              <MapCenter center={selectedPosition} zoom={DEFAULT_ZOOM} />
              <MapClickHandler onMapClick={handleMapClick} />
              <Marker position={selectedPosition} />
            </MapContainer>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <MapPin className="h-4 w-4" />
            <span>
              {Array.isArray(selectedPosition) &&
                typeof selectedPosition[0] === "number" &&
                typeof selectedPosition[1] === "number"
                ? `${selectedPosition[0].toFixed(6)}, ${selectedPosition[1].toFixed(6)}`
                : "Position non définie"}
            </span>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              className="bg-white/5 text-white border-white/10 hover:bg-white/10"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className="bg-amber-500 text-black hover:bg-amber-400"
            >
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  Chargement...
                </>
              ) : (
                "Confirmer la position"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

