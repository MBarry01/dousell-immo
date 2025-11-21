import type { PropertyFilters } from "@/data/properties";

const numberOrUndefined = (value?: string | null) => {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const booleanOrUndefined = (value?: string | null) => {
  if (value === null || value === undefined || value === "") return undefined;
  return value === "true";
};

const stringOrUndefined = (value?: string | null) => {
  if (value === null || value === undefined || value === "") return undefined;
  return value;
};

export const parseFiltersFromSearchParams = (
  params: URLSearchParams
): PropertyFilters => {
  return {
    q: stringOrUndefined(params.get("q")),
    minPrice: numberOrUndefined(params.get("minPrice")),
    maxPrice: numberOrUndefined(params.get("maxPrice")),
    type: stringOrUndefined(params.get("type")) as PropertyFilters["type"],
    rooms: numberOrUndefined(params.get("rooms")),
    bedrooms: numberOrUndefined(params.get("bedrooms")),
    hasBackupGenerator: booleanOrUndefined(params.get("hasBackupGenerator")),
    hasWaterTank: booleanOrUndefined(params.get("hasWaterTank")),
  };
};

export const serializeFilters = (
  filters: PropertyFilters,
  base?: URLSearchParams
) => {
  const params = new URLSearchParams(base);
  const entries: [keyof PropertyFilters, PropertyFilters[keyof PropertyFilters]][] =
    [
      ["q", filters.q],
      ["minPrice", filters.minPrice],
      ["maxPrice", filters.maxPrice],
      ["type", filters.type],
      ["rooms", filters.rooms],
      ["bedrooms", filters.bedrooms],
      ["hasBackupGenerator", filters.hasBackupGenerator ? "true" : undefined],
      ["hasWaterTank", filters.hasWaterTank ? "true" : undefined],
    ];

  entries.forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === 0) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  });

  return params;
};

export const hasActiveFilters = (filters: PropertyFilters) => {
  return Boolean(
    filters.minPrice ||
      filters.maxPrice ||
      filters.type ||
      filters.rooms ||
      filters.bedrooms ||
      filters.hasBackupGenerator ||
      filters.hasWaterTank
  );
};

