import { supabase } from "@/lib/supabase";
import type { Property } from "@/types/property";
import { getProperties, type PropertyFilters } from "./propertyService";

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
            rooms: 0,
            bedrooms: 0,
            bathrooms: 0,
            dpe: "C",
        },
        details: {
            type: row.category || "Autre",
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
        city?: string;
        limit?: number;
    } = {}
): Promise<Property[]> {
    const { category, city, limit = 8 } = options;

    try {
        // On ne récupère que les annonces vues récemment (< 4 jours)
        const fourDaysAgo = new Date();
        fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

        let query = supabase
            .from("external_listings")
            .select("*")
            .gt("last_seen_at", fourDaysAgo.toISOString())
            .ilike("type", `%${transactionType}%`)
            .limit(limit);

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
            console.error("[gatewayService] Error fetching external listings:", error);
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
            .gt("last_seen_at", fourDaysAgo.toISOString());

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
            console.error("[gatewayService] Error counting external listings:", error);
            return 0;
        }

        return count || 0;
    } catch (err) {
        console.error("[gatewayService] getExternalListingsCount error:", err);
        return 0;
    }
}

export const getUnifiedListings = async (filters: PropertyFilters = {}) => {
    try {
        // 1. Récupération des annonces internes (via propertyService existant)
        const internalPromise = getProperties(filters);

        // 2. Construction de la requête externe
        let externalQuery = supabase
            .from("external_listings")
            .select("*");

        // -- Filtres de Sécurité (Nettoyage) --
        // On ne récupère que les annonces vues récemment (ex: 4 jours max)
        const fourDaysAgo = new Date();
        fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
        externalQuery = externalQuery.gt("last_seen_at", fourDaysAgo.toISOString());

        // -- Application des filtres utilisateur --
        if (filters.q) {
            // Nettoyage de la recherche
            let searchTerm = filters.q.trim();

            // Si la recherche contient une virgule (ex: "Mermoz, Dakar"), on prend le premier terme
            if (searchTerm.includes(",")) {
                const parts = searchTerm.split(",");
                if (parts.length > 0) {
                    searchTerm = parts[0].trim();
                }
            }

            externalQuery = externalQuery.or(`title.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`);
        }

        // Mapping des filtres de catégorie
        if (filters.category) {
            // Mapping simple : propertyService utilise "vente"|"location" dans category parfois, 
            // ou alors category est le type de transaction.
            // Dans external_listings: type = Vente/Location, category = Appartement/Villa...

            // Si le filtre category est 'vente' ou 'location' -> c'est le champ 'type'
            const catLower = filters.category.toLowerCase();
            if (catLower === 'vente' || catLower === 'location') {
                externalQuery = externalQuery.ilike('type', `%${catLower}%`);
            } else {
                // Sinon on cherche dans category (Appartement, etc.)
                externalQuery = externalQuery.ilike('category', `%${catLower}%`);
            }
        }

        if (filters.city) {
            externalQuery = externalQuery.ilike('city', `%${filters.city}%`);
        }

        if (filters.type) {
            // Filtre type de bien (Appartement, Villa...)
            // Utilise le même mapping intelligent que pour le comptage
            externalQuery = externalQuery.or(mapCategoryToQuery(filters.type));
        }

        // Note : Le prix est stocké en TEXT dans external_listings ("500 000 FCFA")
        // Le filtrage SQL sur prix texte est complexe. 
        // Pour une V1 simple, on filtre les prix APRES réception ou on ignore ce filtre pour l'externe.
        // Ici on va les récupérer et filtrer en JS.

        const externalPromise = externalQuery;

        // 3. Exécution parallèle
        // 3. Exécution parallèle avec gestion d'erreurs indépendante
        const [internalResult, externalResult] = await Promise.allSettled([internalPromise, externalPromise]);

        let internalProps: Property[] = [];
        if (internalResult.status === 'fulfilled') {
            internalProps = internalResult.value || [];
        } else {
            console.error("[gatewayService] Failed to load internal properties:", internalResult.reason);
        }

        let externalProps: Property[] = [];
        if (externalResult.status === 'fulfilled') {
            const data = externalResult.value.data || [];
            externalProps = data.map(mapExternalListing);

            // Debug: Vérifier quelques coordonnées pour le monitoring
            if (externalProps.length > 0) {
                const sample = externalProps.find(p => p.location.coords.lat !== 14.6928); // Chercher un non-default
                if (sample) {
                    console.log(`[gatewayService] ✅ Coords loaded for ${sample.id}:`, sample.location.coords);
                } else {
                    console.warn(`[gatewayService] ⚠️ All ${externalProps.length} external props seem to use default fallback coords (Dakar)`);
                }
            }
        } else {
            console.error("[gatewayService] Failed to load external properties:", externalResult.reason);
        }

        // Filtrage JS du prix pour les externes
        if (filters.minPrice || filters.maxPrice) {
            externalProps = externalProps.filter(p => {
                if (filters.minPrice && p.price < filters.minPrice) return false;
                if (filters.maxPrice && p.price > filters.maxPrice) return false;
                return true;
            });
        }

        // 4. Fusion
        const unifiedListings = [...internalProps, ...externalProps];

        // 5. Tri (Interne d'abord, puis Externe, en attendant mieux)
        return unifiedListings;

        return unifiedListings;

    } catch (err) {
        console.error("Gateway Error", err);
        return []; // Fail safe, au moins on ne crashe pas l'app
    }
};
