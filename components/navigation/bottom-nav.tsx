"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  { href: "/recherche", label: "Annonce", Icon: SearchIcon },
  { href: "/pro/start", label: "Gestion", Icon: BuildingIcon },
  { href: "/compte", label: "Compte", Icon: UserIcon },
];

export const BottomNav = () => {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#05080c]/90 backdrop-blur-xl md:hidden print:hidden"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)",
      }}
    >
      <div className="mx-auto flex w-full max-w-full items-center justify-between px-2 py-2 text-[10px] font-medium">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              id={item.label === "Annonce" ? "tour-home-search" :
                item.label === "Gestion" ? "tour-home-gestion" :
                  item.label === "Compte" ? "tour-home-account" : undefined}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-1 px-1 py-1 min-w-0"
            >
              <span
                className={`inline-flex h-7 w-7 shrink-0 items-center justify-center transition-all duration-200 ${
                  active ? "text-[#F4C430]" : "text-white/50"
                }`}
              >
                <item.Icon filled={active} />
              </span>
              <span className={`truncate w-full text-center transition-colors duration-200 ${active ? "text-[#F4C430] font-semibold" : "text-white/50"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
