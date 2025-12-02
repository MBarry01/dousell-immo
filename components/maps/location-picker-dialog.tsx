"use client";

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
  delete (L.Icon.Default.prototype as any)._getIconUrl;
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
}: LocationPickerDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<LatLngExpression>(
    initialPosition ? [initialPosition.lat, initialPosition.lng] : DAKAR_CENTER
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialPosition) {
      setSelectedPosition([initialPosition.lat, initialPosition.lng]);
    }
  }, [initialPosition]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setSelectedPosition([lat, lng]);
  }, []);

  const handleConfirm = useCallback(() => {
    const [lat, lng] = selectedPosition as [number, number];
    onLocationSelect(lat, lng);
    onOpenChange(false);
  }, [selectedPosition, onLocationSelect, onOpenChange]);

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
              {isLoading ? "Confirmation..." : "Confirmer la position"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

