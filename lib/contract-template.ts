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

  const _landlordName = landlord.companyName || `${landlord.firstName} ${landlord.lastName}`;
  const _tenantName = `${tenant.firstName} ${tenant.lastName}`;

  let text = '';

  if (includeHeaderParties) {
    text += `
================================================================
        CONTRAT DE BAIL A USAGE D'HABITATION
              Republique du Senegal
Regi par le Code des Obligations Civiles et Commerciales (COCC)
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
ARTICLE 1 : OBJET DU BAIL ET DESCRIPTION DU BIEN
Le présent contrat est régi par les dispositions des articles relatifs au louage d'immeubles du Code des Obligations Civiles et Commerciales (COCC) en vigueur au Sénégal.
Le BAILLEUR donne en location au PRENEUR les locaux à usage d'habitation :
Adresse : ${property.address}
Type : ${property.propertyType || "Logement"}
Description : ${property.description}
${property.floor ? `Étage : ${property.floor}` : ''}
${property.buildingName ? `Immeuble : ${property.buildingName}` : ''}
Un état des lieux contradictoire d'entrée ET de sortie sera établi et signé par les deux parties.
En l'absence de réserves à la sortie, le logement est présumé restitué en bon état. L'usure normale s'apprécie en fonction de la durée d'occupation.

ARTICLE 2 : DESTINATION DES LIEUX
Usage exclusif d'habitation personnelle du PRENEUR et des personnes vivant habituellement avec lui.
Toute utilisation commerciale ou professionnelle est interdite sans accord écrit du BAILLEUR.
Le PRENEUR s'engage à occuper les lieux avec un nombre d'occupants compatible avec la superficie.
Toute sous-location, même via plateformes numériques (Airbnb etc.), est interdite sans autorisation écrite.
Toute sous-location autorisée fera l'objet d'un avenant écrit précisant durée et conditions.

ARTICLE 3 : DUREE DU BAIL
Le présent bail est consenti pour une durée de ${lease.duration} mois, du ${startDateStr} au ${endDateStr}.
Il se renouvellera par tacite reconduction, sauf congé donné par l'une des parties selon les conditions légales.
La remise des clés vaut prise de possession effective et fait courir les obligations des parties.

ARTICLE 4 : LOYER, PAIEMENT ET PENALITES DE RETARD
Loyer mensuel : ${rentFormatted} FCFA, payable d'avance le ${lease.billingDay} de chaque mois.
Une quittance est remise au PRENEUR à chaque paiement. Tout mois entamé est intégralement dû.
En cas de retard, après mise en demeure restée sans effet 7 jours, des pénalités au taux légal en vigueur au Sénégal majoré de trois (3) points seront dues.
Révision annuelle possible d'un commun accord, dans le respect des dispositions légales sénégalaises.

ARTICLE 5 : CAUTIONNEMENT
Dépôt de garantie : ${depositFormatted} FCFA (${lease.depositMonths} mois de loyer).
Non productif d'intérêts. Ne peut s'imputer sur le loyer courant.
Restitué dans les 2 mois suivant la remise des clés et l'état des lieux de sortie.
Toute retenue doit être justifiée par document probant (facture, devis signé, constat).

ARTICLE 6 : OBLIGATIONS DU PRENEUR
1. Payer le loyer aux dates convenues.
2. User des lieux en bon père de famille, usage habitation uniquement.
3. Ne pas céder le bail ni sous-louer sans accord écrit du BAILLEUR.
4. Assurer les réparations locatives ; répondre des dégradations.
5. Ne faire aucune transformation sans accord écrit du BAILLEUR.
6. Laisser exécuter les travaux urgents nécessaires.
7. Souscrire et maintenir une assurance habitation (RC, incendie, DDE) et en fournir l'attestation
   au BAILLEUR sous 30 jours puis à chaque renouvellement annuel.

ARTICLE 7 : OBLIGATIONS DU BAILLEUR
1. Délivrer le logement en bon état d'usage et de réparation.
2. Assurer la jouissance paisible des lieux pendant toute la durée du bail.
3. Prendre en charge les grosses réparations (structure, toiture, étanchéité),
   conformément au Code des obligations civiles et commerciales (COCC).
4. Supporter les réparations dues à la vétusté ou à un cas de force majeure.
5. Délivrer gratuitement une quittance à chaque paiement.

ARTICLE 8 : RESILIATION ET CLAUSE RESOLUTOIRE
Résiliation par le PRENEUR : préavis de 3 mois par écrit.
Résiliation par le BAILLEUR : préavis de 6 mois (motifs légaux – COCC).
Clause résolutoire : 2 mois après mise en demeure restée sans effet (loyer impayé ou manquement grave).
L'expulsion peut être ordonnée par décision judiciaire du tribunal compétent.

ARTICLE 9 : FORCE MAJEURE
Aucune partie ne peut être tenue responsable d'un manquement dû à un cas de force majeure
(inondation, catastrophe naturelle, acte d'autorité publique, etc.) tel que reconnu par la jurisprudence sénégalaise. Les obligations non empêchées par la force majeure demeurent exigibles.
Si la force majeure persiste plus de 3 mois, chaque partie peut résilier sans indemnité.

ARTICLE 10 : DECES DU PRENEUR
En cas de décès, le bail peut être poursuivi par le conjoint ou les descendants directs occupant les lieux,
sous notification écrite au BAILLEUR dans le mois suivant le décès.
À défaut, les héritiers disposent de 3 mois pour restituer les lieux moyennant paiement du loyer.

ARTICLE 11 : SOLIDARITE (si pluralité de preneurs)
En cas de pluralité de preneurs, ceux-ci sont solidairement et indivisiblement tenus au paiement
du loyer et des charges envers le BAILLEUR.

ARTICLE 12 : DONNEES PERSONNELLES
Les données des parties sont traitées uniquement pour l'exécution du présent bail, conformément à la loi sénégalaise sur la protection des données (CDP Sénégal) et au Règlement Général sur la Protection des Données (RGPD) pour les résidents européens. Elles ne sont pas communiquées à des tiers non autorisés.

${additionalClauses.length > 0 ? `
ARTICLE 13 : CLAUSES PARTICULIERES
${additionalClauses.map((clause, index) => `${index + 1}. ${clause}`).join('\n')}
` : ''}

ARTICLE ${additionalClauses.length > 0 ? 14 : 13} : ELECTION DE DOMICILE / JURIDICTION
- Le BAILLEUR : son domicile sus-indiqué.
- Le PRENEUR : les lieux loués.
Les parties tentent un règlement amiable dans les 30 jours avant tout recours judiciaire, sans que cette tentative amiable ne suspende les délais légaux de prescription.
Tout litige relève de la compétence exclusive des tribunaux du lieu de situation de l'immeuble (COCC).

ARTICLE ${additionalClauses.length > 0 ? 15 : 14} : VISITE ET REVENTE
En cas de mise en vente du bien, ou pour des raisons d'entretien majeur, le Preneur s'engage à permettre les visites du Bailleur ou de ses représentants après un préavis raisonnable de quarante-huit (48) heures.

Le présent contrat est établi en 2 exemplaires. Frais de rédaction : à la charge du BAILLEUR.
ANNEXES : état des lieux d'entrée, inventaire (si meublé), règlement intérieur, pièces d'identité, attestation d'assurance.

Fait à ${signatures.signatureCity}, le ${signatureDateStr}
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
