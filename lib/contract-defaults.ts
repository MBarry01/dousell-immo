export const DEFAULT_CONTRACT_TEXTS = {
    // Article 1
    article_1_objet: "Le Bailleur donne en location au Preneur, qui accepte, un bien immobilier à usage exclusif d’habitation, situé à :\n\nAdresse du bien : {{adresse_bien}}\n\nLe bien se compose de :\n{{description_bien}}\n\nLe Preneur déclare avoir visité le logement avant la signature du présent contrat et le reconnaître conforme à l’usage prévu.\nLe logement est réputé être remis en bon état d’usage et de réparations locatives, sauf réserves éventuelles mentionnées dans l’état des lieux d’entrée.",

    // Article 2
    article_2_destination: "Le logement est destiné exclusivement à l’habitation personnelle du Preneur et des personnes vivant habituellement avec lui.\nToute utilisation à caractère commercial, professionnel ou administratif est strictement interdite sans l’accord écrit préalable du Bailleur.",

    // Article 3
    article_3_duree: "Le présent bail est consenti pour une durée ferme de {{duree_bail}}, prenant effet le {{date_debut}} pour se terminer le {{date_fin}}.\n\nÀ l’expiration de cette durée, le bail sera renouvelé par tacite reconduction pour des périodes successives de même durée, sauf congé donné par l’une des parties dans les conditions prévues à l’article 9.",

    // Article 4
    article_4_loyer: "Le présent bail est consenti moyennant un loyer mensuel de :\n\n{{montant_loyer}} FCFA\n\nLe loyer est payable mensuellement et d’avance, au plus tard le {{jour_paiement}} de chaque mois, au domicile du Bailleur ou auprès de toute personne désignée par lui.\n\nTout mois entamé est intégralement dû.",

    // Article 5
    article_5_charges: "Le loyer ne comprend pas les charges locatives et consommations personnelles, qui restent intégralement à la charge du Preneur, notamment :\n- eau\n- électricité\n- internet\n- téléphone\n- gaz\n- vidange de fosse septique\n- toute autre consommation individuelle\n\nLe Preneur s’engage à régler directement ces frais auprès des fournisseurs concernés.",

    // Article 6
    article_6_caution: "À la signature du présent contrat, le Preneur verse au Bailleur la somme de :\n\n{{montant_caution}} FCFA\n\nCette somme est versée à titre de dépôt de garantie et ne peut en aucun cas être utilisée pour le paiement des loyers, même en fin de bail.\nElle ne produit aucun intérêt.\n\nLe dépôt de garantie sera restitué dans un délai maximum de deux (2) mois après la restitution des clés et l’établissement de l’état des lieux de sortie, déduction faite, le cas échéant :\n- des loyers ou charges impayés\n- des réparations locatives dues au Preneur\n- des factures impayées (eau, électricité, etc.)",

    // Article 7
    article_7_obligations_preneur: "Le Preneur s’engage à :\n- Payer le loyer et les charges aux dates convenues.\n- User paisiblement des lieux et les occuper en bon père de famille.\n- Assurer l’entretien courant du logement et effectuer à ses frais les réparations locatives, notamment : remplacement d’ampoules, joints, serrures, entretien courant de la climatisation, vitres et équipements intérieurs, vidange de fosse septique.\n- Ne pas transformer les lieux (perçage du carrelage, modification des cloisons, installations fixes) sans l’accord écrit préalable du Bailleur.\n- Ne pas céder le bail ni sous-louer, en tout ou partie, le logement, y compris via des plateformes de location de courte durée, sans autorisation écrite du Bailleur.",

    // Article 8
    article_8_obligations_bailleur: "Le Bailleur s’engage à :\n- Délivrer le logement en bon état d’usage.\n- Garantir au Preneur une jouissance paisible du logement.\n- Prendre à sa charge les grosses réparations, notamment celles affectant : la structure de l’immeuble, les murs porteurs, la toiture, l’étanchéité, conformément aux dispositions du Code civil applicables au Sénégal.\n- Supporter les réparations dues à la vétusté ou à un cas de force majeure.",

    // Article 9
    article_9_resiliation: "9.1 Résiliation à l’initiative du Preneur\nLe Preneur peut résilier le présent bail à tout moment, sous réserve de respecter un préavis de trois (3) mois, notifié par écrit (lettre recommandée ou remise avec décharge).\nLe loyer reste dû pendant toute la durée du préavis.\n\n9.2 Résiliation à l’initiative du Bailleur\nLe Bailleur peut résilier le bail pour les motifs prévus par la loi sénégalaise, notamment : reprise pour occupation personnelle, vente du bien, motif légitime et sérieux.\nLe congé doit être notifié avec un préavis de six (6) mois, par acte extrajudiciaire.",

    // Article 10
    article_10_clause_resolutoire: "À défaut de paiement d’un seul terme de loyer à son échéance, ou en cas de manquement grave à l’une des obligations du Preneur, le présent bail pourra être résilié de plein droit, au choix du Bailleur, deux (2) mois après une mise en demeure restée sans effet.\nL’expulsion du Preneur pourra être ordonnée par décision judiciaire compétente.",

    // Article 11
    article_11_election_domicile: "Pour l’exécution du présent contrat :\n- le Bailleur élit domicile à son adresse indiquée ci-dessus\n- le Preneur élit domicile dans les lieux loués\n\nTout litige relatif au présent bail relève de la compétence exclusive des tribunaux du lieu de situation de l’immeuble, conformément au droit sénégalais.",

    // Article 12
    article_12_frais: "Le présent contrat est établi en deux (2) exemplaires originaux, un pour chaque partie.\nLes frais éventuels de rédaction sont supportés par : {{répartition_frais}}."
};

// Type pour TypeScript
export type ContractTexts = typeof DEFAULT_CONTRACT_TEXTS;

export interface ContractCustomTexts extends Partial<ContractTexts> {
    custom_clauses?: string;
}
