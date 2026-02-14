import type { Property } from "@/types/property";

export const properties: Property[] = [
  {
    id: "villa-horizon-almadies",
    title: "Villa Horizon Almadies",
    price: 650_000_000,
    transaction: "vente",
    location: {
      city: "Almadies",
      address: "Route des Almadies, Dakar",
      landmark: "À côté du Club Atlantique",
      coords: { lat: 14.7198, lng: -17.5104 },
    },
    images: [
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1502673530728-f79b4cab31b1?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1505692794400-0d9b95837115?auto=format&fit=crop&w=1600&q=80",
    ],
    specs: {
      surface: 420,
      rooms: 7,
      bedrooms: 5,
      bathrooms: 4,
    },
    details: {
      type: "Maison",
      year: 2019,
      heating: "Climatisation gainable",
      charges: 450_000,
      taxeFonciere: 2_500_000,
      parking: "Garage 3 voitures",
      hasBackupGenerator: true,
      hasWaterTank: true,
      security: true,
    },
    description:
      "Villa contemporaine pensée pour les ambiances océanes dakaroises : patios ventilés, rooftop vue mer et piscine miroir. Domotique KNX, cuisine Bulthaup et suite parentale panoramique.",
    disponibilite: "Disponible immédiatement",
    agent: {
      name: "Mame Diarra Ndiaye",
      photo:
        "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80",
      phone: "+221338600001",
      whatsapp: "221780000001",
    },
    proximites: {
      transports: ["Taxi Almadies - 2 min", "Bus 404 - 5 min"],
      ecoles: ["ISM Almadies - 4 min", "École Française JF - 6 min"],
      commerces: ["Sea Plaza Mini - 6 min", "Marché Ngor - 3 min"],
    },
  },
  {
    id: "plateau-skyline",
    title: "Penthouse Skyline Plateau",
    price: 480_000_000,
    transaction: "vente",
    location: {
      city: "Plateau",
      address: "Rue Carnot, Dakar Plateau",
      landmark: "Face à la BCEAO",
      coords: { lat: 14.6704, lng: -17.4307 },
    },
    images: [
      "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1522156373667-4c7234bbd804?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1505691938993-0b3e1d91f3c8?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1449247709967-d4461a6a6103?auto=format&fit=crop&w=1600&q=80",
    ],
    specs: {
      surface: 260,
      rooms: 5,
      bedrooms: 3,
      bathrooms: 3,
    },
    details: {
      type: "Appartement",
      year: 2022,
      heating: "VRV Daikin",
      charges: 350_000,
      taxeFonciere: 1_800_000,
      parking: "2 places sous-sol + valet",
      hasBackupGenerator: true,
      hasWaterTank: true,
      security: true,
    },
    description:
      "Penthouse suspendu sur le Plateau avec terrasse panoramique 120 m², ascenseur privatif, spa extérieur et vitrage anti-salin. Finitions pierre de Tivaouane et laiton local.",
    disponibilite: "Visites privées sur demande",
    agent: {
      name: "Ibrahima Sow",
      photo:
        "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?auto=format&fit=crop&w=200&q=80",
      phone: "+221338600045",
      whatsapp: "221770000045",
    },
    proximites: {
      transports: ["TER Dakar Place - 4 min", "Bus Dakar Dem Dikk - 1 min"],
      ecoles: ["Université du Sahel - 7 min", "Mariama Bâ - 10 min"],
      commerces: ["Sandaga Premium - 3 min", "Kermel - 4 min"],
    },
  },
  {
    id: "mermoz-lumiere",
    title: "Résidence Lumière Mermoz",
    price: 220_000_000,
    transaction: "location",
    location: {
      city: "Mermoz",
      address: "Cité Keur Gorgui, Dakar",
      landmark: "Derrière Canal Olympia",
      coords: { lat: 14.7005, lng: -17.4671 },
    },
    images: [
      "https://images.unsplash.com/photo-1505692996611-1ccabb8ba327?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1449247613801-ab06418e2861?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1505692794400-0d9b95837115?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1600&q=80",
    ],
    specs: {
      surface: 165,
      rooms: 4,
      bedrooms: 3,
      bathrooms: 2,
    },
    details: {
      type: "Appartement",
      year: 2018,
      heating: "Split inverter",
      charges: 210_000,
      taxeFonciere: 900_000,
      parking: "Box fermé",
      hasBackupGenerator: true,
      hasWaterTank: true,
      security: true,
    },
    description:
      "Appartement d'angle baigné de lumière avec bow-window sur les Almadies. Cuisine italienne, marbre de Thies et mobilier sur mesure signé ateliers dakarois.",
    disponibilite: "Clé en main",
    agent: {
      name: "Fatou Camara",
      photo:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=200&q=80",
      phone: "+221338600078",
      whatsapp: "221770000078",
    },
    proximites: {
      transports: ["VTC Heetch - 1 min", "Bus 85 - 3 min"],
      ecoles: ["ISJA - 5 min", "BEM - 4 min"],
      commerces: ["Auchan Mermoz - 2 min", "Sakanal Market - 4 min"],
    },
  },
  {
    id: "sacre-coeur-loft",
    title: "Loft Atelier Sacré-Cœur",
    price: 160_000_000,
    transaction: "location",
    location: {
      city: "Sacré-Cœur",
      address: "VDN extension, Dakar",
      landmark: "Face à la Boulangerie Jaune",
      coords: { lat: 14.7043, lng: -17.4679 },
    },
    images: [
      "https://images.unsplash.com/photo-1505693196193-1f52c8f81962?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1449247526693-aa049327be54?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80",
    ],
    specs: {
      surface: 135,
      rooms: 3,
      bedrooms: 2,
      bathrooms: 2,
    },
    details: {
      type: "Appartement",
      year: 2016,
      heating: "Split inverter",
      charges: 150_000,
      taxeFonciere: 600_000,
      parking: "1 place boxée",
      hasBackupGenerator: false,
      hasWaterTank: true,
      security: true,
    },
    description:
      "Loft esprit atelier avec verrière nord, béton ciré et terrasse végétalisée. Idéal pour jeunes familles ou bureaux show-room.",
    disponibilite: "Disponible sous 30 jours",
    agent: {
      name: "Abdou Karim Niang",
      photo:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
      phone: "+221338600123",
      whatsapp: "221770000123",
    },
    proximites: {
      transports: ["Taxis clandos - 1 min", "Bus 7 - 2 min"],
      ecoles: ["Sainte-Bernadette - 4 min", "Yavuz Selim - 6 min"],
      commerces: ["Hann Market - 5 min", "Auchan VDN - 4 min"],
    },
  },
  {
    id: "ngor-bay-house",
    title: "Ngor Bay House",
    price: 280_000_000,
    transaction: "vente",
    location: {
      city: "Ngor",
      address: "Corniche Ngor, Dakar",
      landmark: "À deux pas du débarcadère",
      coords: { lat: 14.738, lng: -17.5123 },
    },
    images: [
      "https://images.unsplash.com/photo-1505692795531-96c0c0c22487?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80",
    ],
    specs: {
      surface: 190,
      rooms: 4,
      bedrooms: 3,
      bathrooms: 3,
    },
    details: {
      type: "Maison",
      year: 2014,
      heating: "Climatisation réversible",
      charges: 120_000,
      taxeFonciere: 800_000,
      parking: "2 places extérieures",
      hasBackupGenerator: true,
      hasWaterTank: true,
      security: true,
    },
    description:
      "Maison patio minimaliste pensée pour vivre dedans/dehors. Patio ventilé, piscine miroir et accès direct plage de Ngor.",
    disponibilite: "Sous compromis",
    agent: {
      name: "Cheikh Faye",
      photo:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=200&q=80",
      phone: "+221338600210",
      whatsapp: "221770000210",
    },
    proximites: {
      transports: ["Pirogue Ngor - 2 min", "Bus 47 - 5 min"],
      ecoles: ["École Ngor - 3 min", "ISM - 10 min"],
      commerces: ["Marché Ngor - 1 min", "Boutiques artisanales - 2 min"],
    },
  },
  {
    id: "yoff-smart-villa",
    title: "Smart Villa Yoff",
    price: 195_000_000,
    transaction: "location",
    location: {
      city: "Yoff",
      address: "Route de l'Aéroport, Dakar",
      landmark: "près de la Mosquée de la Divinité",
      coords: { lat: 14.7443, lng: -17.4874 },
    },
    images: [
      "https://images.unsplash.com/photo-1459535653751-d571815e906b?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1505692794400-0d9b95837115?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80",
    ],
    specs: {
      surface: 210,
      rooms: 5,
      bedrooms: 4,
      bathrooms: 3,
    },
    details: {
      type: "Maison",
      year: 2020,
      heating: "Climatisation VRF",
      charges: 100_000,
      taxeFonciere: 700_000,
      parking: "Garage double",
      hasBackupGenerator: true,
      hasWaterTank: true,
      security: true,
    },
    description:
      "Villa intelligente avec panneaux solaires, gestion de charge ECS et réseau wifi maillé. Jardin tropical et rooftop vue piste.",
    disponibilite: "Disponible immédiatement",
    agent: {
      name: "Sokhna Ndiaye",
      photo:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      phone: "+221338600305",
      whatsapp: "221780000305",
    },
    proximites: {
      transports: ["AIBD Shuttle - 6 min", "Bus 29 - 3 min"],
      ecoles: ["Yoff Village - 4 min", "UNIS - 9 min"],
      commerces: ["Auchan Yoff - 2 min", "Marché Poisson - 6 min"],
    },
  },
];

