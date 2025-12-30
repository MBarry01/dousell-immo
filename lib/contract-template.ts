/**
 * Modèle de Contrat de Bail conforme au Droit Sénégalais
 * Références légales :
 * - Code des Obligations Civiles et Commerciales (COCC)
 * - Décret 2023 sur la baisse des loyers et la caution
 * - Loi 2024 sur les baux d'habitation
 *
 * OHADA : Pour les baux commerciaux uniquement
 */

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface ContractData {
  // Informations Bailleur (Propriétaire)
  landlord: {
    firstName: string;
    lastName: string;
    birthDate?: string;
    birthPlace?: string;
    address: string;
    phone: string;
    email?: string;
    companyName?: string; // Si société
    ninea?: string; // Numéro d'identification fiscale Sénégal
  };

  // Informations Locataire (Preneur)
  tenant: {
    firstName: string;
    lastName: string;
    birthDate?: string;
    birthPlace?: string;
    address?: string;
    phone: string;
    email?: string;
    nationalId?: string; // CNI ou Passeport
  };

  // Informations sur le Bien
  property: {
    address: string;
    description: string; // Ex: "2 chambres, 1 salon, 1 cuisine, 1 salle de bain"
    propertyType?: 'appartement' | 'maison' | 'villa' | 'studio' | 'bureau';
    floor?: string;
    buildingName?: string;
  };

  // Termes du Bail
  lease: {
    monthlyRent: number; // En FCFA
    securityDeposit: number; // Caution (max 2 mois selon loi)
    depositMonths: number; // Nombre de mois de caution (généralement 1 ou 2)
    startDate: Date;
    duration: number; // En mois (généralement 12 ou 36)
    billingDay: number; // Jour de paiement (ex: 5)
    charges?: number; // Charges mensuelles séparées
    paymentMethod?: string; // "Virement bancaire", "Espèces", etc.
  };

  // Signatures
  signatures: {
    landlordSignatureUrl?: string;
    tenantSignatureUrl?: string;
    signatureDate: Date;
    signatureCity: string;
  };

  // Clauses additionnelles (optionnel)
  additionalClauses?: string[];
}

/**
 * Nettoie le texte pour compatibilité PDF (supprime accents et caractères spéciaux)
 */
function cleanTextForPDF(text: string): string {
  return text
    // Espaces Unicode (insécables, fins, etc.) → espace normal
    // Nettoyage des espaces Unicode mais conservation des accents (WinAnsi supporté par PDF)
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ')
    // On ne remplace PLUS les accents car Helvetica (WinAnsi) les supporte
    // .replace(/[àâä]/g, 'a') ...

    // Guillemets et apostrophes (WinAnsi ne supporte pas toujours les guillemets typographiques)
    .replace(/«/g, '"')
    .replace(/»/g, '"')
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    // Tirets
    .replace(/–/g, '-')
    .replace(/—/g, '-')
    // Box drawing characters (═, │, ┌, etc.)
    .replace(/[═│┌┐└┘├┤┬┴┼─]/g, '=')
    .replace(/…/g, '...')
    // Emojis
    .replace(/[🇸🇳💰🔒📍🏠✓⛔📋]/g, '')
    .replace(/°/g, ' degres ');
}

/**
 * Génère le texte complet du contrat de bail
 */
/**
 * Génère le texte complet du contrat de bail
 * @param includeHeaderParties Si false, renvoie uniquement le corps du contrat (Articles) pour mise en page PDF avancée
 */
