"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Buildings, Check, Sparkle, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { upgradeToProAction } from "./actions";

/**
 * Page /compte/upgrade - Upgrade prospect to Pro
 *
 * Simplified wizard for existing users to upgrade to Pro.
 * Only collects agency info (user already has account).
 *
 * Per WORKFLOW_PROPOSAL.md section 4.4
 */
export default function UpgradePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    companyName: "",
    companyAddress: "",
    companyPhone: "",
    companyNinea: "",
  });

  useEffect(() => {
    const checkAccess = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login?next=/compte/upgrade");
        return;
      }

      // Check if already pro
      const { data: profile } = await supabase
        .from("profiles")
        .select("pro_status")
        .eq("id", user.id)
        .single();

      if (profile?.pro_status === "trial" || profile?.pro_status === "active") {
        // Already pro, redirect to gestion
        router.replace("/gestion");
        return;
      }

      setIsLoading(false);
    };

    checkAccess();
  }, [router]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await upgradeToProAction(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Votre compte Pro est activé !");
      router.push("/gestion");
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F4C430] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const benefits = [
    "Gestion illimitée de biens",
    "Génération automatique de contrats",
    "Suivi des loyers en temps réel",
    "Quittances digitalisées",
    "Support prioritaire",
    "Tableau de bord analytique",
  ];

  return (
    <main className="min-h-screen bg-zinc-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#F4C430]/10 border border-[#F4C430]/30 rounded-full px-4 py-1.5 mb-6">
            <Sparkle size={16} className="text-[#F4C430]" />
            <span className="text-[#F4C430] text-sm font-medium">Essai gratuit 14 jours</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Passez à la gestion locative Pro
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Complétez vos informations pour accéder à toutes les fonctionnalités de gestion immobilière.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Benefits sidebar */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-8">
              <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                <Buildings size={20} className="text-[#F4C430]" />
                Inclus dans votre essai
              </h3>
              <ul className="space-y-4">
                {benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#F4C430]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={12} className="text-[#F4C430]" />
                    </div>
                    <span className="text-white/70 text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">Gratuit</div>
                  <div className="text-white/50 text-sm">pendant 14 jours</div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
              {/* Step indicator */}
              <div className="flex items-center gap-4 mb-8">
                <div className={`flex-1 h-1 rounded-full ${currentStep >= 1 ? "bg-[#F4C430]" : "bg-white/10"}`} />
                <div className={`flex-1 h-1 rounded-full ${currentStep >= 2 ? "bg-[#F4C430]" : "bg-white/10"}`} />
              </div>

              {currentStep === 1 ? (
                <>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Informations de votre agence
                  </h2>
                  <p className="text-white/50 text-sm mb-6">
                    Ces informations apparaîtront sur vos contrats et documents.
                  </p>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-white/70 text-sm mb-2">
                        Nom de l&apos;agence / société
                      </label>
                      <Input
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="Ex: Dousell Immobilier"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-white/70 text-sm mb-2">
                        Adresse
                      </label>
                      <Input
                        value={formData.companyAddress}
                        onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                        placeholder="Ex: Sacré-Coeur 3, Dakar"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/70 text-sm mb-2">
                          Téléphone
                        </label>
                        <Input
                          value={formData.companyPhone}
                          onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                          placeholder="77 000 00 00"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-white/70 text-sm mb-2">
                          NINEA (optionnel)
                        </label>
                        <Input
                          value={formData.companyNinea}
                          onChange={(e) => setFormData({ ...formData, companyNinea: e.target.value })}
                          placeholder="Numéro NINEA"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <Button
                      onClick={() => setCurrentStep(2)}
                      className="bg-[#F4C430] text-black hover:bg-[#F4C430]/90 px-8"
                    >
                      Continuer
                      <ArrowRight size={16} className="ml-2" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Confirmation
                  </h2>
                  <p className="text-white/50 text-sm mb-6">
                    Vérifiez vos informations avant d&apos;activer votre compte Pro.
                  </p>

                  <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/50">Société</span>
                      <span className="text-white">{formData.companyName || "Non renseigné"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Adresse</span>
                      <span className="text-white">{formData.companyAddress || "Non renseigné"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Téléphone</span>
                      <span className="text-white">{formData.companyPhone || "Non renseigné"}</span>
                    </div>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Check size={20} className="text-emerald-500 mt-0.5" />
                      <div>
                        <div className="text-white font-medium">Essai gratuit de 14 jours</div>
                        <div className="text-white/60 text-sm">
                          Aucune carte bancaire requise. Annulez à tout moment.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Retour
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 bg-[#F4C430] text-black hover:bg-[#F4C430]/90"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                          Activation en cours...
                        </>
                      ) : (
                        "Activer mon compte Pro"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
