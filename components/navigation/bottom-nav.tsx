"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Icônes personnalisées avec version filled pour l'état actif
const HomeIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={filled ? 0 : 2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {filled ? (
      <path d="M3 10.182V22h7v-7h4v7h7V10.182L12 2 3 10.182Z" />
    ) : (
      <>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </>
    )}
  </svg>
);

const SearchIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {filled ? (
      <>
        <circle cx="11" cy="11" r="8" fill="currentColor" stroke="none" />
        <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth={3} />
      </>
    ) : (
      <>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </>
    )}
  </svg>
);

const BuildingIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke={filled ? "none" : "currentColor"}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {filled ? (
      <>
        <path d="M3 22V6l9-4 9 4v16H3Z" />
        <rect x="7" y="8" width="2" height="2" fill="#05080c" />
        <rect x="11" y="8" width="2" height="2" fill="#05080c" />
        <rect x="15" y="8" width="2" height="2" fill="#05080c" />
        <rect x="7" y="12" width="2" height="2" fill="#05080c" />
        <rect x="11" y="12" width="2" height="2" fill="#05080c" />
        <rect x="15" y="12" width="2" height="2" fill="#05080c" />
        <rect x="10" y="17" width="4" height="5" fill="#05080c" />
      </>
    ) : (
      <>
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
        <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
        <path d="M10 6h4" />
        <path d="M10 10h4" />
        <path d="M10 14h4" />
        <path d="M10 18h4" />
      </>
    )}
  </svg>
);

const UserIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke={filled ? "none" : "currentColor"}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {filled ? (
      <>
        <circle cx="12" cy="8" r="5" />
        <path d="M20 21a8 8 0 1 0-16 0h16Z" />
      </>
    ) : (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 0 0-16 0" />
      </>
    )}
  </svg>
);

const navItems = [
  { href: "/", label: "Accueil", Icon: HomeIcon },
  { href: "/recherche", label: "Biens", Icon: SearchIcon },
  { href: "/pro/start", label: "Gestion", Icon: BuildingIcon },
  { href: "/compte", label: "Compte", Icon: UserIcon },
];

export const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollDelta = currentScrollY - lastScrollY.current;

          if (Math.abs(scrollDelta) > 10) {
            if (scrollDelta > 0 && currentScrollY > 100) {
              setIsVisible(false);
            } else if (scrollDelta < 0) {
              setIsVisible(true);
            }
            lastScrollY.current = currentScrollY;
          }

          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Toujours visible au changement de page
  useEffect(() => {
    setIsVisible(true);
    lastScrollY.current = 0;
  }, [pathname]);

  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(2);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 md:hidden print:hidden",
        "transition-transform duration-300 ease-out",
        !isVisible && "translate-y-[200%]"
      )}
    >
      {/* Conteneur de navigation principal */}
      <nav
        className="relative"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          height: "calc(60px + env(safe-area-inset-bottom))",
        }}
      >
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <svg
            viewBox="0 0 1000 85"
            preserveAspectRatio="none"
            className="h-full w-full"
            aria-hidden="true"
          >
            <path
              d="M 0,85 L 0,0 L 350,0 C 350,0 350,70 410,70 L 590,70 C 650,70 650,0 650,0 L 1000,0 L 1000,85 Z"
              fill="#05080c"
              fillOpacity="0.95"
            />
            {/* Outline/Border for the path */}
            <path
              d="M 0,0 L 350,0 C 350,0 350,70 410,70 L 590,70 C 650,70 650,0 650,0 L 1000,0"
              fill="none"
              stroke="white"
              strokeOpacity="0.1"
              strokeWidth="2"
            />
          </svg>
        </div>

        <div className="mx-auto flex h-full w-full items-center justify-between px-2 text-[10px] font-medium">
          {/* Section Gauche */}
          <div className="flex flex-1 justify-around">
            {leftItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-1 px-1 py-1 transition-transform active:scale-90"
                >
                  <span className={cn(
                    "inline-flex h-7 w-7 items-center justify-center transition-all duration-200",
                    active ? "text-[#F4C430]" : "text-white/50"
                  )}>
                    <item.Icon filled={active} />
                  </span>
                  <span className={cn(
                    "truncate transition-colors duration-200",
                    active ? "text-[#F4C430] font-semibold" : "text-white/50"
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Espace central pour le FAB */}
          <div className="w-[80px]" aria-hidden="true" />

          {/* Section Droite */}
          <div className="flex flex-1 justify-around">
            {rightItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  id={item.label === "Gestion" ? "tour-home-gestion" : item.label === "Compte" ? "tour-home-account" : undefined}
                  href={item.href}
                  className="flex flex-col items-center gap-1 px-1 py-1 transition-transform active:scale-90"
                >
                  <span className={cn(
                    "inline-flex h-7 w-7 items-center justify-center transition-all duration-200",
                    active ? "text-[#F4C430]" : "text-white/50"
                  )}>
                    <item.Icon filled={active} />
                  </span>
                  <span className={cn(
                    "truncate transition-colors duration-200",
                    active ? "text-[#F4C430] font-semibold" : "text-white/50"
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* FAB Central Button */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[28%] pointer-events-auto">
        <button
          onClick={() => router.push("/compte/deposer")}
          className={cn(
            "flex h-[68px] w-[68px] items-center justify-center rounded-full bg-transparent",
            "border-[2px] border-white/20 transition-all active:scale-95 shadow-xl backdrop-blur-sm",
            "hover:bg-white/5 focus:outline-none"
          )}
          aria-label="Ajouter un bien"
        >
          <Plus className="h-8 w-8 text-white stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

