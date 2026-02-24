/**
 * Textes par défaut des articles du contrat de bail à usage d'habitation
 *
 * Références juridiques :
 * - Code des Obligations Civiles et Commerciales (COCC) – République du Sénégal
 *   Livre III, Chapitre III « Le Louage », Sections I (règles générales),
 *   II (baux d'habitation) et III (baux commerciaux).
 * - Acte uniforme OHADA sur le Droit Commercial Général (AU/DCG) : applicable
 *   aux baux commerciaux uniquement ; sans objet pour les baux d'habitation.
 *
 * Ce fichier est la source de vérité pour la génération PDF et le mode
 * personnalisation. Toute modification doit être cohérente avec le COCC.
 */

export const DEFAULT_CONTRACT_TEXTS = {

    // ─────────────────────────────────────────────────────────────────
    // ARTICLE 1 – Objet, désignation des lieux et états des lieux
    // Corrections : référence COCC + état des lieux d'entrée ET de sortie
    // ─────────────────────────────────────────────────────────────────
    article_1_objet:
        "Le présent contrat est régi par les dispositions des articles relatifs au louage d'immeubles du Code des obligations civiles et commerciales (COCC) en vigueur en République du Sénégal.\n\n" +
        "DÉSIGNATION DU BIEN :\n" +
        "Le Bailleur donne en location au Preneur, qui accepte, le bien immobilier situé à :\n\n" +
        "Adresse : {{adresse_bien}}\n\n" +
        "Consistance et composition du bien :\n" +
        "{{description_bien}}\n\n" +
        "Le Preneur déclare avoir visité le logement avant la signature du présent contrat et le reconnaître conforme à l'usage prévu.\n\n" +
        "ÉTATS DES LIEUX : Un état des lieux contradictoire d'entrée sera dressé lors de la remise des clés et signé par les deux parties. Un état des lieux de sortie, également contradictoire, sera établi à la restitution des lieux. " +
        "En l'absence de réserves formulées par le Bailleur dans un délai raisonnable après la sortie du Preneur, le logement sera présumé restitué en bon état d'entretien. L'usure normale s'apprécie en fonction de la durée d'occupation.",

    // ─────────────────────────────────────────────────────────────────
    // ARTICLE 2 – Destination des lieux, occupants et sous-location
    // Corrections : limite d'occupants + encadrement diaspora/Airbnb
    // ─────────────────────────────────────────────────────────────────
    article_2_destination:
        "Le logement est destiné exclusivement à l'habitation personnelle du Preneur et des personnes vivant habituellement avec lui (conjoint, enfants à charge, ascendants directs).\n\n" +
        "Toute utilisation à caractère commercial, professionnel ou administratif est strictement interdite sans l'accord écrit préalable du Bailleur.\n\n" +
        "Le Preneur s'engage à occuper les lieux avec un nombre d'occupants compatible avec la superficie et la destination du logement, de façon à ne pas provoquer de sur-occupation susceptible de dégrader les lieux ou de gêner le voisinage.\n\n" +
        "Toute sous-location, même partielle, y compris via des plateformes de location de courte durée (type Airbnb, Booking ou similaires), est strictement interdite sans autorisation écrite et préalable du Bailleur. " +
        "Toute sous-location autorisée devra faire l'objet d'un avenant écrit précisant la durée, les conditions et le loyer de sous-location. À défaut d'avenant, la sous-location sera réputée non autorisée et pourra entraîner la résiliation du bail.",

    // ─────────────────────────────────────────────────────────────────
    // ARTICLE 3 – Durée du bail et remise des clés
    // Corrections : "mois" explicite + date_fin calculée + remise des clés
    // ─────────────────────────────────────────────────────────────────
    article_3_duree:
        "Le présent bail est consenti pour une durée ferme de {{duree_bail}} mois, prenant effet le {{date_debut}} pour se terminer le {{date_fin}}.\n\n" +
        "À l'expiration de cette durée, le bail sera renouvelé par tacite reconduction pour des périodes successives de même durée, sauf congé donné par l'une des parties dans les conditions prévues à l'article 9.\n\n" +
        "REMISE DES CLÉS : La remise des clés au Preneur vaut prise de possession effective du logement et fait courir, à compter de ce jour, les obligations réciproques des parties, notamment l'obligation de payer le loyer. " +
        "À la fin du bail, la restitution des clés marque la fin de l'occupation et permet l'établissement de l'état des lieux de sortie.",

    // ─────────────────────────────────────────────────────────────────
    // ARTICLE 4 – Loyer, paiement, pénalités de retard et révision
    // Corrections : pénalités de retard + révision annuelle
    // ─────────────────────────────────────────────────────────────────
    article_4_loyer:
        "Le présent bail est consenti moyennant un loyer mensuel de :\n\n" +
        "{{montant_loyer}} FCFA\n\n" +
        "Le loyer est payable mensuellement et d'avance, au plus tard le {{jour_paiement}} de chaque mois, au domicile du Bailleur ou auprès de toute personne désignée par lui. À chaque paiement, le Bailleur remettra au Preneur une quittance de loyer.\n\n" +
        "Tout mois entamé est intégralement dû.\n\n" +
        "PÉNALITÉS DE RETARD : En cas de retard de paiement, une mise en demeure sera adressée au Preneur par écrit. Passé un délai de sept (7) jours après mise en demeure restée sans effet, le Bailleur sera fondé à réclamer des pénalités de retard calculées au taux légal en vigueur au Sénégal majoré de trois (3) points sur le montant impayé, sans préjudice de l'application de la clause résolutoire prévue à l'article 10.\n\n" +
        "RÉVISION DU LOYER : Le montant du loyer pourra faire l'objet d'une révision annuelle, d'un commun accord entre les parties, dans le respect des dispositions légales en vigueur au Sénégal relatives à l'encadrement des loyers d'habitation. Toute révision devra être notifiée par écrit au moins deux (2) mois avant sa prise d'effet.",

    // ─────────────────────────────────────────────────────────────────
    // ARTICLE 5 – Charges et consommations
    // ─────────────────────────────────────────────────────────────────
    article_5_charges:
        "Le loyer ne comprend pas les charges locatives et consommations personnelles, qui restent intégralement à la charge du Preneur, notamment :\n" +
        "- eau\n" +
        "- électricité\n" +
        "- internet\n" +
        "- téléphone\n" +
        "- gaz\n" +
        "- vidange de fosse septique\n" +
        "- toute autre consommation individuelle\n\n" +
        "Le Preneur s'engage à régler directement ces frais auprès des fournisseurs concernés et à en apporter justificatif à première demande du Bailleur.",

    // ─────────────────────────────────────────────────────────────────
    // ARTICLE 6 – Dépôt de garantie (caution)
    // Corrections : mention des mois + justification obligatoire des retenues
    // ─────────────────────────────────────────────────────────────────
    article_6_caution:
        "À la signature du présent contrat, le Preneur verse au Bailleur la somme de :\n\n" +
        "{{montant_caution}} FCFA\n\n" +
        "représentant {{mois_caution}} mois de loyer, versée à titre de dépôt de garantie.\n\n" +
        "Cette somme ne peut en aucun cas être utilisée pour le paiement des loyers, même en fin de bail. Elle ne produit aucun intérêt.\n\n" +
        "Le dépôt de garantie sera restitué dans un délai maximum de deux (2) mois après la restitution des clés et l'établissement contradictoire de l'état des lieux de sortie.\n\n" +
        "RETENUES : Toute retenue sur le dépôt de garantie devra être dûment justifiée par document probant (devis signé d'un artisan agréé, facture acquittée ou constat d'huissier). À défaut de justificatif, la totalité du dépôt devra être restituée. " +
        "Les retenues ne peuvent porter que sur :\n" +
        "- les loyers ou charges impayés\n" +
        "- les réparations locatives imputables au Preneur, à l'exclusion de l'usure normale\n" +
        "- les factures d'eau, d'électricité ou de fluides demeurées impayées à la sortie",

    // ─────────────────────────────────────────────────────────────────
    // ARTICLE 7 – Obligations du Preneur
    // Corrections : assurance habitation obligatoire
    // ─────────────────────────────────────────────────────────────────
    article_7_obligations_preneur:
        "Le Preneur s'engage à :\n\n" +
        "1. Payer le loyer et les charges aux dates convenues.\n" +
        "2. User paisiblement des lieux et les occuper en bon père de famille.\n" +
        "3. Assurer l'entretien courant du logement et effectuer à ses frais les réparations locatives, notamment : remplacement d'ampoules, joints, serrures, entretien courant des équipements, vitres et appareillages intérieurs.\n" +
        "4. Ne pas transformer les lieux (perçage du carrelage, modification des cloisons, installations fixes) sans l'accord écrit préalable du Bailleur.\n" +
        "5. Ne pas céder le bail ni sous-louer, en tout ou partie, le logement sans autorisation écrite du Bailleur (cf. article 2).\n" +
        "6. Laisser exécuter dans les lieux les travaux urgents et nécessaires à la conservation de l'immeuble.\n" +
        "7. ASSURANCE : Souscrire et maintenir en cours de validité, pendant toute la durée du bail, une assurance habitation (responsabilité civile locative, incendie, dégâts des eaux) auprès d'une compagnie agréée. " +
        "Le Preneur remettra l'attestation d'assurance au Bailleur dans un délai de trente (30) jours à compter de la prise de possession, puis à chaque renouvellement annuel. " +
        "Le défaut de justification d'assurance, après mise en demeure restée sans effet pendant quinze (15) jours, constitue un manquement grave susceptible d'entraîner la résiliation du bail.",

    // ─────────────────────────────────────────────────────────────────
    // ARTICLE 8 – Obligations du Bailleur
    // Correction critique : "Code civil" → "COCC" (référence légale correcte)
    // ─────────────────────────────────────────────────────────────────
    article_8_obligations_bailleur:
        "Le Bailleur s'engage à :\n\n" +
        "1. Délivrer le logement en bon état d'usage et de réparations locatives.\n" +
        "2. Garantir au Preneur une jouissance paisible du logement pendant toute la durée du bail.\n" +
        "3. Prendre à sa charge les grosses réparations, notamment celles affectant la structure de l'immeuble, les murs porteurs, la toiture et l'étanchéité, conformément aux dispositions du Code des obligations civiles et commerciales (COCC) en vigueur en République du Sénégal.\n" +
        "4. Supporter les réparations dues à la vétusté normale ou à un cas de force majeure.\n" +
        "5. Délivrer gratuitement une quittance de loyer au Preneur à chaque paiement.",

    // ─────────────────────────────────────────────────────────────────
    // ARTICLE 9 – Résiliation et préavis
    // ─────────────────────────────────────────────────────────────────
    article_9_resiliation:
        "9.1 Résiliation à l'initiative du Preneur\n" +
        "Le Preneur peut résilier le présent bail à tout moment, sous réserve de respecter un préavis de trois (3) mois, notifié par écrit (lettre recommandée avec accusé de réception ou remise avec décharge au Bailleur).\n" +
        "Le loyer reste intégralement dû pendant toute la durée du préavis, même si le logement est libéré avant son terme.\n\n" +
        "9.2 Résiliation à l'initiative du Bailleur\n" +
        "Le Bailleur peut résilier le bail pour les motifs prévus par le COCC et la loi sénégalaise, notamment : reprise pour occupation personnelle ou familiale, vente du bien, motif légitime et sérieux dûment justifié.\n" +
        "Le congé doit être notifié avec un préavis de six (6) mois minimum, par acte extrajudiciaire ou lettre recommandée avec accusé de réception.",

    // ─────────────────────────────────────────────────────────────────
    // ARTICLE 10 – Clause résolutoire
    // ─────────────────────────────────────────────────────────────────
    article_10_clause_resolutoire:
        "À défaut de paiement d'un seul terme de loyer à son échéance, ou en cas de manquement grave à l'une des obligations du Preneur (notamment défaut d'assurance, sous-location non autorisée, trouble de voisinage répété, dégradations intentionnelles), " +
        "le présent bail pourra être résilié de plein droit, au choix du Bailleur, deux (2) mois après une mise en demeure par lettre recommandée restée sans effet.\n\n" +
        "L'expulsion du Preneur et de tout occupant de son chef pourra être ordonnée par décision judiciaire du tribunal compétent du lieu de situation de l'immeuble, aux frais du Preneur défaillant.",

    // ─────────────────────────────────────────────────────────────────
    // ARTICLE 11 – Force majeure (NOUVEAU)
    // Contexte Sénégal : inondations, catastrophes naturelles
    // ─────────────────────────────────────────────────────────────────
    article_11_force_majeure:
        "Aucune des Parties ne pourra être tenue responsable d'un manquement à ses obligations contractuelles dû à un cas de force majeure tel que reconnu par la jurisprudence sénégalaise, " +
        "notamment : catastrophe naturelle, inondation, incendie d'origine extérieure, acte d'autorité publique, émeute, guerre, épidémie officiellement déclarée ou tout autre événement imprévisible, irrésistible et extérieur à la volonté des parties.\n\n" +
        "La Partie invoquant la force majeure devra en informer l'autre Partie dans les meilleurs délais par écrit, accompagnée de tout justificatif disponible. Les obligations des Parties non empêchées par la force majeure demeurent exigibles. Les prestations seront suspendues pendant la seule durée de l'empêchement, sans pénalité.\n\n" +
        "Si la force majeure persiste au-delà de trois (3) mois consécutifs, chaque Partie pourra résilier le présent bail sans indemnité, par notification écrite à l'autre Partie.",

    // ─────────────────────────────────────────────────────────────────
    // ARTICLE 12 – Décès du Preneur (NOUVEAU)
    // Importance : évite le vide juridique et protège bailleur et héritiers
    // ─────────────────────────────────────────────────────────────────
    article_12_deces_preneur:
        "En cas de décès du Preneur, le présent bail ne sera pas automatiquement résilié. Il pourra être poursuivi par le conjoint survivant, les descendants directs ou les ascendants à charge qui occupaient effectivement et paisiblement les lieux au moment du décès.\n\n" +
        "Les héritiers souhaitant poursuivre le bail devront en informer le Bailleur par écrit dans un délai d'un (1) mois à compter du décès, en justifiant de leur qualité.\n\n" +
        "À défaut d'occupant pouvant justifier d'une occupation effective au moment du décès ou à défaut de notification dans les délais, les héritiers disposeront d'un délai de trois (3) mois pour restituer les lieux en bon état, moyennant paiement du loyer et des charges pendant cette période de restitution.",

    // ─────────────────────────────────────────────────────────────────
    // ARTICLE 13 – Solidarité entre co-preneurs (NOUVEAU)
    // Applicable si plusieurs locataires (colocation, famille diaspora)
    // ─────────────────────────────────────────────────────────────────
    article_13_solidarite:
        "En cas de pluralité de preneurs (colocation, bail familial), ceux-ci seront solidairement et indivisiblement tenus envers le Bailleur au paiement du loyer, des charges et de toutes sommes pouvant être dues en vertu du présent bail.\n\n" +
        "La solidarité s'applique pour toute la durée du bail, y compris ses renouvellements, et jusqu'à libération expresse accordée par écrit par le Bailleur.\n\n" +
        "Cette clause est stipulée dans l'intérêt du Bailleur ; elle ne régit pas les rapports internes entre co-preneurs, lesquels demeurent soumis au droit commun. En cas de bail mono-preneur, cette clause est réputée non écrite.",

    // ─────────────────────────────────────────────────────────────────
    // ARTICLE 14 – Protection des données personnelles (NOUVEAU)
    // Obligatoire si gestion via plateforme SaaS numérique
    // ─────────────────────────────────────────────────────────────────
    article_14_donnees_personnelles:
        "Les données personnelles des Parties (nom, prénom, adresse, coordonnées, pièce d'identité, données financières) sont collectées et traitées uniquement aux fins de l'exécution du présent contrat de bail, conformément à la loi sénégalaise sur la protection des données (CDP Sénégal) et au Règlement Général sur la Protection des Données (RGPD) pour les résidents européens.\n\n" +
        "Ces données ne seront ni communiquées à des tiers non autorisés, ni utilisées à des fins étrangères à la gestion locative. Chaque Partie reconnaît avoir été informée de ses droits d'accès, de rectification et de suppression de ses données personnelles.\n\n" +
        "Lorsque la gestion du bail est assurée par voie numérique via une plateforme tierce agréée, les Parties consentent expressément au traitement de leurs données par ladite plateforme, dans les seules limites des finalités de gestion locative susmentionnées.",

    // ─────────────────────────────────────────────────────────────────
    // ARTICLE 15 – Élection de domicile et juridiction compétente
    // Correction : référence COCC + tentative de règlement amiable
    // ─────────────────────────────────────────────────────────────────
    article_15_election_domicile:
        "Pour l'exécution du présent contrat :\n" +
        "- le Bailleur élit domicile à son adresse indiquée ci-dessus\n" +
        "- le Preneur élit domicile dans les lieux loués\n\n" +
        "En cas de litige relatif à l'interprétation ou à l'exécution du présent bail, les Parties s'engagent à tenter de régler leur différend à l'amiable dans un délai de trente (30) jours à compter de la notification du litige par l'une des parties à l'autre, sans que cette tentative amiable ne suspende les délais légaux de prescription.\n\n" +
        "À défaut de règlement amiable dans ce délai, tout litige sera de la compétence exclusive des tribunaux du lieu de situation de l'immeuble, conformément au droit sénégalais et aux dispositions du Code des obligations civiles et commerciales (COCC).",

    // ─────────────────────────────────────────────────────────────────
    // ARTICLE 16 – Frais, exemplaires et annexes
    // Corrections : frais à la charge du Bailleur + liste des annexes
    // ─────────────────────────────────────────────────────────────────
    article_16_frais:
        "Le présent contrat est établi en deux (2) exemplaires originaux ayant la même valeur juridique, un remis à chaque partie contre émargement.\n\n" +
        "Les frais éventuels de rédaction du présent bail sont supportés par le Bailleur, sauf convention contraire entre les parties formalisée par écrit.\n\n" +
        "ANNEXES DU PRÉSENT CONTRAT (à joindre, numéroter et parapher par les deux parties) :\n" +
        "- Annexe 1 : État des lieux d'entrée contradictoire\n" +
        "- Annexe 2 : Inventaire du mobilier (si logement meublé)\n" +
        "- Annexe 3 : Règlement intérieur de l'immeuble ou de la résidence (le cas échéant)\n" +
        "- Annexe 4 : Copie de la pièce d'identité valide du Bailleur et du Preneur\n" +
        "- Annexe 5 : Attestation d'assurance habitation du Preneur\n\n" +
        "Le présent contrat, ses annexes et les éventuels avenants signés par les deux parties constituent l'intégralité de l'accord des Parties et remplacent tout accord antérieur, verbal ou écrit, portant sur le même objet.",

    // ─────────────────────────────────────────────────────────────────
    // ARTICLE 17 – Visite et revente (NOUVEAU)
    // ─────────────────────────────────────────────────────────────────
    article_17_visite_revente:
        "En cas de mise en vente du bien immobilier ou en cas de nécessité de travaux d'entretien majeurs, le Preneur s'engage à permettre au Bailleur, ou à toute personne mandatée par lui, la visite des locaux loués.\n\n" +
        "Ces visites devront faire l'objet d'un préavis raisonnable d'au moins quarante-huit (48) heures. Elles devront être effectuées pendant les jours ouvrables et à des heures convenues entre les parties, de manière à minimiser la gêne occasionnée au Preneur.",
};

// Type TypeScript automatiquement dérivé des clés réelles
export type ContractTexts = typeof DEFAULT_CONTRACT_TEXTS;

export interface ContractCustomTexts extends Partial<ContractTexts> {
    custom_clauses?: string;
}
