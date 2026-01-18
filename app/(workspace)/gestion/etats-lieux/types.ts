// Types for inventory reports
export interface RoomItem {
    name: string;
    condition: 'bon' | 'moyen' | 'mauvais' | 'absent' | '';
    comment: string;
    photos: string[];
}

export interface Room {
    name: string;
    items: RoomItem[];
}

export interface MeterReadings {
    electricity?: number;
    water?: number;
    gas?: number;
}

export interface InventoryReport {
    id: string;
    lease_id: string;
    owner_id: string;
    type: 'entry' | 'exit';
    status: 'draft' | 'completed' | 'signed';
    report_date: string;
    meter_readings: MeterReadings;
    rooms: Room[];
    general_comments?: string;
    owner_signature?: string;
    tenant_signature?: string;
    signed_at?: string;
    pdf_url?: string;
    created_at: string;
    updated_at: string;
    // Joined data
    lease?: {
        tenant_name: string;
        property_address: string;
    };
}

// Property types for intelligent templates
export type PropertyType = 'chambre' | 'studio' | 'f2' | 'f3' | 'f4' | 'villa' | 'custom';

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
    'chambre': 'Chambre meublée',
    'studio': 'Studio',
    'f2': 'Appartement F2',
    'f3': 'Appartement F3/F4',
    'f4': 'Appartement F4+',
    'villa': 'Villa / Maison',
    'custom': 'Personnalisé'
};

// Common items
const createItem = (name: string): RoomItem => ({ name, condition: '', comment: '', photos: [] });

// Room templates with simplified consolidated categories
const ROOM_CHAMBRE: Room = {
    name: 'Chambre',
    items: [
        createItem('Sols (Revêtement, Plinthes)'),
        createItem('Murs (Peinture, État)'),
        createItem('Plafonds'),
        createItem('Huisseries (Portes, Fenêtres, Volets)'),
        createItem('Électricité (Prises, Éclairage, Interrupteurs)'),
        createItem('Climatisation / Ventilation'),
        createItem('Menuiserie (Placards, Rangements)'),
        createItem('Mobilier (Lit, Matelas, Table, Chaise...)'),
    ]
};

const ROOM_SDB: Room = {
    name: 'Salle de bain / WC',
    items: [
        createItem('Sols (Carrelage)'),
        createItem('Murs (Faïence, Peinture)'),
        createItem('Plafonds'),
        createItem('Huisseries (Porte, Fenêtre)'),
        createItem('Sanitaires (Lavabo, Douche, WC, Baignoire)'),
        createItem('Plomberie (Robinetterie, Évacuation)'),
        createItem('Électricité (Éclairage, Prise rasoir)'),
        createItem('Accessoires (Miroir, Porte-serviette...)'),
    ]
};

const ROOM_CUISINE: Room = {
    name: 'Cuisine',
    items: [
        createItem('Sols'),
        createItem('Murs (Crédence, Peinture)'),
        createItem('Plafonds'),
        createItem('Huisseries (Fenêtre, Porte)'),
        createItem('Sanitaires (Évier)'),
        createItem('Plomberie (Robinetterie, Arrivées d\'eau)'),
        createItem('Menuiserie (Plan de travail, Placards)'),
        createItem('Électricité (Prises, Éclairage, Hotte)'),
        createItem('Équipement (Plaques, Four...)'),
    ]
};

const ROOM_SALON: Room = {
    name: 'Salon / Séjour',
    items: [
        createItem('Sols'),
        createItem('Murs'),
        createItem('Plafonds'),
        createItem('Huisseries (Baies vitrées, Fenêtres, Volets)'),
        createItem('Électricité (Prises, Éclairage, TV/Tel)'),
        createItem('Climatisation / Ventilation'),
        createItem('Mobilier (Canapé, Table...)'),
    ]
};

