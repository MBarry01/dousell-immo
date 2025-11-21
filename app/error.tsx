"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Error Boundary - Page d'erreur globale
 * 
 * S'affiche quand une erreur non gérée se produit (ex: Supabase down, erreur réseau)
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log l'erreur pour le debugging
    console.error("Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#05080c] via-[#05080c] to-[#040507] px-6 text-center text-white">
      <div className="mb-8 max-w-lg">
        <div className="relative mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-16 w-16 text-red-400" />
          <div className="absolute inset-0 animate-pulse rounded-full bg-red-500/10" />
        </div>

        <h1 className="text-4xl font-bold md:text-5xl">
          Oups, quelque chose s&apos;est mal passé
        </h1>
        <p className="mt-4 text-lg text-white/70">
          Une erreur inattendue s&apos;est produite. Notre équipe a été notifiée
          et travaille à résoudre le problème.
        </p>

        {process.env.NODE_ENV === "development" && error.message && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
              Détails (dev uniquement)
            </p>
            <p className="mt-2 text-sm text-red-300 font-mono">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-red-400/70">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <Button
          onClick={reset}
          className="rounded-full px-6"
          variant="primary"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Réessayer
        </Button>
        <Button variant="secondary" className="rounded-full px-6" asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Retour à l&apos;accueil
          </Link>
        </Button>
      </div>

      <div className="mt-12 text-sm text-white/40">
        <p>Si le problème persiste, contactez-nous à contact@doussel.immo</p>
      </div>
    </div>
  );
}

