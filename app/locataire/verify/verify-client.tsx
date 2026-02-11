"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, User, ArrowLeft, Warning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { verifyTenantIdentity, activateTenantSession } from "./actions";

/**
 * Page /locataire/verify - Tenant verification & session activation
 *
 * Handles two scenarios:
 * 1. First access: tenant must enter their last name to verify identity
 * 2. Returning access (cookie expired): token is already verified in DB,
 *    so we auto-create the session cookie and redirect immediately
 */
export default function TenantVerifyPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [lastName, setLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActivating, setIsActivating] = useState(true); // Start true to try auto-activate
  const [attempts, setAttempts] = useState(0);
  const [tenantName, setTenantName] = useState<string>("");
  const [propertyAddress, setPropertyAddress] = useState<string>("");

  const MAX_ATTEMPTS = 3;

  // On mount: try to auto-activate if token is already verified
  useEffect(() => {
    if (!token) {
      router.replace("/locataire/expired?error=invalid_link");
      return;
    }

    // Try to activate session without name (for already-verified tokens)
    activateTenantSession(token).then((result) => {
      if (result.success) {
        // Token was already verified - cookie created, redirect
        router.replace("/locataire");
      } else if (result.error) {
        // Token invalid or expired
        router.replace("/locataire/expired?error=invalid_token");
      } else {
        // Token needs verification - populate context from session and show the form
        if (result.tenantName) setTenantName(result.tenantName);
        if (result.propertyAddress) setPropertyAddress(result.propertyAddress);
        setIsActivating(false);
      }
    }).catch(() => {
      setIsActivating(false);
    });
  }, [token, router]);

  const handleVerify = async () => {
    if (!lastName.trim()) {
      toast.error("Veuillez saisir votre nom de famille.");
      return;
    }

    if (!token) {
      router.replace("/locataire/expired?error=invalid_link");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await verifyTenantIdentity(token, lastName);

      if (result.error) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          toast.error("Trop de tentatives. Ce lien a été invalidé.");
          router.replace("/locataire/expired?error=max_attempts");
          return;
        }

        toast.error(`Nom incorrect. ${MAX_ATTEMPTS - newAttempts} tentative(s) restante(s).`);
        return;
      }

      // Success - redirect to main tenant page
      // The session cookie was set by the server action, so /locataire
      // will use the cookie path (no token needed in URL)
      toast.success("Identité vérifiée !");
      router.push("/locataire");
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while trying to auto-activate
  if (isActivating) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
        <div className="text-center">
          <span className="w-8 h-8 border-3 border-[#F4C430] border-t-transparent rounded-full animate-spin inline-block mb-4" />
          <p className="text-white/60">Connexion en cours...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#F4C430]/10 mb-6">
            <ShieldCheck size={40} className="text-[#F4C430]" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">
            Vérification de votre identité
          </h1>

          <p className="text-white/60">
            {tenantName ? (
              <>Bonjour <span className="text-white">{tenantName}</span>, vérifiez votre identité</>
            ) : (
              "Pour accéder à votre espace locataire"
            )}
            {propertyAddress && (
              <><br />pour le bien situé à <span className="text-white">{propertyAddress}</span></>
            )}
          </p>
        </div>

        {/* Verification form */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          {attempts > 0 && (
            <div className="flex items-start gap-3 mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Warning size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-white/70 text-sm">
                {MAX_ATTEMPTS - attempts} tentative(s) restante(s). Après {MAX_ATTEMPTS} échecs, ce lien sera invalidé.
              </p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-white/70 text-sm mb-2">
              <User size={16} className="inline mr-1" />
              Votre nom de famille
            </label>
            <Input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              placeholder="Tel que sur votre contrat de bail"
              className="bg-white/5 border-white/10 text-white"
              autoComplete="family-name"
            />
            <p className="text-white/40 text-xs mt-2">
              Saisissez votre nom exactement comme il apparaît sur votre bail
            </p>
          </div>

          <Button
            onClick={handleVerify}
            disabled={isSubmitting || !lastName.trim()}
            className="w-full bg-[#F4C430] text-black hover:bg-[#F4C430]/90"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                Vérification...
              </>
            ) : (
              "Accéder à mon espace"
            )}
          </Button>
        </div>

        {/* Help text */}
        <div className="mt-8 text-center">
          <p className="text-white/40 text-sm mb-4">
            Problème d&apos;accès ? Contactez votre propriétaire.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#F4C430] text-sm hover:underline"
          >
            <ArrowLeft size={16} />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
