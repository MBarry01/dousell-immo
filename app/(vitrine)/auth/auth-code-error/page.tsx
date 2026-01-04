"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

function AuthCodeErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  // Messages d'erreur plus explicites
  const getErrorMessage = () => {
    if (reason) {
      // Décoder l'URL si nécessaire
      const decodedReason = decodeURIComponent(reason);
      
      // Messages d'erreur spécifiques
      if (decodedReason.includes("redirect_uri_mismatch")) {
        return "L'URL de redirection ne correspond pas. Vérifiez la configuration dans Supabase et Google Cloud Console.";
      }
      if (decodedReason.includes("access_denied")) {
        return "L'autorisation a été refusée. Veuillez réessayer.";
      }
      if (decodedReason.includes("invalid_request")) {
        return "Requête invalide. Vérifiez la configuration OAuth.";
      }
      
      return decodedReason;
    }
    return "Le lien d'authentification est invalide ou a expiré.";
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-white">
            Erreur d&apos;authentification
          </h1>
          <p className="text-white/70 whitespace-pre-line">
            {getErrorMessage()}
          </p>
          {reason && (
            <details className="mt-4 text-left">
              <summary className="text-xs text-white/50 cursor-pointer hover:text-white/70">
                Détails techniques
              </summary>
              <pre className="mt-2 p-3 text-xs text-white/60 bg-background/5 rounded-lg overflow-auto max-h-32">
                {decodeURIComponent(reason)}
              </pre>
            </details>
          )}
        </div>
        <div className="space-y-3">
          <Button asChild className="w-full rounded-xl bg-primary text-black">
            <Link href="/login">Retour à la connexion</Link>
          </Button>
          <Button
            variant="secondary"
            asChild
            className="w-full rounded-xl border border-white/10 bg-background/5 text-white"
          >
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AuthCodeErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-white">
                Erreur d&apos;authentification
              </h1>
              <p className="text-white/70">
                Chargement...
              </p>
            </div>
          </div>
        </div>
      }
    >
      <AuthCodeErrorContent />
    </Suspense>
  );
}

