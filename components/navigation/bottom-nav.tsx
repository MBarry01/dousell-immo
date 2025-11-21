"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, User } from "lucide-react";

const navItems = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/recherche", label: "Recherche", icon: Search },
  { href: "/favoris", label: "Favoris", icon: Heart },
  { href: "/compte", label: "Compte", icon: User },
];

export const BottomNav = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#06070c]/90 pb-safe backdrop-blur-2xl md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between px-6 py-3 text-xs font-medium text-white/60">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition ${
                  active ? "bg-white text-black" : "text-white/60"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className={active ? "text-white" : "text-white/60"}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};







