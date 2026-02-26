/**
 * Structures des documents PDF pour la Gestion Locative
 * Ces templates définissent les structures de données pour la génération interne des PDF
 * conformes au droit sénégalais (loi n° 2014-03 sur la baisse des loyers)
 */

// ============================================================
// CONTRAT DE BAIL
// ============================================================
export const BAIL_TEMPLATE = {
    header: "CONTRAT DE BAIL À USAGE D'HABITATION",
    legal_mentions: "Conforme à la loi n° 2014-03 du 28 janvier 2014 portant sur la baisse des loyers au Sénégal",

    sections: [
        {
            title: "ARTICLE 1 - IDENTIFICATION DES PARTIES",
            fields: ["bailleur_nom", "bailleur_adresse", "bailleur_telephone", "locataire_nom", "locataire_adresse", "locataire_telephone"]
        },
        {
            title: "ARTICLE 2 - DÉSIGNATION DU BIEN",
            fields: ["adresse_bien", "type_bien", "superficie", "nombre_pieces", "dependances"]
        },
        {
            title: "ARTICLE 3 - DURÉE DU BAIL",
            fields: ["date_debut", "duree", "conditions_resiliation"]
        },
        {
            title: "ARTICLE 4 - MONTANT DU LOYER ET CHARGES",
            fields: ["loyer_mensuel", "charges", "total_mensuel", "jour_paiement", "mode_paiement"]
        },
        {
            title: "ARTICLE 5 - DÉPÔT DE GARANTIE",
            fields: ["montant_caution", "conditions_restitution"]
        },
        {
            title: "ARTICLE 6 - OBLIGATIONS DU BAILLEUR",
            content: [
                "Délivrer le logement en bon état",
                "Assurer la jouissance paisible",
                "Entretenir les locaux",
                "Fournir les quittances de loyer"
            ]
        },
        {
            title: "ARTICLE 7 - OBLIGATIONS DU LOCATAIRE",
            content: [
                "Payer le loyer aux termes convenus",
                "User paisiblement des locaux",
                "Répondre des dégradations",
                "Ne pas sous-louer sans autorisation"
            ]
        },
        {
            title: "ARTICLE 8 - CLAUSE RÉSOLUTOIRE",
            content: "En cas de non-paiement du loyer, le bail sera résilié de plein droit après mise en demeure restée infructueuse pendant un mois."
        }
    ],

    signatures: {
        bailleur: { label: "LE BAILLEUR", placeholder: "Signature précédée de la mention 'Lu et approuvé'" },
        locataire: { label: "LE LOCATAIRE", placeholder: "Signature précédée de la mention 'Lu et approuvé'" }
    },

    branding: {
        logo: "Dousel",
        stamp: "CERTIFIÉ CONFORME",
        website: "www.dousell.com",
        tagline: "Votre partenaire immobilier de confiance"
    },

    footer: "Document généré électroniquement et certifié par Dousel - Dakar, Sénégal"
};

// ============================================================
// AVIS D'ÉCHÉANCE (Invoice)
// ============================================================
export const AVIS_ECHEANCE_TEMPLATE = {
    header: "AVIS D'ÉCHÉANCE DE LOYER",

    fields: [
        { key: "reference", label: "Référence" },
        { key: "periode", label: "Période concernée" },
        { key: "date_echeance", label: "Date d'échéance" },
        { key: "loyer_principal", label: "Loyer principal" },
        { key: "charges", label: "Charges" },
        { key: "total_a_payer", label: "TOTAL À PAYER" }
    ],

    payment_methods: [
        "Virement bancaire",
        "Wave",
        "Orange Money",
        "Espèces (sur quittance)"
    ],

    reminder_text: "Nous vous rappelons que le paiement est attendu au plus tard le {billing_day} du mois en cours.",

    branding: {
        logo: "Dousel",
        stamp: "DOCUMENT OFFICIEL"
    },

    footer: "En cas de difficulté de paiement, veuillez nous contacter rapidement."
};

// ============================================================
// QUITTANCE DE LOYER (Receipt)
// ============================================================
export const QUITTANCE_TEMPLATE = {
    header: "QUITTANCE DE LOYER",
    legal_text: "Je soussigné(e), propriétaire du logement désigné ci-dessous, déclare avoir reçu de mon locataire la somme indiquée en paiement du loyer.",

    fields: [
        { key: "numero_quittance", label: "N° Quittance" },
        { key: "periode", label: "Période" },
        { key: "montant_loyer", label: "Loyer" },
        { key: "montant_charges", label: "Charges" },
        { key: "total_paye", label: "Total payé" },
        { key: "date_paiement", label: "Date de paiement" },
        { key: "mode_paiement", label: "Mode de paiement" },
        { key: "reste_a_payer", label: "Reste à payer" }
    ],

    tenant_info: ["Nom complet", "Adresse du bien loué"],
    owner_info: ["Nom du bailleur", "Signature"],

    branding: {
        logo: "Dousel",
        stamp: "PAYÉ ✓",
        color: "#22c55e" // Vert pour indiquer le paiement
    },

    footer: "Cette quittance est libératoire pour la période mentionnée. Document généré électroniquement par Dousel."
};

// ============================================================
// ÉTAT DES LIEUX (Inventory)
// ============================================================
export const ETAT_DES_LIEUX_TEMPLATE = {
    header: "ÉTAT DES LIEUX",
    type: ["Entrée", "Sortie"],

    sections: [
        { name: "Entrée", items: ["Porte", "Serrure", "Interphone"] },
        { name: "Séjour", items: ["Sols", "Murs", "Plafond", "Fenêtres", "Prises électriques"] },
        { name: "Cuisine", items: ["Sols", "Murs", "Évier", "Robinetterie", "Placard"] },
        { name: "Chambres", items: ["Sols", "Murs", "Plafond", "Fenêtres", "Placards"] },
        { name: "Salle de bain", items: ["Sols", "Murs", "Lavabo", "Douche/Baignoire", "WC"] },
        { name: "Extérieur", items: ["Balcon", "Jardin", "Parking"] }
    ],

    rating_scale: ["Neuf", "Bon état", "Usage normal", "À réparer", "Mauvais état"],

    branding: {
        logo: "Dousel",
        stamp: "DOCUMENT OFFICIEL"
    },

    footer: "Les deux parties reconnaissent avoir pris connaissance de cet état des lieux et l'acceptent."
};

// ============================================================
// Types TypeScript pour utilisation dans les actions
// ============================================================
export interface BailData {
    bailleur: {
        nom: string;
        adresse: string;
        telephone: string;
        email?: string;
    };
    locataire: {
        nom: string;
        adresse: string;
        telephone: string;
        email?: string;
    };
    bien: {
        adresse: string;
        type: string;
        superficie?: number;
        nombrePieces?: number;
    };
    conditions: {
        loyerMensuel: number;
        charges?: number;
        caution: number;
        jourPaiement: number;
        dateDebut: string;
        duree?: string;
    };
}

export interface QuittanceData {
    numeroQuittance: string;
    periode: string;
    montantLoyer: number;
    montantCharges?: number;
    totalPaye: number;
    datePaiement: string;
    modePaiement?: string;
    locataire: {
        nom: string;
        adresseBien: string;
    };
}

export interface AvisEcheanceData {
    reference: string;
    periode: string;
    dateEcheance: string;
    loyerPrincipal: number;
    charges?: number;
    totalAPayer: number;
    locataire: {
        nom: string;
        adresseBien: string;
        telephone: string;
    };
}
