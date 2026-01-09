
import { ContractData } from './contract-template';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Remplace les placeholders dans le texte par les valeurs du contrat
 * Format supporté: {{objet.propriete}} ou {{objet.sous_objet.propriete}}
 * Ex: {{tenant.firstName}}, {{lease.monthlyRent}}
 */
export function replacePlaceholders(template: string, data: ContractData): string {
    if (!template) return '';

    // Fonction récursive pour accéder aux propriétés imbriquées
    const getValue = (obj: any, path: string): any => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    // Formatage spécial pour certains champs
    const formatValue = (value: any, key: string): string => {
        if (value instanceof Date) {
            return format(value, 'dd MMMM yyyy', { locale: fr });
        }

        if (typeof value === 'number') {
            // Format monétaire pour les champs liés à l'argent
            if (key.toLowerCase().includes('rent') ||
                key.toLowerCase().includes('amount') ||
                key.toLowerCase().includes('price') ||
                key.toLowerCase().includes('deposit') ||
                key.toLowerCase().includes('charges')) {
                return value.toLocaleString('fr-FR');
            }
            return value.toString();
        }

        return value || '';
    };

    // Remplacement des patterns {{...}}
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const trimmedKey = key.trim();
        const value = getValue(data, trimmedKey);

        // Si la valeur existe, on la formate, sinon on laisse une chaine vide (ou le placeholder pour debug)
        if (value !== undefined && value !== null) {
            return formatValue(value, trimmedKey);
        }

        // Cas spéciaux calculés
        if (trimmedKey === 'lease.totalRent') {
            const rent = data.lease.monthlyRent || 0;
            const charges = data.lease.charges || 0;
            return formatValue(rent + charges, 'totalRent');
        }

        if (trimmedKey === 'landlord.fullName') {
            if (data.landlord.companyName) return data.landlord.companyName;
            return `${data.landlord.firstName} ${data.landlord.lastName}`;
        }

        if (trimmedKey === 'tenant.fullName') {
            return `${data.tenant.firstName} ${data.tenant.lastName}`;
        }

        // Mappings spécifiques pour les templates français (contract-defaults.ts uses French keys)
        const frenchMappings: Record<string, string> = {
            'montant_caution': 'lease.securityDeposit',
            'montant_loyer': 'lease.monthlyRent',
            'duree_bail': 'lease.duration',
            'date_debut': 'lease.startDate',
            'jour_paiement': 'lease.billingDay',
            'adresse_bien': 'property.address',
            'description_bien': 'property.description',
            'répartition_frais': 'lease.frais' // Pas standard, mais au cas où
        };

        if (frenchMappings[trimmedKey]) {
            const mappedPath = frenchMappings[trimmedKey];
            const mappedValue = getValue(data, mappedPath);
            if (mappedValue !== undefined && mappedValue !== null) {
                return formatValue(mappedValue, mappedPath);
            }
        }

        return ''; // Ou `[${trimmedKey}]` pour voir les manquants
    });
}
