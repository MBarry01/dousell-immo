"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { BottomNav } from "@/components/navigation/bottom-nav";
import { Header } from "@/components/navigation/header";
import { Footer } from "@/components/layout/footer";
import { ScrollToTop } from "@/components/layout/scroll-to-top";

type AppShellProps = {
  children: ReactNode;
};

const hideFooterRoutes = ["/recherche", "/estimation"];

export const AppShell = ({ children }: AppShellProps) => {
  const pathname = usePathname();
  const isPropertyDetail =
    pathname?.startsWith("/biens/") && pathname.split("/").length === 3;
  const shouldHideFooter = hideFooterRoutes.some((route) =>
    pathname?.startsWith(route)
  );

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
      <div className="px-4 md:px-6">
        <Header />
        <main className="mx-auto w-full max-w-6xl pb-16 pt-[calc(env(safe-area-inset-top)+4rem)] md:pb-4 md:pt-6">
          {children}
        </main>
      </div>
      {!shouldHideFooter && (
        <div className="px-4 md:px-0">
          <Footer />
        </div>
      )}
      <BottomNav />
    </div>
  );
};