export const featuredProperties = properties.slice(0, 4);

export const priceBounds = {
  min: Math.min(...properties.map((property) => property.price)),
  max: Math.max(...properties.map((property) => property.price)),
};

export const getPropertyById = (id: string) =>
  properties.find((property) => property.id === id);

export const getSimilarProperties = (property: Property) => {
  return properties.filter((candidate) => {
    if (candidate.id === property.id) return false;
    const sameCity = candidate.location.city === property.location.city;
    const priceRange = Math.abs(candidate.price - property.price) <=
      property.price * 0.2;
    return sameCity || priceRange;
  });
};

export type PropertyFilters = {
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  type?: Property["details"]["type"];
  rooms?: number;
  bedrooms?: number;
  hasBackupGenerator?: boolean;
  hasWaterTank?: boolean;
};

export const searchProperties = (filters: PropertyFilters) => {
  return properties.filter((property) => {
    if (
      filters.q &&
      !`${property.location.city} ${property.location.address} ${property.title}`
        .toLowerCase()
        .includes(filters.q.toLowerCase())
    ) {
      return false;
    }

    if (filters.minPrice && property.price < filters.minPrice) return false;
    if (filters.maxPrice && property.price > filters.maxPrice) return false;
    if (filters.type && property.details.type !== filters.type) return false;
    if (filters.rooms && property.specs.rooms < filters.rooms) return false;
    if (filters.bedrooms && property.specs.bedrooms < filters.bedrooms)
      return false;
    if (
      filters.hasBackupGenerator &&
      !property.details.hasBackupGenerator
    )
      return false;
    if (filters.hasWaterTank && !property.details.hasWaterTank) return false;

    return true;
  });
};

