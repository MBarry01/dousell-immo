"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import AceNavbar, { NavbarConfig } from "@/components/ui/ace-navbar";

// Routes where the navbar should be hidden
const HIDDEN_ROUTES = ["/pro/start"];

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
                    href: "/pro/start",
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
                    href: "/pro/syndic",
                    src: "/images/copro.webp",
                    description:
                        "Une gestion transparente, des AG en ligne et une comptabilité claire.",
                },
                {
                    title: "Investissement",
                    href: "/pro/investissement",
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
                { title: "Qui sommes-nous ?", href: "/pro/a-propos" },
                { title: "Nous contacter", href: "#contact" },
                { title: "Blog Immobilier", href: "/pro/blog" },
                { title: "Recrutement", href: "/pro/carrieres" },
            ],
        },
    },
    cta: {
        text: "Essai Gratuit",
        href: "/pro/start",
    },
};

// Configuration pour utilisateur connecté
const loggedInCta = {
    text: "Mon Espace",
    href: "/gestion",
};

// Configuration pour visiteur (mode propriétaire)
const visitorOwnerCta = {
    text: "Essai Gratuit",
    href: "/pro/start",
};

// Configuration pour visiteur (mode locataire/chercher un bien)
const visitorTenantCta = {
    text: "Voir les annonces",
    href: "/",
};

export interface DousellNavbarClientProps {
    isLoggedIn?: boolean;
    ctaOverride?: {
        text: string;
        href: string;
    };
}

export default function DousellNavbarClient({
    isLoggedIn = false,
    ctaOverride
}: DousellNavbarClientProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const urlMode = searchParams.get("mode");
    const userMode = (urlMode === "tenant" || urlMode === "owner") ? urlMode : "owner";

    // État pour la section active au scroll
    const [activeSection, setActiveSection] = useState<string | null>(null);

    const isHidden = HIDDEN_ROUTES.some(route => pathname?.startsWith(route));

    // Observer les sections pour changer le bouton dynamiquement
    useEffect(() => {
        const sections = ["hero", "features", "pricing", "demo", "locataire-section", "proprietaire-section"];
        const observerOptions = {
            root: null,
            rootMargin: "-40% 0px -40% 0px", // Déclenche quand la section est au milieu
            threshold: 0
        };

        const observerCallback: IntersectionObserverCallback = (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        sections.forEach((id) => {
            const element = document.getElementById(id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [userMode]); // Ré-exécuter si le mode change (sections différentes affichées)

    // Masquer la navbar sur certaines routes (ex: onboarding wizard)
    if (isHidden) return null;

    // Calcul du CTA dynamique
    const getDynamicCta = () => {
        // 1. Override manuel (props)
        if (ctaOverride) return ctaOverride;

        // 2. Logique Dynamique (Scroll + Mode)
        // Note: On ne retourne plus systématiquement loggedInCta ici pour permettre le changement au scroll

        if (userMode === "owner") {
            switch (activeSection) {
                case "pricing":
                    // Offre toujours pertinente même si connecté (upgrade ?)
                    return { text: "Choisir une offre", href: "/pro/start" };
                case "demo":
                case "features":
                    return isLoggedIn
                        ? { text: "Mon Espace", href: "/gestion" }
                        : { text: "Commencer gratuitement", href: "/pro/start" };
                case "hero":
                default:
                    if (isLoggedIn) {
                        return { text: "Mon Espace", href: "/gestion" };
                    }
                    // Propager le redirect pour le bouton login du hero
                    const paramsStr = searchParams?.toString();
                    const currentRef = pathname ? (paramsStr ? `${pathname}?${paramsStr}` : pathname) : "";
                    const loginHref = currentRef ? `/login?redirect=${encodeURIComponent(currentRef)}` : "/pro/start";

                    return { text: "Essai Gratuit", href: loginHref };
            }
        }

        if (userMode === "tenant") {
            switch (activeSection) {
                case "locataire-section":
                    return { text: "Rechercher", href: "#locataire-section" };
                case "hero":
                default:
                    // Si connecté en tenant, on privilégie l'action de recherche (le mode est "Chercher un bien")
                    // On laisse le bouton "Voir les annonces" primé sur "Mon Espace"
                    return visitorTenantCta;
            }
        }

        // 3. Fallback
        return isLoggedIn ? loggedInCta : visitorOwnerCta;
    };

    const cta = getDynamicCta();

    const config = {
        ...dousellConfig,
        cta,
    };

    return <AceNavbar config={config} />;
}


