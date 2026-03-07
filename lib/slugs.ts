/**
 * Utilitaires pour la gestion des URLs (Slugs)
 * Essentiel pour gérer les accents et formats spécifiques (ex: Sénégal)
 */

export function slugify(text: string): string {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .trim()
        .normalize('NFD') // Sépare les accents des lettres (é -> e + ')
        .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
        .replace(/\s+/g, '-') // Remplace les espaces par des tirets
        .replace(/[^\w\-]+/g, '') // Supprime tout ce qui n'est pas lettre/chiffre/tiret
        .replace(/\-\-+/g, '-'); // Remplace les tirets multiples par un seul
}

export function unslugify(text: string): string {
    if (!text) return '';
    // C'est une approximation pour l'affichage (ex: "sacre-coeur" -> "sacre coeur")
    // Pour la requête BDD, on utilisera .ilike() qui ignore la casse/format exact
    return text.replace(/-/g, ' ');
}

/**
 * Capitalise une chaîne de caractères
 * Ex: "appartement" -> "Appartement"
 */
export function capitalize(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Échappe les caractères spéciaux PostgreSQL LIKE (%, _, \) dans une chaîne
 * Prévient les contournements de filtre via des slugs malveillants
 * Ex: "%" -> "\\%" (empêche le wildcard de correspondre à tout)
 */
export function safeLikeEscape(str: string): string {
    return str.replace(/[%_\\]/g, '\\$&');
}

/**
 * Nettoie les noms de villes pour l'affichage
 * Supprime "Region", "Région de", "Ville de" etc.
 * Ex: "Thies Region" -> "Thiès" | "Région de Dakar" -> "Dakar"
 */
export function cleanCityName(cityName: string): string {
    if (!cityName) return '';

    return cityName
        .replace(/\s*region\s*/gi, '') // Remove "Region" (case insensitive)
        .replace(/\s*région\s*/gi, '') // Remove "Région" (with accent)
        .replace(/^région\s+de\s+/gi, '') // Remove "Région de " prefix
        .replace(/^region\s+de\s+/gi, '') // Remove "Region de " prefix
        .replace(/^ville\s+de\s+/gi, '') // Remove "Ville de " prefix
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim();
}
