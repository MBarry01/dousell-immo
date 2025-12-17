"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, User } from "lucide-react";

const navItems = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/recherche", label: "Annonce", icon: Search },
  { href: "/favoris", label: "Favoris", icon: Heart },
  { href: "/compte", label: "Compte", icon: User },
];

export const BottomNav = () => {
  const pathname = usePathname();

  return (
    <nav 
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#05080c] backdrop-blur-xl md:hidden"
      style={{
        // Fallback robuste pour PWA standalone mode
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
      }}
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-4 py-3 text-[11px] font-medium">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-4 py-1"
            >
              <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 ${
                  active 
                    ? "bg-white text-[#05080c] shadow-lg shadow-white/20" 
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              </span>
              <span className={`transition-colors duration-200 ${active ? "text-white font-semibold" : "text-white/50"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
