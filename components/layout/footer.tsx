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
  { label: "Politique de confidentialité", href: "/legal#confidentialite" },
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
    <footer className="mt-4 border-t border-white/10 bg-[#05080c]/90 pb-16 text-white md:pb-4 print:hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row md:gap-12">
        <div className="flex-1 space-y-3">
          <p className="text-lg font-semibold text-white">Dousell Immo</p>
          <p className="text-sm leading-relaxed text-white/70 max-w-md">
            L&apos;immobilier de confiance à Dakar et au Sénégal. Nous accompagnons particuliers et professionnels dans leurs projets immobiliers avec expertise et transparence.
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
      <div className="border-t border-white/5 px-4 py-4">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 text-xs text-white/50 sm:flex-row">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
            <span>© {new Date().getFullYear()} Dousell Immo. Tous droits réservés.</span>
            <span className="hidden text-white/30 sm:inline">•</span>
            <span className="text-white/40">Dakar, Sénégal</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-white/40">
            <Link href="/legal" className="hover:text-white/70 transition-colors">
              Mentions légales
            </Link>
            <Link href="/cgu" className="hover:text-white/70 transition-colors">
              CGU
            </Link>
            <Link href="/contact" className="hover:text-white/70 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

