"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log real details about the error to identify the "r" problem on mobile
        console.error("[GlobalError] ❌ CRASH DETECTED:", {
            message: error.message,
            digest: error.digest,
            stack: error.stack,
            name: error.name
        });
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
            <div className="mb-6 rounded-full bg-red-500/10 p-4">
                <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-foreground">
                Oups ! Une erreur est survenue
            </h1>
            <p className="mb-8 max-w-md text-muted-foreground">
                L'application a rencontré une exception inattendue. Veuillez nous excuser pour ce désagrément.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                    onClick={() => reset()}
                    className="flex items-center gap-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    Réessayer
                </Button>
                <Button
                    variant="outline"
                    asChild
                    className="flex items-center gap-2"
                >
                    <Link href="/">
                        <Home className="h-4 w-4" />
                        Retour à l'accueil
                    </Link>
                </Button>
            </div>
            {process.env.NODE_ENV === "development" && (
                <div className="mt-8 max-w-2xl overflow-auto rounded-lg bg-muted p-4 text-left text-xs font-mono text-muted-foreground">
                    <p className="mb-2 font-bold text-red-500">Détails de l'erreur (Dev uniquement) :</p>
                    <pre>{error.stack || error.message}</pre>
                </div>
            )}
        </div>
    );
}
