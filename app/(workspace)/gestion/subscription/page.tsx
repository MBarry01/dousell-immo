"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  CreditCard,
  Check,
  Warning,
  ArrowRight,
  Buildings,
  Clock,
  Sparkle
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { reactivateSubscription } from "./actions";

/**
 * Page /gestion/subscription - Manage subscription for expired users
 *
 * Displayed when pro_status = 'expired'
 * Does NOT redirect to /pro/start (user already has data)
 *
 * Per WORKFLOW_PROPOSAL.md section 11.1
 */
export default function SubscriptionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proStatus, setProStatus] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [stats, setStats] = useState({ properties: 0, leases: 0 });

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login?next=/gestion/subscription");
        return;
      }

      // Get profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("pro_status, pro_trial_ends_at")
        .eq("id", user.id)
        .single();

      if (!profile) {
        router.replace("/");
        return;
      }

      setProStatus(profile.pro_status);
      if (profile.pro_trial_ends_at) {
        setTrialEndsAt(new Date(profile.pro_trial_ends_at));
      }

      // ✅ CORRECTION SÉCURITÉ: Utiliser team_id au lieu de owner_id
      // Récupérer le contexte d'équipe
      const { data: teamMembership } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      const teamId = teamMembership?.team_id;

      // Get user stats (filtrés par team_id si disponible, sinon fallback owner_id)
      const { count: propertiesCount } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .eq(teamId ? "team_id" : "owner_id", teamId || user.id);

      const { count: leasesCount } = await supabase
        .from("leases")
        .select("*", { count: "exact", head: true })
        .eq(teamId ? "team_id" : "owner_id", teamId || user.id)
        .eq("status", "active");

      setStats({
        properties: propertiesCount || 0,
        leases: leasesCount || 0,
      });

      setIsLoading(false);
    };

    loadData();
  }, [router]);

  const handleReactivate = async () => {
    setIsSubmitting(true);
    try {
      const result = await reactivateSubscription();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Votre abonnement a été réactivé !");
      router.push("/gestion");
    } catch {
      toast.error("Une erreur est survenue.");
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

  const isExpired = proStatus === "expired";
  const isTrial = proStatus === "trial";
  const daysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <main className="min-h-screen bg-zinc-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          {isExpired ? (
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-1.5 mb-6">
              <Warning size={16} className="text-red-400" />
              <span className="text-red-400 text-sm font-medium">Abonnement expiré</span>
            </div>
          ) : isTrial && daysLeft <= 3 ? (
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 mb-6">
              <Clock size={16} className="text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">{daysLeft} jours restants</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-[#F4C430]/10 border border-[#F4C430]/30 rounded-full px-4 py-1.5 mb-6">
              <Sparkle size={16} className="text-[#F4C430]" />
              <span className="text-[#F4C430] text-sm font-medium">Gestion de l&apos;abonnement</span>
            </div>
          )}

          <h1 className="text-3xl font-bold text-white mb-4">
            {isExpired ? "Réactivez votre accès" : "Gérer mon abonnement"}
          </h1>
          <p className="text-white/60 max-w-lg mx-auto">
            {isExpired
              ? "Votre période d'essai est terminée. Réactivez pour retrouver l'accès complet à vos données."
              : "Consultez et gérez votre abonnement Dousell Pro."
            }
          </p>
        </div>

        {/* Stats warning (for expired users) */}
        {isExpired && (stats.properties > 0 || stats.leases > 0) && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Buildings size={24} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Vos données sont préservées</h3>
                <p className="text-white/60 text-sm mb-3">
                  Vous avez {stats.properties} bien(s) et {stats.leases} bail(s) actif(s) qui attendent votre retour.
                </p>
                <p className="text-white/50 text-xs">
                  Réactivez votre compte pour retrouver l&apos;accès en lecture et écriture.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">Dousell Pro</h2>
                <p className="text-white/50 text-sm">Gestion locative complète</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">Gratuit</div>
                <div className="text-white/50 text-sm">pendant 14 jours</div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {[
                "Gestion illimitée de biens",
                "Génération de contrats PDF",
                "Suivi des loyers temps réel",
                "Quittances automatiques",
                "États des lieux digitaux",
                "Support prioritaire",
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#F4C430]/20 flex items-center justify-center">
                    <Check size={12} className="text-[#F4C430]" />
                  </div>
                  <span className="text-white/70 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {isExpired ? (
              <Button
                onClick={handleReactivate}
                disabled={isSubmitting}
                className="w-full bg-[#F4C430] text-black hover:bg-[#F4C430]/90 h-12"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                    Réactivation...
                  </>
                ) : (
                  <>
                    <CreditCard size={20} className="mr-2" />
                    Réactiver mon essai gratuit
                    <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check size={20} className="text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-white font-medium">Abonnement actif</div>
                    <div className="text-white/50 text-sm">
                      {isTrial ? `${daysLeft} jours restants sur l'essai` : "Accès complet"}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => router.push("/gestion")}
                >
                  Retour au dashboard
                </Button>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="px-6 md:px-8 py-4 bg-white/[0.02] border-t border-white/10">
            <p className="text-white/40 text-xs text-center">
              En réactivant, vous acceptez nos conditions d&apos;utilisation.
              Aucune carte bancaire requise pour l&apos;essai.
            </p>
          </div>
        </div>

        {/* Help section */}
        <div className="mt-8 text-center">
          <p className="text-white/40 text-sm">
            Une question ? Contactez-nous à{" "}
            <a href="mailto:support@dousell.com" className="text-[#F4C430] hover:underline">
              support@dousell.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
