"use client";
import AceNavbar, { NavbarConfig } from "@/components/ui/ace-navbar";

const dousellConfig: NavbarConfig = {
  logo: {
    alt: "Dousell Immo",
    href: "/landing",
    src: "/logoJnOr.png",
    width: 32,
    height: 32,
  },
  mainNav: {
    // GROUPE 1 : Services Immobiliers
    firstGroup: {
      title: "Immobilier",
      items: [
        { title: "Acheter un bien", href: "/recherche?transaction=vente" },
        { title: "Louer un bien", href: "/recherche?transaction=location" },
        { title: "Vendre mon bien", href: "/compte/deposer" },
        { title: "Faire estimer", href: "/estimation" },
      ],
    },
    // GROUPE 2 : Les "Produits" phares (Menu Riche avec Images)
    products: {
      title: "Solutions",
      items: [
        {
          title: "Gestion Locative",
          href: "/gestion",
          src: "/images/gestionNav1.webp",
          description:
            "Automatisez l'envoi des quittances et encaissez vos loyers sans stress.",
        },
        {
          title: "Espace Locataire",
          href: "/locataire",
          src: "/images/payement.webp",
          description:
            "Payez votre loyer en 1 clic (Wave/OM) et téléchargez vos contrats.",
        },
        {
          title: "Syndic de Copro",
          href: "/landing/syndic",
          src: "/images/copro.webp",
          description:
            "Une gestion transparente, des AG en ligne et une comptabilité claire.",
        },
        {
          title: "Investissement",
          href: "/landing/investissement",
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
        { title: "Qui sommes-nous ?", href: "/landing/a-propos" },
        { title: "Nous contacter", href: "#contact" },
        { title: "Blog Immobilier", href: "/landing/blog" },
        { title: "Recrutement", href: "/landing/carrieres" },
      ],
    },
  },
  cta: {
    text: "Commencer",
    href: "/landing/signup",
  },
};

export default function DousellNavbar() {
  return <AceNavbar config={dousellConfig} />;
}