const ROOM_ENTREE: Room = {
    name: 'Entrée',
    items: [
        createItem('Huisseries (Porte d\'entrée)'),
        createItem('Serrurerie (Clés, Verrous)'),
        createItem('Sols'),
        createItem('Murs'),
        createItem('Plafonds'),
        createItem('Électricité (Tableau, Interphone, Éclairage)'),
    ]
};

const ROOM_EXTERIEUR: Room = {
    name: 'Extérieur / Cour',
    items: [
        createItem('Clôture / Portail / Murs extérieurs'),
        createItem('Sols (Cour, Terrasse, Allées)'),
        createItem('Façades'),
        createItem('Éclairage extérieur'),
        createItem('Point d\'eau / Robinet'),
    ]
};

// Intelligent templates by property type
export const PROPERTY_TEMPLATES: Record<PropertyType, Room[]> = {
    // Chambre meublée - juste la chambre
    'chambre': [
        ROOM_CHAMBRE,
    ],

    // Studio - pièce unique avec coin cuisine + SDB
    'studio': [
        {
            name: 'Studio (pièce principale)',
            items: [
                createItem('Huisseries (Porte entrée, Fenêtres, Volets)'),
                createItem('Serrurerie (Clés)'),
                createItem('Sols'),
                createItem('Murs'),
                createItem('Plafonds'),
                createItem('Électricité (Tableau, Prises, Éclairage)'),
                createItem('Climatisation'),
                createItem('Menuiserie (Placards)'),
                createItem('Mobilier (Lit, Table...)'),
            ]
        },
        {
            name: 'Coin cuisine',
            items: [
                createItem('Sanitaires (Évier)'),
                createItem('Plomberie (Robinetterie)'),
                createItem('Menuiserie (Plan de travail, Placards)'),
                createItem('Équipement (Plaques...)'),
            ]
        },
        ROOM_SDB,
    ],

    // F2 - Salon + 1 Chambre + Cuisine + SDB
    'f2': [
        ROOM_ENTREE,
        ROOM_SALON,
        { ...ROOM_CHAMBRE, name: 'Chambre' },
        ROOM_CUISINE,
        ROOM_SDB,
    ],

    // F3 - Salon + 2 Chambres + Cuisine + SDB
    'f3': [
        ROOM_ENTREE,
        ROOM_SALON,
        { ...ROOM_CHAMBRE, name: 'Chambre 1' },
        { ...ROOM_CHAMBRE, name: 'Chambre 2' },
        ROOM_CUISINE,
        ROOM_SDB,
    ],

    // F4+ - Salon + 3 Chambres + Cuisine + SDB
    'f4': [
        ROOM_ENTREE,
        ROOM_SALON,
        { ...ROOM_CHAMBRE, name: 'Chambre 1' },
        { ...ROOM_CHAMBRE, name: 'Chambre 2' },
        { ...ROOM_CHAMBRE, name: 'Chambre 3' },
        ROOM_CUISINE,
        ROOM_SDB,
    ],

    // Villa - Tout + Extérieur
    'villa': [
        ROOM_ENTREE,
        ROOM_SALON,
        { ...ROOM_CHAMBRE, name: 'Chambre 1' },
        { ...ROOM_CHAMBRE, name: 'Chambre 2' },
        { ...ROOM_CHAMBRE, name: 'Chambre 3' },
        ROOM_CUISINE,
        ROOM_SDB,
        ROOM_EXTERIEUR,
    ],

    // Custom - same as F2 for flexibility
    'custom': [
        ROOM_ENTREE,
        ROOM_SALON,
        { ...ROOM_CHAMBRE, name: 'Chambre' },
        ROOM_CUISINE,
        ROOM_SDB,
    ],
};

// Helper function to get rooms for a property type
export function getRoomsForPropertyType(type: PropertyType): Room[] {
    return JSON.parse(JSON.stringify(PROPERTY_TEMPLATES[type] || PROPERTY_TEMPLATES['f2']));
}

// Default rooms (for backward compatibility)
export const DEFAULT_ROOMS: Room[] = PROPERTY_TEMPLATES['f2'];
