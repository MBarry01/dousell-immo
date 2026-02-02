"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { LockKey, EnvelopeSimple, ArrowLeft, Warning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { requestNewTenantLink } from "./actions";

/**
 * Page /locataire/expired - Token expired or invalid
 *
 * Displayed when:
 * - No token provided
 * - Token is expired
 * - Token is invalid
 * - Lease is no longer active
 *
 * Per WORKFLOW_PROPOSAL.md section 4.3
 */
export default function TenantExpiredPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRequestNewLink = async () => {
    if (!email) {
      toast.error("Veuillez saisir votre adresse email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await requestNewTenantLink(email);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setIsSuccess(true);
      toast.success("Si votre email est associé à un bail actif, vous recevrez un nouveau lien.");
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getErrorMessage = () => {
    switch (error) {
      case "invalid_link":
        return "Ce lien d'accès n'est pas valide.";
      case "expired":
        return "Ce lien d'accès a expiré.";
      case "no_lease":
        return "Aucun bail actif n'est associé à ce lien.";
      default:
        return "Votre session a expiré pour des raisons de sécurité.";
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/10 mb-6">
            <LockKey size={40} className="text-amber-500" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">
            Session expirée
          </h1>

          <p className="text-white/60">
            {getErrorMessage()}
          </p>
        </div>

        {/* Request new link form */}
        {!isSuccess ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Warning size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-white/70 text-sm">
                Pour des raisons de sécurité, l&apos;accès à votre espace locataire est limité dans le temps.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-white/70 text-sm mb-2">
                <EnvelopeSimple size={16} className="inline mr-1" />
                Votre adresse email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
                className="bg-white/5 border-white/10 text-white"
              />
              <p className="text-white/40 text-xs mt-2">
                L&apos;email renseigné sur votre contrat de bail
              </p>
            </div>

            <Button
              onClick={handleRequestNewLink}
              disabled={isSubmitting || !email}
              className="w-full bg-[#F4C430] text-black hover:bg-[#F4C430]/90"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                  Envoi en cours...
                </>
              ) : (
                "Recevoir un nouveau lien"
              )}
            </Button>

            <p className="text-white/40 text-xs text-center mt-4">
              Vous recevrez un email avec un nouveau lien d&apos;accès si votre bail est toujours actif.
            </p>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <EnvelopeSimple size={24} className="text-emerald-500" />
            </div>
            <h3 className="text-white font-semibold mb-2">Email envoyé !</h3>
            <p className="text-white/60 text-sm">
              Si votre email est associé à un bail actif, vous recevrez un nouveau lien d&apos;accès dans quelques minutes.
            </p>
          </div>
        )}

        {/* Help text */}
        <div className="mt-8 text-center">
          <p className="text-white/40 text-sm mb-4">
            Besoin d&apos;aide ? Contactez votre propriétaire.
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
