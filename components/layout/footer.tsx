import Link from "next/link";
import { Facebook, Instagram, Linkedin } from "lucide-react";

const quickLinks = [
  { label: "Achat", href: "/recherche?q=achat" },
  { label: "Location", href: "/recherche?q=location" },
  { label: "Estimer", href: "/estimation" },
  { label: "Mon Compte", href: "/compte" },
];

const legalLinks = [
  { label: "Mentions légales", href: "/legal" },
  { label: "CGU", href: "/cgu" },
];

const socials = [
  {
    label: "Facebook",
    href: "https://facebook.com",
    icon: Facebook,
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: Instagram,
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com",
    icon: Linkedin,
  },
];

export const Footer = () => {
  return (
    <footer className="mt-4 border-t border-white/10 bg-[#05080c]/90 pb-16 text-white md:pb-4">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row md:gap-12">
        <div className="flex-1 space-y-3">
          <p className="text-lg font-semibold">Dousell Immo</p>
          <p className="text-sm text-white/60">
            Immobilier premium et transparent à Dakar.
          </p>
        </div>
        <div className="flex flex-1 flex-col gap-4 text-sm text-white/70 sm:flex-row">
          <div className="flex-1 space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              Liens rapides
            </p>
            <ul className="space-y-1">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-white transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              Légal
            </p>
            <ul className="space-y-1">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-white transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              Nous suivre
            </p>
            <div className="flex gap-3">
              {socials.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:text-white"
                >
                  <social.icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/5 px-4 py-4 text-center text-xs text-white/50">
        © 2025 Dousell Immo — Made with ❤️ in Dakar
      </div>
    </footer>
  );
};

