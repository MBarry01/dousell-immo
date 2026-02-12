"use client";

import * as React from "react";
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 12;

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
  const [currentPage, setCurrentPage] = useState(1);

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
        setCurrentPage(1); // Reset page on search change
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
    setCurrentPage(1); // Reset page on filter apply
    setIsSearching(false);
  }, [setFilters]);

  // Mémoiser le nombre de résultats et les résultats paginés
  const resultCount = useMemo(() => results.length, [results.length]);

  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return results.slice(start, start + ITEMS_PER_PAGE);
  }, [results, currentPage]);

  const totalPages = Math.ceil(resultCount / ITEMS_PER_PAGE);

  // Effet pour défiler vers le haut des résultats lors d'un changement de page
  useEffect(() => {
    if (currentPage > 1) {
      const resultsElement = document.getElementById("search-results-top");
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [currentPage]);

  return (
    <div className="relative space-y-6 pb-32">
      <div className="relative z-50 rounded-[28px] border border-white/5 bg-black/40 p-4 backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // On peut aussi forcer un blur ici pour fermer le clavier
              (document.activeElement as HTMLElement)?.blur();
            }}
            className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2"
          >
            <SearchIcon className={`h-5 w-5 ${isSearching ? "text-primary animate-pulse" : "text-white/50"}`} />
            <div className="relative flex-1">
              <Input
                type="search"
                enterKeyHint="search"
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
          </form>
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
          <div id="search-results-top" className="scroll-mt-24">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [&>*]:w-full">
              {paginatedResults.map((property) => (
                <PropertyCardUnified key={property.id} property={property} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      {currentPage > 1 ? (
                        <PaginationPrevious
                          onClick={() => setCurrentPage(prev => prev - 1)}
                        />
                      ) : (
                        <div className="pointer-events-none opacity-30">
                          <PaginationPrevious />
                        </div>
                      )}
                    </PaginationItem>

                    {/* Logic to show page numbers with ellipsis */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Alléger la pagination sur mobile
                        if (totalPages <= 5) return true;
                        if (page === 1 || page === totalPages) return true;
                        if (Math.abs(page - currentPage) <= 1) return true;
                        return false;
                      })
                      .map((page, index, array) => (
                        <React.Fragment key={page}>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              isActive={currentPage === page}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        </React.Fragment>
                      ))}

                    <PaginationItem>
                      {currentPage < totalPages ? (
                        <PaginationNext
                          onClick={() => setCurrentPage(prev => prev + 1)}
                        />
                      ) : (
                        <div className="pointer-events-none opacity-30">
                          <PaginationNext />
                        </div>
                      )}
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
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

