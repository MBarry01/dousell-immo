export type Property = {
  id: string;
  title: string;
  price: number;
  transaction: "vente" | "location";
  status?: "disponible" | "sous-offre" | "vendu";
  location: {
    city: string;
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
    type: "Appartement" | "Maison" | "Studio";
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
    phone?: string;
    name?: string;
  };
  proximites?: {
    transports: string[];
    ecoles: string[];
    commerces: string[];
  };
};

