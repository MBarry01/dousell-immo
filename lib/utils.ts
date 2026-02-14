import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const normalizeNbsp = (input: string) => input.replace(/\u00A0|\u202F/g, " ");

export const formatCurrency = (value: number) =>
  `${normalizeNbsp(
    new Intl.NumberFormat("fr-SN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  )} FCFA`;

export const formatCurrencyShort = (value: number) => {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B FCFA`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M FCFA`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}k FCFA`;
  }
  return `${value} FCFA`;
};



/**
 * Récupère l'URL de base de l'application
 * Gère le cas localhost et production
 */
export function getBaseUrl() {
  if (typeof window !== "undefined") {
    // Côté client
    return window.location.origin;
  }

  // Côté serveur

  // En développement, on force localhost pour éviter les redirections vers la prod
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

