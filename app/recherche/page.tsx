import { SearchExperience } from "@/components/search/search-experience";
import {
  getLatestProperties,
  getProperties,
  type PropertyFilters,
} from "@/services/propertyService";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Recherche · Doussel Immo",
};

// Page dynamique car les filtres changent constamment
export const dynamic = "force-dynamic";

const recordToFilters = (
  params: Record<string, string | string[] | undefined>
) => {
  const filters: PropertyFilters = {};
  
  // Recherche textuelle (q ou location)
  if (params.q && typeof params.q === "string") {
    filters.location = params.q;
  }
  
  // Catégorie (category) : location ou vente
  if (params.category && typeof params.category === "string") {
    filters.category = params.category as PropertyFilters["category"];
  }
  
  // Type de bien (type) : Maison, Appartement, Studio, Terrain, etc.
  if (params.type && typeof params.type === "string") {
    filters.type = params.type as PropertyFilters["type"];
  }
  
  // Ville (city)
  if (params.city && typeof params.city === "string") {
    filters.city = params.city;
  }
  
  // Prix
  if (params.minPrice) {
    filters.minPrice = Number(params.minPrice);
  }
  if (params.maxPrice) {
    filters.maxPrice = Number(params.maxPrice);
  }
  
  // Spécifications
  if (params.rooms) {
    filters.rooms = Number(params.rooms);
  }
  if (params.bedrooms) {
    filters.bedrooms = Number(params.bedrooms);
  }
  
  // Features Dakar
  if (params.hasBackupGenerator === "true") {
    filters.hasBackupGenerator = true;
  }
  if (params.hasWaterTank === "true") {
    filters.hasWaterTank = true;
  }
  
  return filters;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolved = await searchParams;
  const filters = recordToFilters(resolved);
  const hasActiveFilters = Object.keys(filters).length > 0;
  const properties = hasActiveFilters
    ? await getProperties(filters)
    : await getLatestProperties(12);

  return (
    <div className="space-y-6 py-6">
      <h1 className="text-3xl font-semibold text-white">Explorer les biens</h1>
      <SearchExperience initialFilters={filters} initialResults={properties} />
    </div>
  );
}







