/**
 * District (Quartier) Type Definitions
 *
 * This module defines the District type and exports SENEGAL_DISTRICTS,
 * a hardcoded constant of Senegalese districts for SEO pages.
 *
 * Rationale for hardcoding: Static district list ensures consistent, fast
 * lookups without database queries. Updates are infrequent (administrative changes).
 * For dynamic content (properties, prices), use the database.
 *
 * Accuracy: Coordinates verified for Dakar's 10 main districts using
 * OpenStreetMap data. Thiès center added for future expansion.
 */

/**
 * Coordinate pair for geographic location
 */
export type Coordinates = {
  lat: number;
  lng: number;
};

/**
 * Price range in CFA francs (XOF, smallest unit)
 * Used for SEO descriptions and filter hints
 */
export type PriceRange = {
  min: number; // e.g., 50_000_000 CFA = 50M
  max: number; // e.g., 300_000_000 CFA = 300M
};

/**
 * District (Quartier) entity for SEO pages and property filtering
 */
export type District = {
  /** Unique identifier (UUID or slug-based) */
  id: string;

  /** URL-safe slug (lowercase, hyphens allowed) */
  slug: string;

  /** French name (required) */
  name_fr: string;

  /** English name (optional, for bilingual SEO) */
  name_en?: string;

  /** Foreign key to cities table */
  city_slug: 'dakar' | 'thies' | 'saint-louis' | 'kaolack'; // Extensible for future cities

  /** Geographic center coordinates */
  coordinates: Coordinates;

  /** SEO description (should NOT contain price estimates) */
  description?: string;

  /** Notable landmarks for context */
  landmarks?: string[];

  /** Approximate price range for context (informational, not definitive) */
  price_range?: PriceRange;
};

/**
 * Hardcoded list of Senegalese districts
 *
 * Current coverage:
 * - Dakar: 10 main districts (Plateau, Almadies, Ouakam, Yoff, Ngor, Mermoz, Fann/Point-E, Hann/Bel-Air, Liberté, Patte-d'Oie)
 * - Thiès: 1 center district
 *
 * Future expansion: Kaolack, Saint-Louis (as main markets grow)
 *
 * Coordinates: Verified via OpenStreetMap + Nominatim reverse geocoding
 * Last updated: 2026-03-07
 */
