import { supabase } from "@/lib/supabase";
import type { Property } from "@/types/property";
import { getProperties, getPropertiesCount, getSimilarProperties, type PropertyFilters } from "./propertyService";

// Type pour les résultats bruts de la table external_listings
type ExternalListingRow = {
    id: string;
    title: string;
    price: string; // Stocké en texte dans la DB externe
    location: string;
    image_url: string;
    source_url: string;
    source_site: string;
    category: string;
    type: string;
    city: string;
    coords_lat: number | null;  // Coordonnées GPS géocodées
    coords_lng: number | null;
    created_at: string;
    last_seen_at: string;
};

// Mapper partiel pour convertir une ExternalListingRow en Property compatible UI
const mapExternalListing = (row: ExternalListingRow): Property => {
    // Parsing du prix (ex: "500 000 FCFA")
    const numericPrice = parseInt(row.price.replace(/\D/g, ""), 10) || 0;

    // Parsing intelligent des pièces/chambres
    let rooms = 0;
    let bedrooms = 0;
    const textToScan = (row.title + " " + (row.category || "")).toLowerCase();

    // 1. "X pièces", "X pieces", "X pcs"
    const roomsMatch = textToScan.match(/(\d+)\s*(?:pi[èe]ces?|pcs?)\b/);
    if (roomsMatch) {
        rooms = parseInt(roomsMatch[1], 10);
    }

    // 2. "F4", "T3" (Format standard immobilier)
    if (rooms === 0) {
        const typeMatch = textToScan.match(/\b[ft]([1-9])\b/);
        if (typeMatch) {
            rooms = parseInt(typeMatch[1], 10);
        }
    }

    // 3. Bedrooms (Chambres)
    const bedMatch = textToScan.match(/(\d+)\s*(?:chambres?)/);
    if (bedMatch) {
        bedrooms = parseInt(bedMatch[1], 10);
    }

    // Fallback: Si on a les chambres mais pas les pièces, on ajoute 1 (le salon)
    if (rooms === 0 && bedrooms > 0) {
        rooms = bedrooms + 1;
    }

    return {
        id: row.id,
        title: row.title,
        description: "Annonce partenaire importée depuis " + row.source_site,
        price: numericPrice,
        transaction: (row.type?.toLowerCase().includes("location") ? "location" : "vente") as "location" | "vente",
        status: "disponible",
        location: {
            city: row.city || "Sénégal",
            address: row.location || "",
            landmark: "",
            coords: {
                lat: row.coords_lat ?? 14.6928,  // Utilise coords géocodées ou fallback Dakar
                lng: row.coords_lng ?? -17.4467,
            },
        },
        specs: {
            surface: 0,
            rooms: rooms,
            bedrooms: bedrooms,
            bathrooms: 0,

        },
        details: {
            type: (() => {
                const t = row.title?.toLowerCase() || "";
                const cat = row.category?.toLowerCase() || "";
                if (t.includes("terrain") || t.includes("parcelle")) return "Terrain";
                if (t.includes("villa") || t.includes("maison")) return "Villa";
                if (t.includes("studio")) return "Studio";
                if (t.includes("duplex")) return "Duplex";
                if (t.includes("immeuble")) return "Immeuble";
                if (t.includes("bureau")) return "Bureau";
                if (t.includes("hangar") || t.includes("entrepôt") || t.includes("entrepot")) return "Entrepôt";
                if (t.includes("magasin") || t.includes("boutique") || t.includes("commerce") || t.includes("local commercial")) return "Local commercial";
                if (t.includes("chambre") && !t.includes("appartement")) return "Chambre";
                if (t.includes("appartement") || cat.includes("appartement")) return "Appartement";
                return row.category || "Appartement";
            })(),
            year: new Date().getFullYear(),
            heating: "",
        },
        images: row.image_url ? [row.image_url] : [],
        agent: {
            name: row.source_site || "Partenaire",
            photo: "",
            phone: "",
        },
        isExternal: true,
        source_site: row.source_site,
        source_url: row.source_url,
        disponibilite: "Immédiate",
        featured: false,
        exclusive: false,
    };
};

/**
 * Récupère une annonce partenaire par son ID
 * Utilisé par la page teaser /biens/ext-[id]
 */
export async function getExternalListingById(id: string): Promise<Property | null> {
    try {
        const { data, error } = await supabase
            .from("external_listings")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !data) {
            console.error("[gatewayService] getExternalListingById error:", error);
            return null;
        }

        return mapExternalListing(data);
    } catch (err) {
        console.error("[gatewayService] getExternalListingById error:", err);
        return null;
    }
}

