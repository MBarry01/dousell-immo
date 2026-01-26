/**
 * Utilitaires de matching de propriétés (côté client)
 * Utilisé pour l'auto-matching lors de l'import en masse
 */

export interface PropertyForMatching {
    id: string;
    title: string;
    price: number;
    address: string;
}

/**
 * Recherche floue d'une propriété par son nom
 * Utilisé pour l'auto-matching lors de l'import en masse
 */
export function fuzzyMatchProperty(
    searchName: string,
    properties: PropertyForMatching[]
): PropertyForMatching | null {
    if (!searchName || !properties.length) return null;

    // Normaliser la chaîne de recherche
    const normalize = (s: string) =>
        s.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Supprime accents
            .replace(/[^a-z0-9\s]/g, "") // Garde que alphanum et espaces
            .trim();

    const searchNorm = normalize(searchName);
    if (!searchNorm) return null;

    // 1. Recherche exacte (normalisée)
    const exactMatch = properties.find(
        (p) => normalize(p.title) === searchNorm
    );
    if (exactMatch) return exactMatch;

    // 2. Recherche par inclusion (le titre contient le search ou inversement)
    const containsMatch = properties.find((p) => {
        const titleNorm = normalize(p.title);
        return titleNorm.includes(searchNorm) || searchNorm.includes(titleNorm);
    });
    if (containsMatch) return containsMatch;

    // 3. Recherche par mots-clés (au moins 2 mots en commun)
    const searchWords = searchNorm.split(/\s+/).filter((w) => w.length > 2);
    if (searchWords.length > 0) {
        let bestMatch: PropertyForMatching | null = null;
        let bestScore = 0;

        for (const prop of properties) {
            const titleWords = normalize(prop.title).split(/\s+/).filter((w) => w.length > 2);
            const commonWords = searchWords.filter((sw) =>
                titleWords.some((tw) => tw.includes(sw) || sw.includes(tw))
            );
            const score = commonWords.length;
            if (score > bestScore && score >= Math.min(2, searchWords.length)) {
                bestScore = score;
                bestMatch = prop;
            }
        }
        if (bestMatch) return bestMatch;
    }

    return null;
}
