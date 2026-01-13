/**
 * Données pour la landing page Dousell Immo
 * Design System: "Luxe & Teranga"
 */

// ===========================================
// HERO SECTION
// ===========================================
export const heroData = {
  badge: {
    text: "Plateforme N°1 au Sénégal",
    highlight: "Nouveau",
  },
  headline: "Investissez dans l'immobilier de luxe au Sénégal",
  caption:
    "Villas, terrains et appartements vérifiés à Dakar et sur la Petite Côte. Une expérience d'achat sécurisée et transparente.",
  primaryButton: {
    text: "Découvrir les biens",
    href: "/recherche",
  },
  secondaryButton: {
    text: "Planifier une visite",
    href: "/planifier-visite",
  },
  // Remplacer par votre vidéo stock immobilier
  // videoSrc: "https://example.com/luxury-real-estate.mp4",
  // videoPoster: "/images/video-poster.jpg",
  backgroundImage: "/monument.png",
  techBadges: [
    { label: "100% Vérifié" },
    { label: "Paiement Sécurisé" },
    { label: "Support 24/7" },
    { label: "Visite Virtuelle" },
  ],
};

// ===========================================
// METRICS SECTION
// ===========================================
export const metricsData = {
  heading: "Dousell en chiffres",
  caption:
    "Des milliers de clients nous font confiance pour leur projet immobilier au Sénégal.",
  metrics: [
    { value: 500, suffix: "+", label: "Biens disponibles" },
    { value: 1200, suffix: "+", label: "Clients satisfaits" },
    { value: 98, suffix: "%", label: "Taux de satisfaction" },
    { value: 15, suffix: "+", label: "Villes couvertes" },
  ],
};

// ===========================================
// FEATURES SECTION
// ===========================================
export const featuresData = {
  heading: "Pourquoi choisir Dousell ?",
  caption:
    "Une plateforme pensée pour simplifier votre investissement immobilier au Sénégal.",
  features: [
    {
      icon: "shield",
      title: "100% Sécurisé",
      description:
        "Tous les paiements sont sécurisés via PayDunya. Vos transactions sont protégées de bout en bout.",
    },
    {
      icon: "badgeCheck",
      title: "Biens Vérifiés",
      description:
        "Chaque propriété est vérifiée par notre équipe. Titres fonciers, photos et descriptions authentiques.",
    },
    {
      icon: "mapPin",
      title: "Expertise Locale",
      description:
        "Notre équipe connaît parfaitement le marché sénégalais. Dakar, Thiès, Petite Côte et plus.",
    },
    {
      icon: "clock",
      title: "Accompagnement Complet",
      description:
        "De la recherche à la signature, nous vous accompagnons à chaque étape de votre projet.",
    },
    {
      icon: "users",
      title: "Réseau d'Agents",
      description:
        "Accédez à notre réseau d'agents immobiliers certifiés pour des visites et conseils personnalisés.",
    },
    {
      icon: "fileText",
      title: "Gestion Locative",
      description:
        "Confiez-nous la gestion de vos biens : locataires, loyers, maintenance, tout est géré pour vous.",
    },
  ],
};

// ===========================================
// TESTIMONIALS SECTION
// ===========================================
export const testimonialsData = {
  heading: "Ce que disent nos clients",
  caption:
    "Découvrez les témoignages de ceux qui ont fait confiance à Dousell pour leur projet immobilier.",
  testimonials: [
    {
      rating: 5,
      title: "Achat sans stress",
      content:
        "J'ai trouvé ma villa à Saly en moins de 2 semaines. L'équipe Dousell m'a accompagné de A à Z. Je recommande vivement !",
      name: "Aminata D.",
      role: "Propriétaire à Saly",
    },
    {
      rating: 5,
      title: "Investissement réussi",
      content:
        "En tant que membre de la diaspora, j'avais des craintes pour investir à distance. Dousell a tout géré de manière transparente.",
      name: "Mamadou S.",
      role: "Investisseur - France",
    },
    {
      rating: 5,
      title: "Service exceptionnel",
      content:
        "La gestion locative de mon appartement à Dakar est impeccable. Je reçois mes loyers chaque mois sans souci.",
      name: "Fatou N.",
      role: "Propriétaire bailleur",
    },
    {
      rating: 4,
      title: "Très professionnel",
      content:
        "Équipe réactive et à l'écoute. Ils ont compris mes besoins et m'ont proposé des biens correspondant exactement à mes critères.",
      name: "Oumar B.",
      role: "Acheteur - Dakar",
    },
    {
      rating: 5,
      title: "Plateforme intuitive",
      content:
        "Le site est facile à utiliser et les annonces sont détaillées. J'ai pu visiter plusieurs biens avant de faire mon choix.",
      name: "Aissatou K.",
      role: "Propriétaire à Thiès",
    },
    {
      rating: 5,
      title: "Confiance totale",
      content:
        "Après une mauvaise expérience ailleurs, Dousell m'a redonné confiance. Tout est vérifié et transparent.",
      name: "Ibrahima G.",
      role: "Investisseur - USA",
    },
  ],
};

// ===========================================
// CTA SECTION
// ===========================================
export const ctaData = {
  label: "Prêt à investir ?",
  heading: "Trouvez votre bien idéal au Sénégal",
  caption:
    "Rejoignez des milliers de clients satisfaits et réalisez votre projet immobilier avec Dousell.",
  primaryButtonText: "Voir les biens disponibles",
  primaryButtonHref: "/recherche",
  secondaryButtonText: "Nous contacter",
  secondaryButtonHref: "/contact",
  stat: {
    value: "24h",
    label: "Réponse garantie",
  },
};

// ===========================================
// FAQ SECTION
// ===========================================
export const faqData = {
  heading: "Questions fréquentes",
  caption:
    "Tout ce que vous devez savoir avant d'investir dans l'immobilier au Sénégal.",
  items: [
    {
      question: "Comment sont vérifiés les biens sur Dousell ?",
      answer:
        "Chaque propriété passe par un processus de vérification rigoureux. Nous vérifions les titres fonciers, l'authenticité des photos, et effectuons des visites terrain. Seuls les biens conformes sont publiés sur notre plateforme.",
    },
    {
      question: "Puis-je acheter depuis l'étranger ?",
      answer:
        "Absolument ! Dousell est conçu pour la diaspora sénégalaise et les investisseurs internationaux. Nous proposons des visites virtuelles, un accompagnement à distance, et des paiements sécurisés internationaux.",
    },
    {
      question: "Quels sont les frais de service ?",
      answer:
        "Nos frais varient selon le type de transaction. Pour l'achat, comptez environ 3% du prix de vente. Pour la gestion locative, nous prélevons 10% des loyers perçus. Contactez-nous pour un devis personnalisé.",
    },
    {
      question: "Comment fonctionne la gestion locative ?",
      answer:
        "Notre service de gestion locative prend en charge la recherche de locataires, la rédaction des baux, la collecte des loyers, et la gestion de la maintenance. Vous recevez un rapport mensuel détaillé.",
    },
    {
      question: "Quelles zones géographiques couvrez-vous ?",
      answer:
        "Nous sommes présents à Dakar et sa banlieue, la Petite Côte (Saly, Somone, Ngaparou), Thiès, Saint-Louis, et bientôt Ziguinchor. Notre réseau s'étend continuellement.",
    },
    {
      question: "Comment planifier une visite ?",
      answer:
        "Vous pouvez planifier une visite directement depuis la fiche du bien ou via notre page de contact. Notre équipe vous recontactera sous 24h pour organiser le rendez-vous.",
    },
  ],
};
