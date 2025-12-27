"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Filter, Map, Search as SearchIcon, Bell } from "lucide-react";

import { PropertyCard } from "@/components/property/property-card";
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
import { getProperties, type PropertyFilters } from "@/services/propertyService";

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

  // Debounce de la recherche textuelle (500ms)
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

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
        const data = await getProperties(nextFilters);
        setResults(data);
        setIsSearching(false);
      };
      searchFilters();
    }
  }, [debouncedSearchQuery]); // Exclure filters et setFilters des dépendances pour éviter les boucles

  const applyFilters = useCallback(async (nextFilters: PropertyFilters) => {
    setIsSearching(true);
    setFilters(nextFilters);
    const data = await getProperties(nextFilters);
    setResults(data);
    setIsSearching(false);
  }, [setFilters]);

  // Mémoiser le nombre de résultats
  const resultCount = useMemo(() => results.length, [results.length]);

  return (
    <div className="relative space-y-6 pb-32">
      <div className="rounded-[28px] border border-white/5 bg-black/40 p-4 backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
            <SearchIcon className={`h-5 w-5 ${isSearching ? "text-primary animate-pulse" : "text-white/50"}`} />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Ville ou code postal"
              className="border-none bg-transparent p-0 text-white placeholder:text-white/50 focus-visible:ring-0"
            />
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
            variant="default"
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [&>*]:w-full">
            {results.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )
      ) : (
        <MapView properties={results} />
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

