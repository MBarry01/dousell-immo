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

export const dpeColorMap: Record<
  "A" | "B" | "C" | "D" | "E" | "F" | "G",
  string
> = {
  A: "bg-emerald-500/15 text-emerald-400",
  B: "bg-lime-500/15 text-lime-400",
  C: "bg-amber-500/15 text-amber-400",
  D: "bg-orange-500/15 text-orange-400",
  E: "bg-rose-500/15 text-rose-400",
  F: "bg-red-500/15 text-red-400",
  G: "bg-red-700/20 text-red-400",
};

