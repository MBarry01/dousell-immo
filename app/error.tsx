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
      </div>
    </div>
  );
}
