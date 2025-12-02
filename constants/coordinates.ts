/**
 * Dictionnaire de coordonnées GPS fixes pour le Sénégal
 * Filet de sécurité pour le géocodage - GARANTIT qu'on trouve toujours des coordonnées
 */

export const SENEGAL_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Régions (14 régions officielles)
  Dakar: { lat: 14.7167, lng: -17.4677 },
  Diourbel: { lat: 14.65, lng: -16.2333 },
  Fatick: { lat: 14.35, lng: -16.4 },
  Kaffrine: { lat: 14.1059, lng: -15.5508 },
  Kaolack: { lat: 14.15, lng: -16.0833 },
  Kédougou: { lat: 12.55, lng: -12.1833 },
  Kolda: { lat: 12.8833, lng: -14.95 },
  Louga: { lat: 15.6167, lng: -16.2167 },
  Matam: { lat: 15.6167, lng: -13.3333 },
  "Saint-Louis": { lat: 16.0179, lng: -16.37 },
  Sédhiou: { lat: 12.7081, lng: -15.5569 },
  Tambacounda: { lat: 13.7667, lng: -13.6667 },
  Thiès: { lat: 14.7833, lng: -16.9167 },
  Ziguinchor: { lat: 12.5833, lng: -16.2667 },

  // Variantes d'orthographe communes (pour robustesse)
  "Kafrine": { lat: 14.1059, lng: -15.5508 }, // Variante de Kaffrine
  "Kaolak": { lat: 14.15, lng: -16.0833 }, // Variante de Kaolack
  "Thies": { lat: 14.7833, lng: -16.9167 }, // Variante de Thiès
  "Saint Louis": { lat: 16.0179, lng: -16.37 }, // Sans tiret

  // Villes importantes (hors Dakar)
  Touba: { lat: 14.8667, lng: -15.8833 }, // Touba (région de Diourbel) - Capitale spirituelle des Mourides

  // Départements de Dakar
  Guédiawaye: { lat: 14.7736, lng: -17.3913 },
  Pikine: { lat: 14.7556, lng: -17.3969 },
  Rufisque: { lat: 14.7167, lng: -17.2667 },

  // Quartiers clés de Dakar (pour éviter les erreurs API)
  Almadies: { lat: 14.7451, lng: -17.5151 },
  Mermoz: { lat: 14.7100, lng: -17.4700 },
  Plateau: { lat: 14.6709, lng: -17.4347 },
  Ouakam: { lat: 14.7227, lng: -17.4908 },
  Yoff: { lat: 14.7604, lng: -17.4681 },
  Ngor: { lat: 14.7528, lng: -17.5158 },
  "Sacré-Cœur": { lat: 14.7114, lng: -17.4636 },
  "Les Mamelles": { lat: 14.7312, lng: -17.5003 },
  Fann: { lat: 14.6889, lng: -17.4567 },
  HLM: { lat: 14.7333, lng: -17.4333 },
  "Sicap Liberté": { lat: 14.7230, lng: -17.4616 },
  "Point E": { lat: 14.6965, lng: -17.4642 },
  "Diamniadio": { lat: 14.7202, lng: -17.1842 },
};

/**
 * Coordonnées par défaut (Dakar) - Utilisé en dernier recours absolu
 */
export const DEFAULT_COORDINATES: { lat: number; lng: number } = {
  lat: 14.7167,
  lng: -17.4677,
};

/**
 * Recherche intelligente dans le dictionnaire avec correspondance approximative
 * Gère les variations d'orthographe et les accents
 * @param query Nom de la région/ville/quartier à rechercher
 * @returns Coordonnées trouvées ou null
 */
export function findInDictionary(query: string): { lat: number; lng: number } | null {
  if (!query || !query.trim()) return null;

  const normalized = query.trim().toLowerCase();

  // 1. Recherche exacte (insensible à la casse)
  const exactMatch = Object.keys(SENEGAL_COORDINATES).find(
    (key) => key.toLowerCase() === normalized
  );
  if (exactMatch) {
    return SENEGAL_COORDINATES[exactMatch];
  }

  // 2. Recherche par inclusion (contient le nom)
  const containsMatch = Object.keys(SENEGAL_COORDINATES).find((key) => {
    const keyLower = key.toLowerCase();
    return keyLower.includes(normalized) || normalized.includes(keyLower);
  });
  if (containsMatch) {
    return SENEGAL_COORDINATES[containsMatch];
  }

  // 3. Recherche avec normalisation des accents et caractères spéciaux
  const normalizeString = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
      .replace(/[^a-z0-9\s]/g, "") // Supprimer caractères spéciaux
      .replace(/\s+/g, " ")
      .trim();

  const normalizedQuery = normalizeString(query);
  const accentMatch = Object.keys(SENEGAL_COORDINATES).find((key) => {
    const normalizedKey = normalizeString(key);
    return (
      normalizedKey === normalizedQuery ||
      normalizedKey.includes(normalizedQuery) ||
      normalizedQuery.includes(normalizedKey)
    );
  });
  if (accentMatch) {
    return SENEGAL_COORDINATES[accentMatch];
  }

  return null;
}

/**
 * @deprecated Utiliser findInDictionary à la place
 * Conservé pour compatibilité
 */
export const SENEGAL_REGIONS = SENEGAL_COORDINATES;

/**
 * @deprecated Utiliser findInDictionary à la place
 * Conservé pour compatibilité
 */
export function getRegionCoordinates(regionName: string) {
  return findInDictionary(regionName);
}

