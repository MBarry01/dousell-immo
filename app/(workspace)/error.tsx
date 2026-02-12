"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Workspace Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-6">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">
        Une erreur est survenue
      </h2>
      <p className="text-muted-foreground max-w-md mb-6 text-sm">
        {error.message || "Impossible de charger cette page. Veuillez réessayer."}
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => reset()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Réessayer
        </Button>
        <Button onClick={() => (window.location.href = "/gestion")}>
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </div>
    </div>
  );
}
