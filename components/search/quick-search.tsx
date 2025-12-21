"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, ChevronDown, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterDrawer } from "@/components/search/filter-drawer";
import type { PropertyFilters } from "@/services/propertyService";

export const QuickSearch = () => {
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileFiltersExpanded, setMobileFiltersExpanded] = useState(false);
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

  // Compteur de filtres actifs pour le badge
  const activeFilterCount = [location, maxPrice, minSurface].filter(Boolean).length;

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5 }}
        className="mt-0 mb-0 md:mt-0 md:mb-0 rounded-[32px] border border-white/10 bg-white/5 px-4 py-6 text-white md:px-6 md:py-8 min-h-[152px]"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Recherche rapide
            </p>
            <h2 className="text-2xl font-semibold">Trouve ton prochain bien</h2>
          </div>
          
          {/* Bouton Filtres - Mobile: toggle accordéon */}
          <Button
            variant="secondary"
            className="relative rounded-2xl border border-white/20 bg-transparent text-white hover:bg-white/10 md:hidden"
            onClick={() => setMobileFiltersExpanded(!mobileFiltersExpanded)}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filtres
            {activeFilterCount > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown 
              className={`ml-2 h-4 w-4 transition-transform duration-200 ${
                mobileFiltersExpanded ? "rotate-180" : ""
              }`} 
            />
          </Button>
          
          {/* Bouton desktop - ouvre le drawer complet */}
          <Button
            variant="secondary"
            className="hidden rounded-2xl border border-white/20 bg-transparent text-white hover:bg-white/10 md:flex"
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" /> Filtres avancés
          </Button>
        </div>

        {/* Mobile: Filtres en accordéon */}
        <AnimatePresence>
          {mobileFiltersExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden md:hidden"
            >
              <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
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
                <div className="flex gap-2">
                  <Button 
                    type="submit"
                    className="flex-1 rounded-2xl"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Rechercher
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-2xl text-white/60 hover:text-white"
                    onClick={() => setFiltersOpen(true)}
                  >
                    + de filtres
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop: Formulaire toujours visible */}
        <form onSubmit={handleSubmit} className="mt-6 hidden gap-3 md:grid md:grid-cols-4">
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
            className="rounded-2xl"
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
