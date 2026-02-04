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
    Sparkle,
    Buildings as BuildingsIcon,
    Crown,
    Rocket
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SubscriptionManager() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [proStatus, setProStatus] = useState<string | null>(null);
    const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
    const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
    const [stats, setStats] = useState({ properties: 0, leases: 0 });
    const [teamId, setTeamId] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            // Get Team Info
            const { data: teamMembership } = await supabase
                .from("team_members")
                .select("team_id, team:teams(*)")
                .eq("user_id", user.id)
                .eq("status", "active")
                .maybeSingle();

            const team = teamMembership?.team as any;
            const tId = teamMembership?.team_id;
            setTeamId(tId);

            if (team) {
                setProStatus(team.subscription_status);
                setSubscriptionTier(team.subscription_tier);
                if (team.subscription_trial_ends_at) {
                    setTrialEndsAt(new Date(team.subscription_trial_ends_at));
                }
            }

            // Get user stats
            const { count: propertiesCount } = await supabase
                .from("properties")
                .select("*", { count: "exact", head: true })
                .eq("team_id", tId);

            const { count: leasesCount } = await supabase
                .from("leases")
                .select("*", { count: "exact", head: true })
                .eq("team_id", tId)
                .eq("status", "active");

            setStats({
                properties: propertiesCount || 0,
                leases: leasesCount || 0,
            });

            setIsLoading(false);
        };

        loadData();
    }, []);

    const handleUpgrade = async (planId: string) => {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/subscription/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planId }),
            });

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                toast.error(data.error || "Erreur lors de l'initialisation du paiement");
            }
        } catch (error) {
            toast.error("Une erreur est survenue.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-12 flex flex-col items-center justify-center bg-white dark:bg-gray-900/40 rounded-3xl border border-slate-200 dark:border-gray-800">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-sm text-gray-500">Chargement de votre abonnement...</p>
            </div>
        );
    }

    const isExpired = proStatus === "expired";
    const isTrial = proStatus === "trial";
    const daysLeft = trialEndsAt
        ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;

    return (
        <section className="p-6 md:p-8 bg-white dark:bg-gray-900/40 rounded-3xl border border-slate-200 dark:border-gray-800 space-y-8 shadow-sm dark:shadow-none">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                        <CreditCard className="w-6 h-6 text-primary" />
                        Mon Abonnement
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Gérez votre formule et vos factures</p>
                </div>

                {isExpired ? (
                    <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-1.5">
                        <Warning size={16} className="text-red-400" />
                        <span className="text-red-400 text-xs font-medium">Abonnement expiré</span>
                    </div>
                ) : isTrial ? (
                    <div className="flex flex-col items-end gap-1">
                        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5">
                            <Clock size={16} className="text-primary" />
                            <span className="text-primary text-xs font-medium">{daysLeft} jours d'essai restants</span>
                        </div>
                        {trialEndsAt && (
                            <span className="text-[10px] text-gray-500">Expire le {trialEndsAt.toLocaleDateString('fr-FR')}</span>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-end gap-1">
                        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1.5">
                            <Sparkle size={16} className="text-emerald-400" />
                            <span className="text-emerald-400 text-xs font-medium">Plan {subscriptionTier?.toUpperCase()} Actif</span>
                        </div>
                        <span className="text-[10px] text-gray-500">Abonnement actif et à jour</span>
                    </div>
                )}
            </div>

            {/* Trial Progress Bar */}
            {isTrial && (
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-primary">Progression de l'essai gratuit</span>
                        <span className="text-xs text-gray-500">{Math.round(((14 - daysLeft) / 14) * 100)}% complété</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                            style={{ width: `${Math.min(100, Math.round(((14 - daysLeft) / 14) * 100))}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Stats warning (for expired users) */}
            {isExpired && (stats.properties > 0 || stats.leases > 0) && (
                <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Buildings size={24} className="text-primary" />
                        </div>
                        <div>
                            <h3 className="text-slate-900 dark:text-white font-semibold mb-1 text-sm">Vos données sont préservées</h3>
                            <p className="text-slate-500 dark:text-white/60 text-xs mb-3">
                                Vous avez {stats.properties} bien(s) et {stats.leases} bail(s) actif(s) qui attendent votre retour.
                            </p>
                            <p className="text-slate-400 dark:text-white/50 text-xs italic">
                                Réactivez votre compte pour retrouver l'accès complet.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* STARTER */}
                <div className={`rounded-2xl border ${subscriptionTier === 'starter' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5'} p-6 flex flex-col`}>
                    <div className="flex items-center gap-2 mb-4">
                        <Rocket size={24} className="text-primary" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Starter</h3>
                    </div>
                    <div className="mb-6">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">15 000 FCFA</span>
                        <span className="text-gray-500 text-xs ml-1">/ mois</span>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                        <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/70">
                            <Check size={14} className="text-primary" /> Jusqu'à 10 biens
                        </li>
                        <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/70">
                            <Check size={14} className="text-primary" /> Documents standards
                        </li>
                        <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/70">
                            <Check size={14} className="text-primary" /> Support standard
                        </li>
                    </ul>
                    <Button
                        onClick={() => handleUpgrade('starter')}
                        disabled={isSubmitting || (subscriptionTier === 'starter' && proStatus === 'active')}
                        className={`w-full h-10 text-sm ${subscriptionTier === 'starter' && proStatus === 'active' ? 'bg-zinc-800 text-white/50' : 'bg-primary text-primary-foreground hover:bg-primary/90 font-bold'}`}
                    >
                        {subscriptionTier === 'starter' && proStatus === 'active' ? "Plan actuel" : "Choisir Starter"}
                    </Button>
                </div>

                {/* PRO */}
                <div className={`rounded-2xl border ${subscriptionTier === 'pro' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5'} p-6 flex flex-col relative`}>
                    <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Recommandé
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                        <Crown size={24} className="text-primary" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pro</h3>
                    </div>
                    <div className="mb-6">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">35 000 FCFA</span>
                        <span className="text-gray-500 text-xs ml-1">/ mois</span>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                        <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/70">
                            <Check size={14} className="text-primary" /> Biens illimités
                        </li>
                        <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/70">
                            <Check size={14} className="text-primary" /> Analyses financières
                        </li>
                        <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/70">
                            <Check size={14} className="text-primary" /> Export de données
                        </li>
                        <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/70">
                            <Check size={14} className="text-primary" /> Support prioritaire
                        </li>
                    </ul>
                    <Button
                        onClick={() => handleUpgrade('pro')}
                        disabled={isSubmitting || (subscriptionTier === 'pro' && proStatus === 'active')}
                        className={`w-full h-10 text-sm ${subscriptionTier === 'pro' && proStatus === 'active' ? 'bg-zinc-800 text-white/50' : 'bg-primary text-primary-foreground hover:bg-primary/90 font-bold'}`}
                    >
                        {subscriptionTier === 'pro' && proStatus === 'active' ? "Plan actuel" : "Choisir Pro"}
                    </Button>
                </div>
            </div>

            {/* Enterprise CTA */}
            <div className="bg-slate-900/50 dark:bg-black rounded-2xl p-6 text-center border border-slate-200 dark:border-white/5">
                <h3 className="text-md font-bold text-slate-900 dark:text-white mb-1 uppercase tracking-tight">Besoin de plus ?</h3>
                <p className="text-gray-500 text-xs mb-4">Solutions sur mesure pour agences immobilières.</p>
                <Button
                    size="sm"
                    className="h-9 px-6 border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white bg-transparent hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-primary transition-colors"
                    onClick={() => router.push("/contact?subject=enterprise")}
                >
                    Contacter les ventes
                </Button>
            </div>
        </section>
    );
}
