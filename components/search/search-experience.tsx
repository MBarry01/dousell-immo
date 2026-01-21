"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Filter, Map, Search as SearchIcon, Bell, MapPin } from "lucide-react";

import { PropertyCardUnified } from "@/components/property/property-card-unified";
import { FilterDrawer } from "@/components/search/filter-drawer";
import { CreateAlertDialog } from "@/components/search/create-alert-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useDebounce } from "@/hooks/use-debounce";
import type { Property } from "@/types/property";
import { hasActiveFilters } from "@/lib/search-filters";
import { useSearchFilters } from "@/hooks/use-search-filters";
import { getUnifiedListings } from "@/services/gatewayService";
import { type PropertyFilters, getSearchSuggestions } from "@/services/propertyService";

const MapView = dynamic(
  () => import("@/components/search/map-view").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[70vh] items-center justify-center rounded-[32px] border border-white/10 bg-white/5 text-white/70">
        Chargement de la carte…
      </div>
    ),
  }
);

type SearchExperienceProps = {
  initialFilters: PropertyFilters;
  initialResults: Property[];
};

export const SearchExperience = ({
  initialFilters,
  initialResults,
}: SearchExperienceProps) => {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { filters, setFilters } = useSearchFilters(initialFilters);
  const [view, setView] = useState<"list" | "map">("list");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [results, setResults] = useState<Property[]>(initialResults);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.q ?? "");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounce de la recherche textuelle (500ms)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch suggestions
  useEffect(() => {
    if (debouncedSearchQuery && debouncedSearchQuery.length >= 2) {
      getSearchSuggestions(debouncedSearchQuery).then(setSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearchQuery]);

  const activeFilters = hasActiveFilters(filters);

  // Ouvrir le dialog de création d'alerte si ?alert=create est présent
  useEffect(() => {
    const shouldOpenAlert = searchParams.get("alert") === "create" && !!user;
    if (shouldOpenAlert) {
      // Utiliser setTimeout pour éviter setState synchrone dans useEffect
      setTimeout(() => setAlertDialogOpen(true), 0);
    }
  }, [searchParams, user]);

  // Effet pour appliquer la recherche debouncée
  useEffect(() => {
    if (debouncedSearchQuery !== filters.q) {
      const searchFilters = async () => {
        setIsSearching(true);
        const nextFilters = { ...filters, q: debouncedSearchQuery || undefined };
        setFilters(nextFilters);
        const data = await getUnifiedListings(nextFilters);
        setResults(data);
        setIsSearching(false);
      };
      searchFilters();
    }
  }, [debouncedSearchQuery]); // Exclure filters et setFilters des dépendances pour éviter les boucles

  const applyFilters = useCallback(async (nextFilters: PropertyFilters) => {
    setIsSearching(true);
    setFilters(nextFilters);
    const data = await getUnifiedListings(nextFilters);
    setResults(data);
    setIsSearching(false);
  }, [setFilters]);

  // Mémoiser le nombre de résultats
  const resultCount = useMemo(() => results.length, [results.length]);

  return (
    <div className="relative space-y-6 pb-32">
      <div className="relative z-50 rounded-[28px] border border-white/5 bg-black/40 p-4 backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
            <SearchIcon className={`h-5 w-5 ${isSearching ? "text-primary animate-pulse" : "text-white/50"}`} />
            <div className="relative flex-1">
              <Input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Ville ou code postal"
                className="border-none bg-transparent p-0 text-white placeholder:text-white/50 focus-visible:ring-0"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 mt-2 w-full origin-top-left rounded-xl border border-white/10 bg-[#0F172A] p-1 shadow-2xl shadow-black/50 z-50 overflow-hidden">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full rounded-lg px-4 py-3 text-left text-sm text-white/90 hover:bg-white/10 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                      onMouseDown={(e) => {
                        e.preventDefault(); // Empêche la perte de focus de l'input
                        setSearchQuery(suggestion);
                        setShowSuggestions(false);
                      }}
                    >
                      <MapPin className="h-4 w-4 text-white/40 shrink-0" />
                      <span className="truncate">{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="rounded-2xl border border-white/10 bg-white/10 text-white"
            onClick={() => setDrawerOpen(true)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtres
            {activeFilters && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                ●
              </span>
            )}
          </Button>
          {user && (
            <Button
              type="button"
              variant="secondary"
              className="rounded-2xl border border-white/10 bg-white/10 text-white"
              onClick={() => setAlertDialogOpen(true)}
            >
              <Bell className="mr-2 h-4 w-4" />
              Créer une alerte
            </Button>
          )}
        </div>
        <p className="mt-3 text-sm text-white/60">
          {isSearching ? (
            <span className="animate-pulse">Recherche en cours...</span>
          ) : (
            <>{resultCount} bien{resultCount > 1 ? "s" : ""} trouvé{resultCount > 1 ? "s" : ""}</>
          )}
        </p>
      </div>

      {view === "list" ? (
        results.length === 0 ? (
          <EmptyState
            title="Aucun bien ne correspond à vos critères."
            description={
              activeFilters
                ? "Essayez de modifier vos critères de recherche ou de réinitialiser les filtres pour voir plus de résultats."
                : "Nous ajoutons régulièrement de nouveaux biens. Revenez bientôt pour découvrir les dernières offres !"
            }
            actionLabel={activeFilters ? "Réinitialiser les filtres" : undefined}
            onAction={
              activeFilters
                ? () => {
                  const clearedFilters: PropertyFilters = {};
                  setFilters(clearedFilters);
                  applyFilters(clearedFilters);
                }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [&>*]:w-full">
            {results.map((property) => (
              <PropertyCardUnified key={property.id} property={property} />
            ))}
          </div>
        )
      ) : (
        <MapView
          properties={results}
          onClose={() => setView("list")}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}

      <Button
        type="button"
        className="fixed bottom-28 right-6 z-30 rounded-full px-5 py-3 shadow-xl md:bottom-8"
        onClick={() => setView((prev) => (prev === "list" ? "map" : "list"))}
      >
        {view === "list" ? (
          <>
            <Map className="mr-2 h-4 w-4" /> Vue carte
          </>
        ) : (
          <>
            <SearchIcon className="mr-2 h-4 w-4" /> Vue liste
          </>
        )}
      </Button>

      <FilterDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        filters={filters}
        onApply={applyFilters}
      />

      {user && (
        <CreateAlertDialog
          open={alertDialogOpen}
          onOpenChange={setAlertDialogOpen}
          filters={filters}
        />
      )}
    </div>
  );
};

