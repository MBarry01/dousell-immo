"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterDrawer } from "@/components/search/filter-drawer";
import type { PropertyFilters } from "@/services/propertyService";

export const QuickSearch = () => {
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [location, setLocation] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minSurface, setMinSurface] = useState<string>("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Construire les paramètres URL
    const params = new URLSearchParams();
    
    if (location.trim()) {
      params.set("q", location.trim());
    }
    if (maxPrice.trim()) {
      params.set("maxPrice", maxPrice.trim());
    }
    if (minSurface.trim()) {
      params.set("minSurface", minSurface.trim());
    }
    
    // Rediriger vers la page de recherche avec les filtres
    router.push(`/recherche?${params.toString()}`);
  };

  const handleApplyFilters = (appliedFilters: PropertyFilters) => {
    setFilters(appliedFilters);
    // Construire les paramètres URL
    const params = new URLSearchParams();
    if (appliedFilters.minPrice) {
      params.set("minPrice", appliedFilters.minPrice.toString());
    }
    if (appliedFilters.maxPrice) {
      params.set("maxPrice", appliedFilters.maxPrice.toString());
    }
    if (appliedFilters.category) {
      params.set("type", appliedFilters.category);
    }
    if (appliedFilters.rooms) {
      params.set("rooms", appliedFilters.rooms.toString());
    }
    if (appliedFilters.bedrooms) {
      params.set("bedrooms", appliedFilters.bedrooms.toString());
    }
    if (appliedFilters.hasBackupGenerator) {
      params.set("hasBackupGenerator", "true");
    }
    if (appliedFilters.hasWaterTank) {
      params.set("hasWaterTank", "true");
    }
    if (appliedFilters.location) {
      params.set("q", appliedFilters.location);
    }
    
    // Rediriger vers la page de recherche avec les filtres
    router.push(`/recherche?${params.toString()}`);
  };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5 }}
        className="mt-6 rounded-[32px] border border-white/10 bg-white/5 p-4 text-white sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Recherche rapide
            </p>
            <h2 className="text-2xl font-semibold">Trouve ton prochain bien</h2>
          </div>
          <Button
            variant="secondary"
            className="rounded-2xl border border-white/20 bg-transparent text-white hover:bg-white/10"
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" /> Filtres avancés
          </Button>
        </div>
      <form onSubmit={handleSubmit} className="mt-6 grid gap-3 sm:grid-cols-4">
        <Input 
          placeholder="Ville, quartier" 
          value={location || ""}
          onChange={(e) => setLocation(e.target.value)}
        />
        <Input 
          placeholder="Budget max (FCFA)" 
          type="number"
          value={maxPrice || ""}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
        <Input 
          placeholder="Surface min (m²)" 
          type="number"
          value={minSurface || ""}
          onChange={(e) => setMinSurface(e.target.value)}
        />
        <Button 
          type="submit"
          className="rounded-2xl bg-white text-black hover:bg-white/90"
        >
          Rechercher
        </Button>
      </form>
      </motion.section>
      
      <FilterDrawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onApply={handleApplyFilters}
      />
    </>
  );
};







