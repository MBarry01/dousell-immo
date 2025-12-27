"use client";

import { ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";

import { BottomNav } from "@/components/navigation/bottom-nav";
import { Header } from "@/components/navigation/header";
import { Footer } from "@/components/layout/footer";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type AppShellProps = {
  children: ReactNode;
};

const hideFooterRoutes = ["/recherche", "/estimation"];

const segmentLabels: Record<string, string> = {
  annonce: "Annonce",
  annonces: "Annonces",
  biens: "Biens",
  "a-propos": "À propos",
  apropos: "À propos",
  contact: "Contact",
  compte: "Compte",
  deposer: "Déposer",
  recherche: "Recherche",
  favoris: "Favoris",
  agence: "Agence",
  blog: "Blog",
  notifications: "Notifications",
  profil: "Profil",
};

const formatSegmentLabel = (segment: string) => {
  const normalized = segment.toLowerCase();
  if (segmentLabels[normalized]) {
    return segmentLabels[normalized];
  }

  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const AppShell = ({ children }: AppShellProps) => {
  const pathname = usePathname();
  const isPropertyDetail =
    pathname?.startsWith("/biens/") && pathname.split("/").length === 3;
  const shouldHideFooter = hideFooterRoutes.some((route) =>
    pathname?.startsWith(route)
  );

  const breadcrumbItems = useMemo(() => {
    if (!pathname || pathname === "/") {
      return [];
    }

    const segments = pathname.split("/").filter(Boolean);
    if (!segments.length) {
      return [];
    }

    const items: BreadcrumbItem[] = [{ label: "Accueil", href: "/" }];
    let cumulativePath = "";

    segments.forEach((segment, index) => {
      cumulativePath += `/${segment}`;
      const isLast = index === segments.length - 1;
      const label = formatSegmentLabel(segment);

      // Éviter d'afficher des IDs opaques (> 24 caractères)
      if (segment.length > 24) {
        items.push({
          label: "Détail",
        });
        return;
      }

      items.push({
        label,
        href: isLast ? undefined : cumulativePath,
      });
    });

    return items;
  }, [pathname]);

  const shouldShowBreadcrumbs = breadcrumbItems.length > 1;

  if (isPropertyDetail) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-[#05080c] via-[#05080c] to-[#040507] text-white">
        <ScrollToTop />
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#05080c] via-[#05080c] to-[#040507] text-white">
      <ScrollToTop />
      <div className="px-4 md:px-6 print:hidden">
        <Header />
      </div>
      <main
        className="mx-auto w-full max-w-6xl md:pb-4 md:pt-6 print:p-0 print:max-w-none"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 4rem)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4.5rem)"
        }}
      >
        {shouldShowBreadcrumbs && (
          <div className="mb-6 print:hidden">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        )}
        {children}
      </main>
      {!shouldHideFooter && (
        <div className="px-4 md:px-0 print:hidden">
          <Footer />
        </div>
      )}
      <BottomNav />
    </div>
  );
};

