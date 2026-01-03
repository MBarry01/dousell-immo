"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface KKiaPayWidgetProps {
  amount: number;
  leaseId: string;
  tenantName: string;
  tenantEmail: string;
  periodMonth: number;
  periodYear: number;
  onSuccess?: (transactionId: string) => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    openKkiapayWidget: (options: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addKkiapayListener: (event: string, callback: (data: any) => void) => void;
    removeKkiapayListener: (event: string) => void;
  }
}

/**
 * Composant KKiaPay Widget pour paiements sans redirection
 * Conforme au Design System "Luxe & Teranga"
 */
export default function KKiaPayWidget({
  amount,
  leaseId,
  tenantName,
  tenantEmail,
  periodMonth,
  periodYear,
  onSuccess,
  onError,
}: KKiaPayWidgetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Charger le script KKiaPay
  useEffect(() => {
    let checkInterval: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const waitForSDK = () => {
      console.log("🔍 Vérification SDK KKiaPay...");

      checkInterval = setInterval(() => {
        if (typeof window !== "undefined" && typeof window.openKkiapayWidget !== "undefined") {
          console.log("✅ KKiaPay SDK prêt !");
          setScriptLoaded(true);
          if (checkInterval) clearInterval(checkInterval);
          if (timeoutId) clearTimeout(timeoutId);
        }
      }, 200);

      // Timeout après 15 secondes
      timeoutId = setTimeout(() => {
        if (checkInterval) clearInterval(checkInterval);
        if (typeof window.openKkiapayWidget === "undefined") {
          console.error("❌ KKiaPay SDK timeout après 15s");
          toast.error("Le système de paiement met du temps à charger. Veuillez réessayer.");
        }
      }, 15000);
    };

    // Cas 1: SDK déjà disponible
    if (typeof window !== "undefined" && typeof window.openKkiapayWidget !== "undefined") {
      console.log("✅ KKiaPay SDK déjà disponible");
      setScriptLoaded(true);
      return;
    }

    // Cas 2: Script déjà dans le DOM
    const existingScript = document.getElementById("kkiapay-script");
    if (existingScript) {
      console.log("📜 Script KKiaPay trouvé, attente initialisation...");
      waitForSDK();
      return () => {
        if (checkInterval) clearInterval(checkInterval);
        if (timeoutId) clearTimeout(timeoutId);
      };
    }

    // Cas 3: Charger le script
    console.log("📥 Chargement du script KKiaPay...");
    const script = document.createElement("script");
    script.id = "kkiapay-script";
    script.src = "https://cdn.kkiapay.me/k.js";
    script.async = false; // Chargement synchrone pour éviter les race conditions

    script.onload = () => {
      console.log("📜 Script KKiaPay chargé, attente initialisation...");
      waitForSDK();
    };

    script.onerror = (error) => {
      console.error("❌ Erreur chargement script KKiaPay:", error);
      toast.error("Impossible de charger le système de paiement. Vérifiez votre connexion.");
    };

    document.body.appendChild(script);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Écouter les événements KKiaPay
  useEffect(() => {
    if (!scriptLoaded || !window.addKkiapayListener) return;

    const handleSuccess = async (response: { transactionId: string }) => {
      console.log("✅ Paiement KKiaPay réussi:", response.transactionId);
      setIsLoading(true);

      try {
        // Appeler le webhook pour confirmer côté serveur
        const confirmResponse = await fetch("/api/kkiapay/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionId: response.transactionId,
            leaseId,
            periodMonth,
            periodYear,
          }),
        });

        if (!confirmResponse.ok) {
          throw new Error("Échec de confirmation du paiement");
        }

        toast.success("Paiement confirmé avec succès !");
        onSuccess?.(response.transactionId);

        // Rafraîchir la page après 2 secondes
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error("Erreur confirmation:", error);
        toast.error("Erreur lors de la confirmation du paiement");
        onError?.(error instanceof Error ? error.message : "Erreur inconnue");
      } finally {
        setIsLoading(false);
      }
    };

    const handleFailed = (response: { reason?: string }) => {
      console.warn("❌ Paiement KKiaPay échoué:", response);
      toast.error(`Paiement échoué: ${response.reason || "Erreur inconnue"}`);
      onError?.(response.reason || "Paiement échoué");
      setIsLoading(false);
    };

    window.addKkiapayListener("success", handleSuccess);
    window.addKkiapayListener("failed", handleFailed);

    return () => {
      if (window.removeKkiapayListener) {
        window.removeKkiapayListener("success");
        window.removeKkiapayListener("failed");
      }
    };
  }, [scriptLoaded, leaseId, periodMonth, periodYear, onSuccess, onError]);

  const handlePayment = () => {
    if (!window.openKkiapayWidget) {
      toast.error("Le système de paiement n'est pas encore chargé");
      return;
    }

    setIsLoading(true);

    try {
      const publicKey = process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error("Clé publique KKiaPay manquante");
      }

      const isSandbox = process.env.NEXT_PUBLIC_KKIAPAY_MODE === "sandbox";

      console.log("🔧 Configuration KKiaPay:", {
        amount,
        key: publicKey,
        sandbox: isSandbox,
        tenantName,
        tenantEmail,
      });

      window.openKkiapayWidget({
        amount: amount,
        key: publicKey,
        sandbox: isSandbox,
        name: tenantName,
        email: tenantEmail,
        phone: "",
        data: JSON.stringify({
          type: "rent",
          lease_id: leaseId,
          period_month: periodMonth,
          period_year: periodYear,
        }),
        theme: "#F4C430", // Or Luxe
        paymentMethods: ["momo"], // Mobile Money uniquement (Wave + Orange Money)
        countries: ["SN"], // Sénégal uniquement
        phonenumber: "", // Le numéro sera saisi par l'utilisateur
      });
    } catch (error) {
      console.error("Erreur ouverture widget:", error);
      toast.error("Erreur lors de l'ouverture du paiement");
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={isLoading || !scriptLoaded}
      className="w-full bg-gradient-to-r from-[#F4C430] to-[#D4AF37] text-black font-semibold py-3 px-6 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Traitement...
        </span>
      ) : !scriptLoaded ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Initialisation du paiement...
        </span>
      ) : (
        `Payer ${amount.toLocaleString("fr-FR")} FCFA`
      )}
    </button>
  );
}