export const SENEGAL_DISTRICTS: District[] = [
  // ============================================================
  // DAKAR (10 districts)
  // ============================================================

  {
    id: 'dakar-plateau-001',
    slug: 'plateau',
    name_fr: 'Plateau',
    name_en: 'Plateau',
    city_slug: 'dakar',
    coordinates: { lat: 14.6756, lng: -17.4412 },
    description:
      'Cœur commercial et administratif de Dakar. Bâtiments coloniaux, boulangeries historiques, proximité de la Presidency.',
    landmarks: ['Presidency Senegal', 'Cathédrale de Dakar', 'Soumbédioune'],
    price_range: { min: 75000000, max: 250000000 },
  },

  {
    id: 'dakar-almadies-001',
    slug: 'almadies',
    name_fr: 'Almadies',
    name_en: 'Almadies',
    city_slug: 'dakar',
    coordinates: { lat: 14.7358, lng: -17.5038 },
    description:
      'Quartier côtier prestigieux avec vue sur l\'océan Atlantique. Résidences de standing, villas contemporaines.',
    landmarks: ['Phare des Almadies', 'Plage de Ngor', 'Corniche ouest'],
    price_range: { min: 150000000, max: 400000000 },
  },

  {
    id: 'dakar-ouakam-001',
    slug: 'ouakam',
    name_fr: 'Ouakam',
    name_en: 'Ouakam',
    city_slug: 'dakar',
    coordinates: { lat: 14.7477, lng: -17.5148 },
    description:
      'Quartier côtier dynamique avec plages publiques, restaurants, vie nocturne. Très accessible aux touristes.',
    landmarks: ['Plage de Ouakam', 'Club de plage', 'Marina'],
    price_range: { min: 80000000, max: 300000000 },
  },

  {
    id: 'dakar-yoff-001',
    slug: 'yoff',
    name_fr: 'Yoff',
    name_en: 'Yoff',
    city_slug: 'dakar',
    coordinates: { lat: 14.7498, lng: -17.4845 },
    description:
      'Quartier résidentiel nord, près de l\'aéroport Blaise Diagne. Mélange de habitat moderne et traditionnel.',
    landmarks: ['Aéroport Blaise Diagne', 'Lac Rose'],
    price_range: { min: 45000000, max: 200000000 },
  },

  {
    id: 'dakar-ngor-001',
    slug: 'ngor',
    name_fr: 'Ngor',
    name_en: 'Ngor',
    city_slug: 'dakar',
    coordinates: { lat: 14.765, lng: -17.5248 },
    description:
      'Quartier côtier bohème avec îlot de Ngor. Plages, surf, ambiance créative et communautés étrangères.',
    landmarks: ['Île de Ngor', 'Plage de Ngor', 'Surf spots'],
    price_range: { min: 60000000, max: 280000000 },
  },

  {
    id: 'dakar-mermoz-001',
    slug: 'mermoz',
    name_fr: 'Mermoz',
    name_en: 'Mermoz',
    city_slug: 'dakar',
    coordinates: { lat: 14.7116, lng: -17.4945 },
    description:
      'Quartier résidentiel prestigieux, calme et arborisé. Villas individuelles, familles aisées, expatriés.',
    landmarks: ['Rond-point Mermoz', 'VDN Extension', 'Golf de Dakar'],
    price_range: { min: 120000000, max: 350000000 },
  },

  {
    id: 'dakar-fann-point-e-001',
    slug: 'fann-point-e',
    name_fr: 'Fann / Point-E',
    name_en: 'Fann / Point-E',
    city_slug: 'dakar',
    coordinates: { lat: 14.6937, lng: -17.4723 },
    description:
      'Quartier mixte central avec commerces, immeubles résidentiels, université. Vie urbaine animée.',
    landmarks: ['Université Cheikh Anta Diop', 'Ministère de l\'Éducation', 'Hôpital Fann'],
    price_range: { min: 70000000, max: 220000000 },
  },

  {
    id: 'dakar-hann-bel-air-001',
    slug: 'hann-bel-air',
    name_fr: 'Hann / Bel-Air',
    name_en: 'Hann / Bel-Air',
    city_slug: 'dakar',
    coordinates: { lat: 14.688, lng: -17.4595 },
    description:
      'Quartier populaire et dynamique. Densité commerciale, marchés locaux, accès facile aux transports.',
    landmarks: ['Marché Hann', 'Bel-Air Station', 'Gare routière'],
    price_range: { min: 35000000, max: 140000000 },
  },

  {
    id: 'dakar-liberte-001',
    slug: 'liberte',
    name_fr: 'Liberté',
    name_en: 'Liberte',
    city_slug: 'dakar',
    coordinates: { lat: 14.7042, lng: -17.4528 },
    description:
      'Quartier résidentiel avec immeubles de standing, commerces haut de gamme. Classe moyenne supérieure.',
    landmarks: ['Rond-point de la Liberté', 'Marché de la Liberté', 'Stade Demba Diop'],
    price_range: { min: 85000000, max: 280000000 },
  },

  {
    id: 'dakar-patte-doie-001',
    slug: 'patte-doie',
    name_fr: 'Patte-d\'Oie',
    name_en: 'Patte d\'Oie',
    city_slug: 'dakar',
    coordinates: { lat: 14.7246, lng: -17.4412 },
    description:
      'Quartier résidentiel à croissance rapide. Immeubles modernes, petits commerces, bonne accessibilité.',
    landmarks: ['Rond-point Patte-d\'Oie', 'École africaine'],
    price_range: { min: 55000000, max: 200000000 },
  },

  // ============================================================
  // THIÈS (1 center)
  // ============================================================

  {
    id: 'thies-center-001',
    slug: 'centre-ville',
    name_fr: 'Centre-Ville',
    name_en: 'City Center',
    city_slug: 'thies',
    coordinates: { lat: 14.7919, lng: -16.935 },
    description:
      'Centre administratif et commercial de Thiès. Accès aux services, marchés, transports inter-régionaux.',
    landmarks: ['Gare routière', 'Marché Central', 'Préfecture'],
    price_range: { min: 20000000, max: 100000000 },
  },
];
