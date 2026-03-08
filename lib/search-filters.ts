import type { PropertyFilters } from "@/services/propertyService";

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
  // Parser les types multiples (séparés par des virgules)
  const typesParam = params.get("types");
  const types = typesParam
    ? (typesParam.split(",").filter(Boolean) as PropertyFilters["types"])
    : undefined;

  return {
    q: stringOrUndefined(params.get("q")),
    category: stringOrUndefined(params.get("category")) as PropertyFilters["category"],
    city: stringOrUndefined(params.get("city")),
    location: stringOrUndefined(params.get("location")),
    minPrice: numberOrUndefined(params.get("minPrice")),
    maxPrice: numberOrUndefined(params.get("maxPrice")),
    status: stringOrUndefined(params.get("status")) as PropertyFilters["status"],
    type: stringOrUndefined(params.get("type")) as PropertyFilters["type"],
    types,
    rooms: numberOrUndefined(params.get("rooms")),
    bedrooms: numberOrUndefined(params.get("bedrooms")),
    hasBackupGenerator: booleanOrUndefined(params.get("hasBackupGenerator")),
    hasWaterTank: booleanOrUndefined(params.get("hasWaterTank")),
    limit: numberOrUndefined(params.get("limit")),
    page: numberOrUndefined(params.get("page")),
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
      ["category", filters.category],
      ["city", filters.city],
      ["location", filters.location],
      ["minPrice", filters.minPrice],
      ["maxPrice", filters.maxPrice],
      ["status", filters.status],
      ["type", filters.type],
      ["types", filters.types ? filters.types.join(",") : undefined],
      ["rooms", filters.rooms],
      ["bedrooms", filters.bedrooms],
      ["hasBackupGenerator", filters.hasBackupGenerator ? "true" : undefined],
      ["hasWaterTank", filters.hasWaterTank ? "true" : undefined],
      ["limit", filters.limit],
      ["page", filters.page],
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
    filters.q ||
    filters.category ||
    filters.city ||
    filters.location ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.status ||
    filters.type ||
    filters.types ||
    filters.rooms ||
    filters.bedrooms ||
    filters.hasBackupGenerator ||
    filters.hasWaterTank
  );
};

