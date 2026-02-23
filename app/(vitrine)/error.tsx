"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
      <h1 className="text-9xl font-bold text-white/5">500</h1>
      <div className="absolute flex flex-col items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Une erreur est survenue</h2>
        <p className="text-white/60 max-w-md">
          Nous nous excusons pour ce désagrément. Veuillez réessayer ultérieurement.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => reset()}>
            Réessayer
          </Button>
          <Button onClick={() => window.location.href = "/"}>
            Retour à l&apos;accueil
          </Button>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 max-w-2xl overflow-auto rounded-lg bg-white/5 p-4 text-left text-xs font-mono text-white/40 border border-white/10">
            <p className="mb-2 font-bold text-red-500">Détails de l&apos;erreur (Dev uniquement) :</p>
            <pre className="whitespace-pre-wrap">{error.stack || error.message}</pre>
            {error.digest && <p className="mt-2 text-white/20">Digest: {error.digest}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
