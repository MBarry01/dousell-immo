import type { Metadata } from "next";
import { LandingPageJsonLd } from "@/components/seo/json-ld";

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
    url: "https://dousell-immo.app/landing",
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
    canonical: "https://dousell-immo.app/landing",
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

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LandingPageJsonLd />
      {children}
    </>
  );
}

