"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { PropertyFilters } from "@/data/properties";
import {
  parseFiltersFromSearchParams,
  serializeFilters,
} from "@/lib/search-filters";

export const useSearchFilters = (initialFilters: PropertyFilters) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => {
    const paramsString = searchParams.toString();
    if (!paramsString) {
      return initialFilters;
    }
    return parseFiltersFromSearchParams(searchParams);
  }, [searchParams, initialFilters]);

  const setFilters = (updates: Partial<PropertyFilters>) => {
    const next = { ...filters, ...updates };
    const params = serializeFilters(next);
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  };

  return { filters, setFilters };
};








