"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Component qui affiche un toast de succès quand l'utilisateur
 * est redirigé après vérification d'email
 */
export function VerificationSuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const verified = searchParams.get("verified");

  useEffect(() => {
    if (verified === "true") {
      toast.success("Email vérifié avec succès !", {
        description: "Votre compte est maintenant actif. Bienvenue sur Dousell Immo !",
        duration: 5000,
      });

      // Nettoyer l'URL (enlever le paramètre verified)
      const url = new URL(window.location.href);
      url.searchParams.delete("verified");
      router.replace(url.pathname + url.search, { scroll: false });
    }
  }, [verified, router]);

  return null; // Ce composant n'affiche rien visuellement
}
