import type { Metadata } from "next";
import { LandingPageJsonLd, LocalBusinessJsonLd, FAQPageJsonLd, BreadcrumbJsonLd, HowToJsonLd, AggregateRatingJsonLd } from "@/components/seo/json-ld";
import DousellNavbar from "@/components/landing/DousellNavbar";

// FAQ data for rich snippets
const landingFAQs = [
  {
    question: "Quels documents fournir pour louer un bien au Sénégal ?",
    answer: "Pour louer un bien au Sénégal avec Dousell Immo, vous devez fournir : une pièce d'identité valide (CNI ou passeport), les 3 derniers bulletins de salaire ou attestations de revenus, et un garant si nécessaire selon le type de bien."
  },
  {
    question: "Dousell Immo propose-t-il un service de gestion locative ?",
    answer: "Oui, Dousell Immo offre un service complet de gestion locative : mise en location de votre bien, perception automatique des loyers, génération des quittances, suivi technique et maintenance, gestion des contrats et états des lieux."
  },
  {
    question: "Accompagnez-vous les expatriés pour la location au Sénégal ?",
    answer: "Absolument ! Dousell Immo propose un service conciergerie spécialement conçu pour les expatriés : visites virtuelles en vidéo, signature électronique à distance, assistance francophone et accompagnement personnalisé."
  },
  {
    question: "Dans quelles villes du Sénégal trouvez-vous des biens ?",
    answer: "Dousell Immo couvre les principales villes du Sénégal : Dakar (Almadies, Ngor, Ouakam, Plateau, Sacré-Cœur), Saly, Thiès, Saint-Louis, avec des villas, appartements, studios et terrains."
  },
  {
    question: "Comment fonctionne le paiement du loyer sur Dousell Immo ?",
    answer: "Le paiement du loyer est simple et sécurisé : vous pouvez payer par Mobile Money (Orange Money, Wave, Free Money), carte bancaire ou virement. Les propriétaires reçoivent des alertes automatiques et des quittances sont générées instantanément."
  }
];

// Breadcrumb data
const breadcrumbItems = [
  { name: "Accueil", url: "https://dousell-immo.app" },
  { name: "Gestion Locative", url: "https://dousell-immo.app/pro" }
];

// HowTo data pour rich snippets "Comment faire"
const howToSteps = [
  {
    name: "Créer un compte gratuit",
    text: "Inscrivez-vous gratuitement sur Dousell Immo en quelques clics avec votre email ou votre compte Google."
  },
  {
    name: "Ajouter votre bien immobilier",
    text: "Renseignez les informations de votre bien : adresse, type (villa, appartement, terrain), surface, prix du loyer, photos."
  },
  {
    name: "Configurer la perception des loyers",
    text: "Activez le paiement en ligne pour vos locataires via Mobile Money (Orange Money, Wave) ou carte bancaire."
  },
  {
    name: "Gérer vos locataires",
    text: "Ajoutez vos locataires, générez les contrats de bail conformes au droit sénégalais et envoyez-les pour signature électronique."
  },
  {
    name: "Suivre les paiements automatiquement",
    text: "Recevez des notifications de paiement, des alertes de retard et générez les quittances de loyer automatiquement."
  }
];

export const metadata: Metadata = {
  title: "Dousell Immo - Gestion Locative & Immobilier au Sénégal",
  description: "Plateforme de gestion immobilière de référence au Sénégal. Gérez vos biens, locataires, contrats et paiements. Villas, appartements et terrains à Dakar et sur la Petite Côte.",
  keywords: [
    "gestion locative",
    "immobilier Sénégal",
    "gestion patrimoine immobilier",
    "loyer Dakar",
    "location villa Sénégal",
    "appartement Dakar",
    "terrain Saly",
    "gestion biens immobiliers",
    "logiciel gestion locative",
    "plateforme immobilière",
  ],
  openGraph: {
    type: "website",
    locale: "fr_SN",
    url: "https://dousell-immo.app/pro",
    siteName: "Dousell Immo",
    title: "Dousell Immo - Gestion Locative & Immobilier au Sénégal",
    description: "Plateforme de gestion immobilière de référence. Simplifiez la gestion de vos biens, contrats et locataires.",
    images: [
      {
        url: "/og-landing.png",
        width: 1200,
        height: 630,
        alt: "Dousell Immo - Gestion Immobilière Sénégal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dousell Immo - Gestion Locative & Immobilier au Sénégal",
    description: "Plateforme de gestion immobilière de référence. Simplifiez la gestion de vos biens.",
    images: ["/og-landing.png"],
    creator: "@dousell_immo",
  },
  alternates: {
    canonical: "https://dousell-immo.app/pro",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

interface LandingLayoutProps {
  children: React.ReactNode;
}

export default async function LandingLayout({
  children,
}: LandingLayoutProps) {
  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <LandingPageJsonLd />
      <LocalBusinessJsonLd />
      <FAQPageJsonLd faqs={landingFAQs} />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <HowToJsonLd
        name="Comment gérer ses biens immobiliers au Sénégal avec Dousell Immo"
        description="Guide étape par étape pour digitaliser la gestion de votre patrimoine immobilier au Sénégal : loyers automatiques, contrats, quittances."
        steps={howToSteps}
        totalTime="PT15M"
      />
      <AggregateRatingJsonLd
        itemName="Dousell Immo"
        itemType="SoftwareApplication"
        ratingValue={4.8}
        reviewCount={127}
      />

      {/* Smart Header - le mode est détecté côté client via l'URL */}
      <DousellNavbar />

      {children}
    </>
  );
}
