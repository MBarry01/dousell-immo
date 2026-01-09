"use client";
import AceNavbar, { NavbarConfig } from "@/components/ui/ace-navbar";

const dousellConfig: NavbarConfig = {
  logo: {
    alt: "Dousell Immo",
    href: "/landing",
    text: "Dousell",
  },
  mainNav: {
    // GROUPE 1 : Services Immobiliers
    firstGroup: {
      title: "Immobilier",
      items: [
        { title: "Acheter un bien", href: "/annonces?type=achat" },
        { title: "Louer un bien", href: "/annonces?type=location" },
        { title: "Vendre mon bien", href: "/vendre" },
        { title: "Faire estimer", href: "/estimation" },
      ],
    },
    // GROUPE 2 : Les "Produits" phares (Menu Riche avec Images)
    products: {
      title: "Solutions",
      items: [
        {
          title: "Gestion Locative",
          href: "/gestion-locative",
          src: "/images/gestionNav1.webp",
          description:
            "Automatisez l'envoi des quittances et encaissez vos loyers sans stress.",
        },
        {
          title: "Espace Locataire",
          href: "/portal",
          src: "/images/payement.webp",
          description:
            "Payez votre loyer en 1 clic (Wave/OM) et téléchargez vos contrats.",
        },
        {
          title: "Syndic de Copro",
          href: "/syndic",
          src: "/images/copro.webp",
          description:
            "Une gestion transparente, des AG en ligne et une comptabilité claire.",
        },
        {
          title: "Investissement",
          href: "/investissement",
          src: "/images/Invesstissement.webp",
          description:
            "Projets clés en main à haute rentabilité locative au Sénégal.",
        },
      ],
    },
    // GROUPE 3 : Entreprise
    lastGroup: {
      title: "Dousell",
      items: [
        { title: "Qui sommes-nous ?", href: "/apropos" },
        { title: "Nous contacter", href: "#contact" },
        { title: "Blog Immobilier", href: "/blog" },
        { title: "Recrutement", href: "/carrieres" },
      ],
    },
  },
  cta: {
    text: "Commencer",
    href: "/auth/signup",
  },
};

export default function DousellNavbar() {
  return <AceNavbar config={dousellConfig} />;
}
