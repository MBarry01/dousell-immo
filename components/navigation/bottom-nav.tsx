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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#05080c]/90 backdrop-blur-xl md:hidden print:hidden"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)",
      }}
    >
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-2 py-2 text-[10px] font-medium">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-0.5 px-1 py-1 min-w-0"
            >
              <span
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${active
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-white/50"
                  }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.5 : 2} />
              </span>
              <span className={`truncate w-full text-center transition-colors duration-200 ${active ? "text-white font-semibold" : "text-white/50"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
