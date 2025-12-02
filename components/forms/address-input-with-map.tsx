"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import type { UseFormRegisterReturn, UseFormSetValue } from "react-hook-form";

import { Input } from "@/components/ui/input";

// Import dynamique pour éviter les erreurs SSR avec Leaflet
const LocationPickerDialog = dynamic(
  () => import("@/components/maps/location-picker-dialog").then((mod) => mod.LocationPickerDialog),
  {
    ssr: false,
    loading: () => null, // Pas de loading car le Dialog gère son propre état
  }
);

interface AddressInputWithMapProps {
  register: UseFormRegisterReturn;
  error?: string;
  onLocationSelect?: (lat: number, lng: number) => void;
  setValue?: UseFormSetValue<any>;
  className?: string;
}

/**
 * Input d'adresse avec bouton "Choisir sur la carte"
 * Le bouton est positionné à l'intérieur de l'input, à droite
 */
export function AddressInputWithMap({
  register,
  error,
  onLocationSelect,
  setValue,
  className,
}: AddressInputWithMapProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(
    null
  );

  const handleLocationSelect = async (lat: number, lng: number) => {
    if (typeof window === "undefined") return;
    
    setSelectedPosition({ lat, lng });
    
    // Optionnel : Reverse geocoding pour remplir l'adresse si vide
    if (onLocationSelect) {
      onLocationSelect(lat, lng);
    }

    // Reverse geocoding via Nominatim pour obtenir l'adresse
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "Doussel-Immo-App/1.0",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const address = data.address;
        
        // Construire une adresse lisible
        const addressParts: string[] = [];
        if (address.road) addressParts.push(address.road);
        if (address.house_number) addressParts.push(address.house_number);
        if (addressParts.length === 0 && address.suburb) addressParts.push(address.suburb);
        if (addressParts.length === 0 && address.neighbourhood) addressParts.push(address.neighbourhood);
        
        const formattedAddress = addressParts.join(", ");
        
        // Mettre à jour le champ input si vide (via react-hook-form)
        if (setValue && formattedAddress) {
          const inputElement = document.querySelector(`input[name="${register.name}"]`) as HTMLInputElement;
          if (inputElement && !inputElement.value.trim()) {
            setValue(register.name, formattedAddress, { shouldValidate: true });
          }
        }
      }
    } catch (error) {
      console.warn("Reverse geocoding échoué, mais la position est enregistrée:", error);
    }

    setIsDialogOpen(false);
  };

  return (
    <>
      <div className="relative">
        <Input
          {...register}
          className={`${className || ""} pr-12`}
          style={{ fontSize: "16px" }}
        />
        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors flex items-center justify-center"
          aria-label="Choisir sur la carte"
        >
          <MapPin className="h-4 w-4" />
        </button>
        {error && (
          <p className="mt-1 text-sm text-amber-300">{error}</p>
        )}
      </div>

      <LocationPickerDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onLocationSelect={handleLocationSelect}
        initialPosition={selectedPosition}
      />
    </>
  );
}

