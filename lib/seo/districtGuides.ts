/**
 * District Guides & Content
 *
 * Rich content for each neighborhood to improve SEO and user experience.
 * Includes guides, price trends, amenities, and common questions per district.
 */

export interface DistrictGuide {
  slug: string
  name: string
  city: string
  description: string
  guide: string
  priceTrend: string
  amenities: string[]
  whyInvest: string[]
  faq: Array<{
    question: string
    answer: string
  }>
}

export const districtGuides: Record<string, DistrictGuide> = {
  'dakar-plateau': {
    slug: 'plateau',
    name: 'Plateau',
    city: 'Dakar',
    description:
      'Le centre d\'affaires de Dakar, idéal pour les bureaux et les appartements type pied-à-terre',
    guide: `
## Le Plateau : Cœur Économique de Dakar

Le Plateau est le quartier d'affaires par excellence de Dakar. Situé en plein centre-ville, il regroupe les principaux sièges sociaux, ambassades et institutions financières du Sénégal.

### Caractéristiques principales
- **Localisation** : Centre géographique et économique
- **Architecture** : Immeubles modernes de 5 à 15 étages
- **Population** : Professionnels, expatriés, investisseurs
- **Activité** : 24h/24, vie urbaine intense

### Prix et Investissement
Le Plateau offre les meilleures opportunités pour :
- **Bureaux** : Loyer moyen 100-150k XOF/m²/an
- **Appartements** : 50-80M XOF pour 2-3 chambres
- **Rendement locatif** : 6-8% en bureaux, 8-10% en résidentiel

### Pour qui ?
✓ Investisseurs cherchant rendement court terme
✓ Expatriés en mission professionnelle
✓ Entreprises établissant leur siège
✓ Résidences d'affaires professionnelles
    `,
    priceTrend: `
**Évolution des prix (12 derniers mois)**
- Jan 2025: 52M XOF (moyennes 2-3 chambres)
- Mar 2025: 54M XOF (+3.8%)
- Tendance: HAUSSIÈRE (stabilité économique post-élections)

**Facteurs d'appréciation**
- Croissance économique 5.2% (2024)
- Nouveau pôle urbain à Diamniadio (déport possible)
- Demande expatriée stable
    `,
    amenities: [
      'Musée IFAN',
      'Artisan Seafront',
      'Restaurants internationaux',
      'Pharmacies 24h',
      'Accès routier direct',
      'Proximité aéroport (5km)',
      'Banques et institutions',
      'Hôtels 5-étoiles',
    ],
    whyInvest: [
      'Rendement locatif garanti en bureaux',
      'Proximité des institutions (BRVM, banques)',
      'Forte demande expatriée',
      'Revente rapide si besoin',
      'Appréciation immobilière continue',
    ],
    faq: [
      {
        question: 'Quel est le rendement locatif type au Plateau?',
        answer:
          'Pour les bureaux: 6-8% annuels. Pour les appartements: 8-10%. Le rendement est plus élevé qu\'ailleurs à Dakar grâce à la forte demande professionnelle.',
      },
      {
        question: 'Est-ce sûr d\'investir au Plateau?',
        answer:
          'Oui, c\'est le quartier le plus sûr et le plus stable de Dakar. Police permanente, éclairage urbain, infrastruc dédiées à la sécurité.',
      },
      {
        question: 'Combien de temps pour revendre?',
        answer:
          'En moyenne 2-3 mois pour un bien bien-situé. La demande est constante, surtout pour bureaux.',
      },
    ],
  },

  'dakar-almadies': {
    slug: 'almadies',
    name: 'Les Almadies',
    city: 'Dakar',
    description: 'Le quartier huppé de Dakar, avec villas de luxe et vue sur l\'océan',
    guide: `
## Les Almadies : Prestige et Océan

Les Almadies sont le quartier résidentiel le plus exclusif de Dakar. Perché sur les falaises surplombant l\'océan Atlantique, il offre vue panoramique et villas de standing.

### Caractéristiques principales
- **Vue** : Océan Atlantique à 180°
- **Accessibilité** : Route touristique en corniche
- **Population** : Expatriés aisés, CEOs, diplomates
- **Ambiance** : Calme, résidentielle, sécurisée

### Types de propriétés
- **Villas** : 150-500M XOF (standing)
- **Appartements** : 80-150M XOF (avec vue)
- **Terrains** : 100-300M XOF (viabilisés)

### Avantages pour les investisseurs
- Appréciation rapide (5-7% annuels)
- Demande internationale constante
- Plus-values élevées à la revente
- Prestige et standing garantis
    `,
    priceTrend: `
**Villas prestige 2024-2025**
- Villa 300m² + terrain : 200-250M XOF
- Tendance: STABLE À HAUSSE (+2-3% annuel)
- Buyer profile: Diaspora, expatriés, CEOs

**Terrain seul (500m²)**
- Prix moyen: 120M XOF
- Tendance: +3% annuel (rare disponibilité)
    `,
    amenities: [
      'Route touristique pittoresque',
      'Club nautique (voile, plongée)',
      'Restaurants gastronomiques',
      'Piscines privées',
      'Jardin botanique IFAN',
      'Lighthouse point (Point de repère)',
      'Plages semi-privées',
      'Sécurité renforcée',
    ],
    whyInvest: [
      'Appréciation garantie (marché spéculatif)',
      'Demande internationale forte',
      'Rareté des propriétés',
      'Lifestyle premium',
      'Plus-values importantes',
    ],
    faq: [
      {
        question: 'Pourquoi les prix des Almadies montent?',
        answer:
          'Offre très limitée, demande diaspora croissante, rareté du terrain avec vue océan. Les Almadies sont uniques à Dakar.',
      },
      {
        question: 'Est-il rentable de louer au Almadies?',
        answer:
          'Le rendement locatif (3-4%) est moins important que l\'appréciation. L\'objectif est plutôt la plus-value à long terme.',
      },
    ],
  },

  'dakar-medina': {
    slug: 'medina',
    name: 'Médina',
    city: 'Dakar',
    description: 'Quartier familial et abordable, parfait pour la classe moyenne',
    guide: `
## Médina : Famille & Accessibilité

Médina est un quartier résidentiel familial au centre de Dakar. Moins cher que Plateau ou Almadies, il offre un bon rapport qualité-prix pour familles et primo-accédants.

### Caractéristiques
- **Type d\'habitat** : Villas individuelles, immeubles 4-6 étages
- **Population** : Familles sénégalaises, classe moyenne
- **Ambiance** : Tranquille, commerces locaux
- **Accessibilité** : Très bonne desserte routière

### Prix typiques
- Studio/1-chambre: 8-15M XOF
- 2-3 chambres: 25-40M XOF
- Villa 4-chambres: 60-90M XOF
    `,
    priceTrend: `
**Évolution 2024-2025**
- Prix moyen 2-chambres: 28M XOF (+4% depuis 2024)
- Tendance: HAUSSIÈRE MODÉRÉE
- Driver: Migration classe moyenne du centre-ville
    `,
    amenities: [
      'Université Cheikh Anta Diop (proximité)',
      'Écoles internationales',
      'Marché central',
      'Transports en commun',
      'Cliniques et pharmacies',
      'Espaces verts',
      'Écoles publiques',
      'Petits commerces',
    ],
    whyInvest: [
      'Prix accessibles pour primo-accédants',
      'Rendement locatif solide (8-10%)',
      'Demande familiale stable',
      'Proche universités (étudiants)',
      'Amélioration progressive du quartier',
    ],
    faq: [
      {
        question: 'Est-ce un bon quartier pour primo-accédants?',
        answer:
          'Oui, Médina offre le meilleur rapport prix/qualité pour familles. Moins cher que Plateau, plus tranquille.',
      },
    ],
  },

  'dakar-sacre-coeur': {
    slug: 'sacre-coeur',
    name: 'Sacré-Cœur',
    city: 'Dakar',
    description:
      'Quartier résidentiel central de standing intermédiaire, très demandé par expatriés',
    guide: `
## Sacré-Cœur : Confort Central

Sacré-Cœur est le quartier intermédiaire idéal. Moins cher que Almadies mais mieux que Médina, il combine confort, accessibilité et sécurité.

### Caractéristiques
- **Habitat** : Villas et duplex semi-modernes
- **Population** : Classe moyenne supérieure, expatriés
- **Localisation** : Entre centre-ville et résidences
- **Atmosphère** : Tranquille avec commodités

### Offre immobilière
- Duplex neuf: 80-120M XOF
- Villa 3-chambres: 90-140M XOF
- Rendement: 7-9% annuel
    `,
    priceTrend: `
**2025 Outlook**
- Stabilité prix envisagée
- Forte demande expatriée
- Offre nouvelle (promoteurs immobiliers)
    `,
    amenities: [
      'Écoles primaires/secondaires',
      'Restaurants modernes',
      'Pharmacies',
      'Commerces variés',
      'Parcs et jardins',
      'Clubs de loisirs',
      'Centre commercial',
      'Sécurité renforcée',
    ],
    whyInvest: [
      'Bon rapport prix/localisation',
      'Rendement locatif intéressant',
      'Demande stable',
      'Potentiel d\'appréciation',
      'Qualité de vie',
    ],
    faq: [
      {
        question: 'Pourquoi choisir Sacré-Cœur?',
        answer:
          'C\'est le sweet spot entre Plateau (cher, affaires) et Médina (moins chic). Famille, tranquillité, rendement équilibré.',
      },
    ],
  },
}

/**
 * Get guide for a specific district
 */
export function getDistrictGuide(slug: string): DistrictGuide | null {
  const key = Object.keys(districtGuides).find((k) => k.includes(slug))
  return key ? districtGuides[key as keyof typeof districtGuides] : null
}

/**
 * Get all guides for a city
 */
export function getCityGuides(city: string): DistrictGuide[] {
  return Object.values(districtGuides).filter((g) => g.city === city)
}

/**
 * Format price trend for display
 */
export function getPriceTrendHTML(slug: string): string | null {
  const guide = getDistrictGuide(slug)
  return guide
    ? guide.priceTrend
        .split('\n')
        .map((line) => line.trim())
        .filter((l) => l)
        .join('<br />')
    : null
}
