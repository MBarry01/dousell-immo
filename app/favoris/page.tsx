"use client";

import Link from "next/link";

import { PropertyCard } from "@/components/property/property-card";
import { Button } from "@/components/ui/button";
import { useFavoritesStore } from "@/store/use-store";

export default function FavoritesPage() {
  const { favorites } = useFavoritesStore();

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Wishlist
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Favoris sauvegardés
          </h1>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-10 text-center text-white/70">
          <p className="text-lg font-semibold text-white">
            Votre wishlist est vide
          </p>
          <p className="mt-2">
            Ajoutez des biens à vos favoris pour les retrouver facilement.
          </p>
          <Button asChild className="mt-6 rounded-full bg-white text-black">
            <Link href="/recherche">Explorer les biens</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [&>*]:w-full">
          {favorites.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}

