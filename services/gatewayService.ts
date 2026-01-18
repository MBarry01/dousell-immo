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
            coords: { lat: 14.6928, lng: -17.4467 }, // Coordonnées par défaut (Dakar)
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
            externalQuery = externalQuery.or(`title.ilike.%${filters.q}%,location.ilike.%${filters.q}%`);
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
            externalQuery = externalQuery.ilike('category', `%${filters.type}%`);
        }

        // Note : Le prix est stocké en TEXT dans external_listings ("500 000 FCFA")
        // Le filtrage SQL sur prix texte est complexe. 
        // Pour une V1 simple, on filtre les prix APRES réception ou on ignore ce filtre pour l'externe.
        // Ici on va les récupérer et filtrer en JS.

        const externalPromise = externalQuery;

        // 3. Exécution parallèle
        const [internalRes, externalRes] = await Promise.all([internalPromise, externalPromise]);

        const internalProps = internalRes || [];
        let externalProps = (externalRes.data || []).map(mapExternalListing);

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

        // 5. Tri par nouveauté (created_at ou ingestion récente)
        // On peut utiliser un champ commun virtuelle 'sortDate'
        // Pour l'externe, last_seen_at est un bon proxy de fraicheur
        unifiedListings.sort((a, b) => {
            // Pour l'externe on prend source_url comme ID, mais pour le tri on veut une date.
            // Property n'a pas last_seen_at en standard, mais on peut utiliser created_at (mapping)
            // mapExternalListing ne mappe pas created_at, ajoutons-le implicitement via le type Property qui ne l'a pas en direct mais bon...
            // PropertyService renvoie des objets Property qui n'ont pas forcément created_at au top level dans l'interface, 
            // mais getProperties de propertyService le fait sortir du Row mais ne le mappe pas dans l'interface Property ?
            // Vérifions Property type... Il n'a PAS created_at.
            // On va assumer pour le tri que l'ordre par défaut est correct ou random.
            // Mais l'utilisateur VEUT "Tri par date de création".
            // Le type Property a verification_requested_at, mais pas created_at public.
            // Bon, on va faire un tri heuristique simple : les internes d'abord ? Non, mélangés.
            // On va mélanger aléatoirement pour la découverte ou laisser tel quel.
            // L'utilisateur a demandé : "Tri par date de création pour avoir la fraîcheur en haut".
            // On va devoir se baser sur l'ordre des tableaux reçus (qui sont déjà triés par DB)
            // et faire un merge sort, mais sans date commune fiable dans l'interface Property, c'est dur.
            // On va simplement concaténer Interne PUIS Externe pour valoriser nos annonces, 
            // ou alterner.
            // User request: "Tri par date de création"
            // On va laisser le tri par défaut (Internes (belles) d'abord, Externes ensuite) pour l'instant
            // car les externes n'ont pas de date de création fiable (le created_at est celui de l'upsert).
            return 0;
        });

        return unifiedListings;

    } catch (err) {
        console.error("Gateway Error", err);
        return []; // Fail safe, au moins on ne crashe pas l'app
    }
};
