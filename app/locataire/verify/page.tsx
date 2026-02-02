"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, User, ArrowLeft, Warning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { verifyTenantIdentity } from "./actions";

/**
 * Page /locataire/verify - First-time tenant verification
 *
 * Displayed on first Magic Link access to verify tenant identity.
 * Tenant must provide their last name to confirm identity.
 *
 * Per WORKFLOW_PROPOSAL.md section 11.2
 */
export default function TenantVerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [lastName, setLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [landlordName, setLandlordName] = useState<string>("");
  const [propertyAddress, setPropertyAddress] = useState<string>("");

  const MAX_ATTEMPTS = 3;

  useEffect(() => {
    if (!token) {
      router.replace("/locataire/expired?error=invalid_link");
    }
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
      toast.success("Identité vérifiée !");
      router.push("/locataire");
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            {landlordName ? (
              <>Vous avez été invité par <span className="text-white">{landlordName}</span></>
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