/**
 * Récupère les annonces partenaires par type de transaction
 * Utilisé par homeService pour la stratégie de remplissage
 * 
 * @param transactionType - "location" ou "vente"
 * @param category - Optionnel: "Appartement", "Villa", "Terrain", etc.
 * @param limit - Nombre max d'annonces à récupérer
 * @param city - Optionnel: Ville pour filtrer
 */
export async function getExternalListingsByType(
    transactionType: "location" | "vente",
    options: {
        category?: string;
        limit?: number;
        page?: number;
        city?: string;
    } = {}
): Promise<Property[]> {
    const { category, city, limit = 8, page = 1 } = options;

    try {
        // On ne récupère que les annonces vues récemment (< 4 jours)
        const fourDaysAgo = new Date();
        fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from("external_listings")
            .select("*")
            .gt("last_seen_at", fourDaysAgo.toISOString())
            .not("image_url", "is", null)
            .neq("image_url", "")
            .ilike("type", `%${transactionType}%`)
            .range(from, to);

        // Filtre optionnel par catégorie (Appartement, Villa, Terrain)
        if (category) {
            query = query.ilike("category", `%${category}%`);
        }

        // Filtre optionnel par ville
        if (city) {
            query = query.ilike("city", `%${city}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error("[gatewayService] Error fetching external listings:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            return [];
        }

        return (data || []).map(mapExternalListing);
    } catch (err) {
        console.error("[gatewayService] getExternalListingsByType error:", err);
        return [];
    }
}

// Helper pour mapper les catégories internes vers les termes externes
const mapCategoryToQuery = (category: string): string => {
    const term = category.toLowerCase();

    if (term === 'maison' || term === 'villa') {
        return `category.ilike.%Maison%,category.ilike.%Villa%`;
    }
    if (term === 'appartement') {
        return `category.ilike.%Appartement%,category.ilike.%Studio%,category.ilike.%Duplex%`;
    }
    if (term === 'terrain') {
        return `category.ilike.%Terrain%,title.ilike.%Terrain%`;
    }
    if (term === 'commercial' || term === 'autre') {
        return `category.ilike.%Immeuble%,category.ilike.%Bureau%,category.ilike.%Commerce%,category.ilike.%Local%,category.ilike.%Entrepôt%,category.ilike.%Magasin%,category.ilike.%Profess%,category.ilike.%Indus%,title.ilike.%Bureau%,title.ilike.%Commerce%,title.ilike.%Local%,title.ilike.%Magasin%,title.ilike.%Entrepôt%,title.ilike.%Immeuble%`;
    }
    return `category.ilike.%${category}%`;
};

export async function getExternalListingsCount(
    transactionType: "location" | "vente" | "any",
    options: {
        category?: string;
        city?: string;
    } = {}
): Promise<number> {
    const { category, city } = options;

    try {
        const fourDaysAgo = new Date();
        fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

        let query = supabase
            .from("external_listings")
            .select("*", { count: "exact", head: true })
            .gt("last_seen_at", fourDaysAgo.toISOString())
            .not("image_url", "is", null)
            .neq("image_url", "");

        if (transactionType !== "any") {
            query = query.ilike("type", `%${transactionType}%`);
        }

        if (category) {
            // Utilisation du mapping intelligent
            query = query.or(mapCategoryToQuery(category));
        }

        if (city) {
            query = query.ilike("city", `%${city}%`);
        }



        const { count, error } = await query;

        if (error) {
            console.error("[gatewayService] Error counting external listings:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            return 0;
        }

        return count || 0;
    } catch (err) {
        console.error("[gatewayService] getExternalListingsCount error:", err);
        return 0;
    }
}

/**
 * Récupère des annonces similaires (internes + externes)
 * Stratégie: Priorité aux annonces internes, puis remplissage avec externes
 * 
 * @param transactionType - "location" ou "vente"
 * @param city - Ville pour filtrer (format display, ex: "Region de Dakar")
 * @param propertyType - Type de bien optionnel (ex: "Appartement")
 * @param excludeIds - IDs des propriétés à exclure (celles déjà affichées)
 * @param limit - Nombre max d'annonces (défaut: 6)
 */
export async function getSimilarListings(options: {
    transactionType: "location" | "vente";
    city: string;
    propertyType?: string;
    excludeIds?: string[];
    limit?: number;
}): Promise<Property[]> {
    const { transactionType, city, propertyType, excludeIds = [], limit = 6 } = options;
    console.log(`[getSimilarListings] Start for ${city} (${transactionType}) - Type: ${propertyType}`);

    try {
        // 1. Récupérer les annonces internes similaires
        const internalListings = await getSimilarProperties(
            transactionType,
            city,
            limit,
            excludeIds[0] // La fonction existante ne prend qu'un ID
        );
        console.log(`[getSimilarListings] Internal found: ${internalListings.length}`);

        // Filtrer les autres IDs exclus
        const filteredInternal = internalListings.filter(
            (p) => !excludeIds.includes(p.id)
        );

        // Filtrer par type si spécifié
        const typedInternal = propertyType
            ? filteredInternal.filter(
                (p) => p.details?.type?.toLowerCase() === propertyType.toLowerCase()
            )
            : filteredInternal;

        console.log(`[getSimilarListings] Internal kept after filter: ${typedInternal.length}`);

        // 2. Si on a assez d'annonces internes, on les retourne
        if (typedInternal.length >= limit) {
            return typedInternal.slice(0, limit);
        }

        // 3. Sinon, compléter avec des annonces externes
        const neededExternal = limit - typedInternal.length;

        // Nettoyage du nom de ville pour la recherche externe (ex: "Region de Dakar" -> "Dakar")
        let searchCity = city;
        // Handle accents explicitly just in case (e.g. Région vs Region)
        if (searchCity.toLowerCase().match(/r[ée]gion de /)) {
            searchCity = searchCity.replace(/r[ée]gion de /i, "").trim();
        } else if (searchCity.toLowerCase().match(/d[ée]partement de /)) {
            searchCity = searchCity.replace(/d[ée]partement de /i, "").trim();
        }
        console.log(`[getSimilarListings] External search city: "${searchCity}"`);

        const externalListings = await getExternalListingsByType(
            transactionType,
            {
                city: searchCity,
                category: propertyType,
                limit: neededExternal + 5, // Récupérer un peu plus pour filtrer
            }
        );
        console.log(`[getSimilarListings] External found: ${externalListings.length}`);

        // Filtrer les externes qui seraient déjà dans les exclusions
        const filteredExternal = externalListings.filter(
            (p) => !excludeIds.includes(p.id)
        );

        // 4. Fusionner: internes d'abord, puis externes
        const combined = [...typedInternal, ...filteredExternal.slice(0, neededExternal)];

        // 5. Si toujours pas assez, on élargit aux autres types dans la même ville (internes seulement)
        if (combined.length < limit && propertyType) {
            const moreInternal = filteredInternal
                .filter((p) => p.details?.type?.toLowerCase() !== propertyType.toLowerCase())
                .filter((p) => !combined.some((c) => c.id === p.id));

            combined.push(...moreInternal.slice(0, limit - combined.length));
        }

        return combined.slice(0, limit);
    } catch (error: any) {
        console.error("[gatewayService] getSimilarListings error:", error?.message || error);
        return [];
    }
}

export const getUnifiedListings = async (filters: PropertyFilters = {}): Promise<{ listings: Property[], total: number }> => {
    try {
        const page = filters.page || 1;
        const limit = filters.limit || 12;

        // 1. Récupération des counts totaux
        const [internalCount, externalCount] = await Promise.all([
            getPropertiesCount(filters),
            getExternalListingsCount(filters.category === "location" ? "location" : (filters.category === "vente" ? "vente" : "any"), {
                category: filters.type,
                city: filters.city || filters.citySlug
            })
        ]);

        const total = internalCount + externalCount;
        let listings: Property[] = [];

        // 2. Logique de pagination mixte
        if ((page - 1) * limit < internalCount) {
            // On a des biens internes à afficher
            const internalListings = await getProperties(filters);
            listings.push(...internalListings);

            // Si on a de la place pour des externes sur la même page
            if (listings.length < limit && externalCount > 0) {
                const neededExternal = limit - listings.length;
                const externalListings = await getExternalListingsByType(
                    filters.category === "location" ? "location" : "vente",
                    {
                        city: filters.city || filters.citySlug,
                        category: filters.type,
                        limit: neededExternal,
                        page: 1
                    }
                );
                listings.push(...externalListings);
            }
        } else {
            // On est uniquement sur les biens externes
            const externalOffset = (page - 1) * limit - internalCount;
            const externalPage = Math.floor(externalOffset / limit) + 1;
            const skipOnFirstPage = externalOffset % limit;

            const externalListings = await getExternalListingsByType(
                filters.category === "location" ? "location" : "vente",
                {
                    city: filters.city || filters.citySlug,
                    category: filters.type,
                    limit: limit + (skipOnFirstPage || 0),
                    page: externalPage
                }
            );

            listings = (externalListings || []).slice(skipOnFirstPage, skipOnFirstPage + limit);
        }

        return { listings: listings || [], total: total || 0 };

    } catch (err: any) {
        console.error("[gatewayService] getUnifiedListings Gateway Error:", err?.message || err);
        return { listings: [], total: 0 };
    }
};
