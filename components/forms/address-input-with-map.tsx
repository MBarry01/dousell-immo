"use client";

import { useState, useEffect } from "react";
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

interface AddressDetails {
  city?: string;
  district?: string;
  road?: string;
  postcode?: string;
}

interface AddressInputWithMapProps {
  register: UseFormRegisterReturn;
  error?: string;
  onLocationSelect?: (lat: number, lng: number) => void;
  onAddressFound?: (details: AddressDetails) => void;
  setValue?: UseFormSetValue<Record<string, unknown>>;
  className?: string;
  currentAddress?: string;
  city?: string;
  district?: string;
}

/**
 * Input d'adresse avec bouton "Choisir sur la carte"
 * Le bouton est positionné à l'intérieur de l'input, à droite
 */
export function AddressInputWithMap({
  register,
  error,
  onLocationSelect,
  onAddressFound,
  setValue,
  className,
  currentAddress,
  city,
  district,
}: AddressInputWithMapProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(
    null
  );
  // Pour suivre si l'adresse actuelle vient de la carte ou d'une saisie manuelle
  const [lastAddressFromMap, setLastAddressFromMap] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Si l'adresse change et qu'elle ne correspond pas à la dernière adresse sélectionnée sur la carte,
  // on réinitialise la position pour forcer un nouveau géocodage à l'ouverture de la carte.
  useEffect(() => {
    if (currentAddress && currentAddress !== lastAddressFromMap) {
      setSelectedPosition(null);
    }
  }, [currentAddress, lastAddressFromMap]);

  const handleLocationSelect = async (lat: number, lng: number) => {
    if (typeof window === "undefined") return;

    setIsGeocoding(true);
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
        console.log("📍 Adresse complète reçue:", address);

        // Construire une adresse COMPLÈTE avec rue, village, ville, région
        const addressParts: string[] = [];

        // 1. Partie détaillée : Numéro + Rue OU Lieu-dit/Village
        const detailedPart: string[] = [];
        if (address.house_number) detailedPart.push(address.house_number);
        if (address.road) detailedPart.push(address.road);

        // Si pas de rue, utiliser le lieu-dit le plus spécifique
        if (detailedPart.length === 0) {
          if (address.hamlet) detailedPart.push(address.hamlet);
          else if (address.village) detailedPart.push(address.village);
          else if (address.suburb) detailedPart.push(address.suburb);
          else if (address.neighbourhood) detailedPart.push(address.neighbourhood);
        }

        if (detailedPart.length > 0) {
          addressParts.push(detailedPart.join(" "));
        }

        // 2. Ajouter la ville/commune (si différente du lieu-dit déjà ajouté)
        const cityName = address.city || address.town || address.municipality;
        if (cityName && !detailedPart.includes(cityName)) {
          addressParts.push(cityName);
        }

        // 3. Ajouter la région administrative
        const regionName = address.state_district || address.region || address.state;
        if (regionName && regionName !== cityName) {
          addressParts.push(regionName);
        }

        // 4. Construire l'adresse complète
        let formattedAddress = addressParts.join(", ");

        // Fallback ultime si toujours vide
        if (!formattedAddress && data.display_name) {
          formattedAddress = data.display_name.split(", Sénégal")[0]; // Enlever juste "Sénégal" à la fin
        }

        // Mettre à jour le champ input (via react-hook-form)
        // On met à jour même si c'est vide pour refléter la sélection (ou l'absence de résultat)
        if (setValue) {
          setValue(register.name, formattedAddress, { shouldValidate: true });
          // Marquer cette adresse comme venant de la carte
          setLastAddressFromMap(formattedAddress);
        }

        // Extraire les détails pour l'autocomplétion
        if (onAddressFound) {
          // Logique pour la Région (Administrative Region)
          // Pour le Sénégal, on cherche la vraie région administrative (Dakar, Thiès, Diourbel, etc.)
          // Priorité : state_district (région administrative) > state (peut être une communauté rurale)
          const city = address.region || address.state || address.province;

          // Logique pour le Quartier (District/Locality)
          // C'est ici qu'on veut la ville, le village, le quartier, ou la communauté rurale
          const district =
            address.town ||           // Ville (ex: Bambey)
            address.city ||           // Ville principale
            address.village ||        // Village
            address.municipality ||   // Municipalité
            address.hamlet ||         // Hameau
            address.suburb ||         // Banlieue/Quartier
            address.neighbourhood ||  // Voisinage
            address.quarter ||        // Quartier
            address.state_district;   // Département en dernier recours

          onAddressFound({
            city,
            district,
            road: address.road,
            postcode: address.postcode
          });
        }
      }
    } catch (error) {
      console.warn("Reverse geocoding échoué, mais la position est enregistrée:", error);
    } finally {
      setIsGeocoding(false);
      setIsDialogOpen(false);
    }
  };

  // Construire l'adresse complète pour le géocodage initial
  // On combine l'adresse saisie, le quartier et la ville pour plus de précision
  const fullAddress = [currentAddress, district, city].filter(Boolean).join(", ");

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
        initialAddress={fullAddress}
        isLoading={isGeocoding}
      />
    </>
  );
}

