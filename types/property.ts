export type Property = {
  id: string;
  title: string;
  price: number;
  transaction: "vente" | "location";
  status?: "disponible" | "sous-offre" | "vendu";
  verification_status?: "pending" | "verified" | "rejected";
  proof_document_url?: string;
  verification_requested_at?: string;
  featured?: boolean;
  exclusive?: boolean;
  location: {
    city: string;
    district?: string;
    region?: string;
    address: string;
    landmark: string;
    coords: { lat: number; lng: number };
  };
  images: string[];
  specs: {
    surface: number;
    rooms: number;
    bedrooms: number;
    bathrooms: number;
    dpe: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  };
  details: {
    type: "Appartement" | "Maison" | "Studio" | "Terrain" | "Villa" | string;
    year: number;
    heating: string;
    charges?: number;
    taxeFonciere?: number;
    parking?: string;
    hasBackupGenerator?: boolean;
    hasWaterTank?: boolean;
    security?: boolean;
  };
  description: string;
  disponibilite: string;
  agent: {
    name: string;
    photo: string;
    phone: string;
    whatsapp?: string;
  };
  owner?: {
    id?: string;
    full_name?: string;
    avatar_url?: string;
    role?: "particulier" | "agent" | "admin";
    phone?: string;
    is_identity_verified?: boolean;
    updated_at?: string;
  };
  proximites?: {
    transports: string[];
    ecoles: string[];
    commerces: string[];
  };
  service_type?: "mandat_confort" | "boost_visibilite";
  contact_phone?: string;
  virtual_tour_url?: string; // Lien d'intégration (Embed SRC) Google Maps ou YouTube 360
  view_count?: number; // Compteur incrémental des vues (optimisé)

  // Champs pour la gestion par équipe
  team_id?: string; // Équipe propriétaire du bien (null = propriétaire individuel)
  created_by?: string; // Utilisateur ayant créé le bien
  validation_status?: "pending" | "payment_pending" | "approved" | "rejected" | "scheduled";
  scheduled_publish_at?: string; // Date/heure de publication programmée (ISO 8601)

  // Champs pour les annonces externes (Scraping)
  isExternal?: boolean;
  source_site?: string;
  source_url?: string;
};

