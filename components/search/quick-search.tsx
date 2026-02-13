"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, ChevronDown, Search, MapPin, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterDrawer } from "@/components/search/filter-drawer";
import type { PropertyFilters } from "@/services/propertyService";
import { getSearchSuggestions } from "@/services/propertyService";
import { useDebounce } from "@/hooks/use-debounce";

export const QuickSearch = () => {
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileFiltersExpanded, setMobileFiltersExpanded] = useState(false);
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [location, setLocation] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minSurface, setMinSurface] = useState<string>("");

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the search query
  const debouncedLocation = useDebounce(location, 300);

  // Fetch suggestions when debounced location changes
  useEffect(() => {
    if (debouncedLocation && debouncedLocation.length >= 2) {
      setIsLoadingSuggestions(true);
      getSearchSuggestions(debouncedLocation)
        .then((results) => {
          setSuggestions(results);
          setSelectedIndex(-1);
        })
        .finally(() => setIsLoadingSuggestions(false));
    } else {
      setSuggestions([]);
    }
  }, [debouncedLocation]);

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

  const handleSelectSuggestion = (suggestion: string) => {
    setLocation(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          e.preventDefault();
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  // Compteur de filtres actifs pour le badge
  const activeFilterCount = [location, maxPrice, minSurface].filter(Boolean).length;

  // Composant de suggestions réutilisable
  const SuggestionsDropdown = () => (
    <AnimatePresence>
      {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl border border-white/10 bg-[#0F172A] shadow-2xl shadow-black/50 overflow-hidden"
        >
          {isLoadingSuggestions ? (
            <div className="flex items-center justify-center py-4 text-white/50">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm">Recherche...</span>
            </div>
          ) : (
            <div className="p-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  type="button"
                  className={`w-full flex items-center gap-2 px-4 py-3 text-left text-sm rounded-lg transition-colors cursor-pointer ${index === selectedIndex
                    ? "bg-primary/20 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectSuggestion(suggestion);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

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
              className={`ml-2 h-4 w-4 transition-transform duration-200 ${mobileFiltersExpanded ? "rotate-180" : ""
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
                <div className="relative">
                  <Input
                    ref={inputRef}
                    placeholder="Ville, quartier"
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                  />
                  <SuggestionsDropdown />
                </div>
                <Input
                  placeholder="Budget max (FCFA)"
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
                <Input
                  placeholder="Surface min (m²)"
                  type="number"
                  value={minSurface}
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
          <div className="relative">
            <Input
              placeholder="Ville, quartier"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />
            <SuggestionsDropdown />
          </div>
          <Input
            placeholder="Budget max (FCFA)"
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
          <Input
            placeholder="Surface min (m²)"
            type="number"
            value={minSurface}
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