export function generateContractText(data: ContractData, forPdf = false, includeHeaderParties = true): string {
  const {
    landlord,
    tenant,
    property,
    lease,
    signatures,
    additionalClauses = []
  } = data;

  const startDateStr = format(lease.startDate, 'dd MMMM yyyy', { locale: fr });
  const endDate = new Date(lease.startDate);
  endDate.setMonth(endDate.getMonth() + lease.duration);
  const endDateStr = format(endDate, 'dd MMMM yyyy', { locale: fr });
  const signatureDateStr = format(signatures.signatureDate, 'dd MMMM yyyy', { locale: fr });

  const rentFormatted = lease.monthlyRent.toLocaleString('fr-SN');
  const depositFormatted = lease.securityDeposit.toLocaleString('fr-SN');

  const landlordName = landlord.companyName || `${landlord.firstName} ${landlord.lastName}`;
  const tenantName = `${tenant.firstName} ${tenant.lastName}`;

  let text = '';

  if (includeHeaderParties) {
    text += `
================================================================
                    CONTRAT DE BAIL A USAGE D'HABITATION
                          Republique du Senegal
================================================================


ENTRE LES SOUSSIGNES :


LE BAILLEUR (Propriétaire) :

${landlord.companyName ? `Société : ${landlord.companyName}` : ''}
${landlord.companyName && landlord.ninea ? `NINEA : ${landlord.ninea}` : ''}
${!landlord.companyName ? `M./Mme : ${landlord.firstName} ${landlord.lastName}` : ''}
${landlord.birthDate && landlord.birthPlace ? `Né(e) le ${landlord.birthDate} à ${landlord.birthPlace}` : ''}
Demeurant à : ${landlord.address}
Téléphone : ${landlord.phone}
${landlord.email ? `Email : ${landlord.email}` : ''}

Ci-après dénommé « LE BAILLEUR »

D'UNE PART,


ET :


LE PRENEUR (Locataire) :

M./Mme : ${tenant.firstName} ${tenant.lastName}
${tenant.birthDate && tenant.birthPlace ? `Né(e) le ${tenant.birthDate} à ${tenant.birthPlace}` : ''}
${tenant.nationalId ? `Pièce d'identité N° : ${tenant.nationalId}` : ''}
Téléphone : ${tenant.phone}
${tenant.email ? `Email : ${tenant.email}` : ''}

Ci-après dénommé « LE PRENEUR »

D'AUTRE PART,


IL A ETE CONVENU ET ARRETE CE QUI SUIT :
  `;
  }

  // CORPS DU CONTRAT (ARTICLES)
  text += `
ARTICLE 1 : DESIGNATION DES LIEUX
Le BAILLEUR donne en location au PRENEUR les locaux à usage d'habitation dont la désignation suit :
Adresse : ${property.address}
Type : ${property.propertyType || "Logement"}
Description : ${property.description}
${property.floor ? `Étage : ${property.floor}` : ''}
${property.buildingName ? `Immeuble : ${property.buildingName}` : ''}

ARTICLE 2 : DUREE DU BAIL
Le présent bail est consenti et accepté pour une durée de ${lease.duration} mois, commençant à courir le ${startDateStr} pour se terminer le ${endDateStr}.
Il se renouvellera ensuite par tacite reconduction, faute de congé donné par l'une des parties par lettre recommandée avec accusé de réception ou par acte extrajudiciaire au moins 6 mois avant l'expiration du bail (selon la loi en vigueur).

ARTICLE 3 : LOYER ET PAIEMENT
Le présent bail est consenti et accepté moyennant un loyer mensuel de ${rentFormatted} FCFA.
Le loyer est payable d'avance le ${lease.billingDay} de chaque mois. A chaque paiement, le BAILLEUR ou son représentant remettra une quittance au PRENEUR.

ARTICLE 4 : CAUTIONNEMENT
À titre de garantie de l'exécution de ses obligations, le PRENEUR verse ce jour entre les mains du BAILLEUR, qui le reconnaît et lui en donne quittance, la somme de ${depositFormatted} FCFA représentant ${lease.depositMonths} mois de loyer.
Cette somme ne sera pas productrice d'intérêts et sera remboursée en fin de bail, déduction faite des sommes dont le PRENEUR pourrait être débiteur envers le BAILLEUR. Elle ne pourra en aucun cas s'imputer sur le dernier mois de loyer.

ARTICLE 5 : OBLIGATIONS DU PRENEUR
Le PRENEUR est tenu des obligations suivantes :
1. Payer le loyer aux termes convenus.
2. User des lieux en « bon père de famille » et suivant la destination prévue au contrat (habitation).
3. Ne pas céder le bail, ni sous-louer les lieux sans l'accord écrit du BAILLEUR.
4. Répondre des dégradations et pertes qui surviennent pendant sa jouissance.
5. Ne faire aucune transformation des lieux sans l'accord écrit du BAILLEUR.
6. Laisser exécuter dans les lieux les travaux urgents nécessaires.

ARTICLE 6 : OBLIGATIONS DU BAILLEUR
Le BAILLEUR est tenu des obligations suivantes :
1. Délivrer au PRENEUR le logement en bon état d'usage et de réparation.
2. Assurer au PRENEUR la jouissance paisible des lieux pendant la durée du bail.
3. Entretenir les locaux en état de servir à l'usage prévu et y faire toutes les réparations nécessaires, autres que locatives.
4. Délivrer gratuitement une quittance au PRENEUR.

ARTICLE 7 : RESILIATION
Le présent bail pourra être résilié de plein droit, un mois après un commandement de payer resté infructueux, en cas de défaut de paiement d'un seul terme de loyer à son échéance, ou en cas d'inexécution de l'une des clauses du bail.

${additionalClauses.length > 0 ? `
ARTICLE 8 : CLAUSES PARTICULIERES
${additionalClauses.map((clause, index) => `${index + 1}. ${clause}`).join('\n')}
` : ''}

ARTICLE ${additionalClauses.length > 0 ? 9 : 8} : ELECTION DE DOMICILE / LITIGES
Pour l'exécution des présentes et leurs suites, les parties font élection de domicile :
- Le BAILLEUR en son domicile sus-indiqué (ou au cabinet de son gestionnaire).
- Le PRENEUR dans les lieux loués.

Tout litige relatif à l'interprétation ou à l'exécution du présent contrat sera de la compétence exclusive des Tribunaux de Dakar (Sénégal).

Fait à Dakar, le ${signatureDateStr}
En autant d'exemplaires que de parties.
`;

  if (forPdf) {
    return cleanTextForPDF(text);
  }

  return text;
}

/**
 * Valide les données du contrat avant génération
 */
export function validateContractData(data: ContractData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validation Bailleur
  if (!data.landlord.firstName && !data.landlord.companyName) {
    errors.push("Le nom du bailleur ou la raison sociale est requis");
  }
  if (!data.landlord.address) {
    errors.push("L'adresse du bailleur est requise");
  }
  if (!data.landlord.phone) {
    errors.push("Le téléphone du bailleur est requis");
  }

  // Validation Locataire
  if (!data.tenant.firstName || !data.tenant.lastName) {
    errors.push("Le nom complet du locataire est requis");
  }
  if (!data.tenant.phone) {
    errors.push("Le téléphone du locataire est requis");
  }

  // Validation Bien
  if (!data.property.address) {
    errors.push("L'adresse du bien est requise");
  }
  if (!data.property.description) {
    errors.push("La description du bien est requise");
  }

  // Validation Bail
  if (!data.lease.monthlyRent || data.lease.monthlyRent <= 0) {
    errors.push("Le montant du loyer est requis et doit être positif");
  }
  if (!data.lease.securityDeposit || data.lease.securityDeposit < 0) {
    errors.push("Le montant de la caution est requis");
  }
  // Vérification légale : max 2 mois de caution
  if (data.lease.securityDeposit > data.lease.monthlyRent * 2) {
    errors.push("La caution ne peut excéder 2 mois de loyer (loi sénégalaise)");
  }
  if (!data.lease.startDate) {
    errors.push("La date de début du bail est requise");
  }
  if (!data.lease.duration || data.lease.duration <= 0) {
    errors.push("La durée du bail est requise");
  }

  // Validation Signatures
  if (!data.signatures.signatureCity) {
    errors.push("Le lieu de signature est requis");
  }
  if (!data.signatures.signatureDate) {
    errors.push("La date de signature est requise");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
