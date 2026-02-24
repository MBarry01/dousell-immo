"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
    CreditCard,
    Check,
    Warning,
    Buildings,
    Clock,
    Sparkle,
    Crown,
    Rocket,
    Receipt,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getAllPlans, formatPrice, getAnnualSavings, TRIAL_DURATION_DAYS, type BillingCycle } from "@/lib/subscription/plans-config";
import { reactivateSubscription } from "@/app/(workspace)/gestion/abonnement/actions";

export function SubscriptionManager() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [proStatus, setProStatus] = useState<string | null>(null);
    const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
    const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
    const [stats, setStats] = useState({ properties: 0, leases: 0 });
    const [hasStripeCustomer, setHasStripeCustomer] = useState(false);
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
    const [canReactivateTrial, setCanReactivateTrial] = useState(false);

    useEffect(() => {
        const loadData = async () => {
          try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            const { data: teamMemberships } = await supabase
                .from("team_members")
                .select("team_id, team:teams(*)")
                .eq("user_id", user.id)
                .eq("status", "active");

            const teamMembership = teamMemberships && teamMemberships.length > 0 ? teamMemberships[0] : null;
            const team = teamMembership?.team as {
                subscription_status?: string;
                subscription_tier?: string;
                subscription_trial_ends_at?: string;
                stripe_customer_id?: string;
                trial_reactivation_count?: number;
            } | null;
            const tId = teamMembership?.team_id;

            if (team) {
                let effectiveStatus = team.subscription_status || null;
                let effectiveTier = team.subscription_tier || 'starter';

                // Normaliser : si trialing mais date expirée, traiter comme expiré
                if (effectiveStatus === 'trialing' && team.subscription_trial_ends_at) {
                    const trialEnd = new Date(team.subscription_trial_ends_at);
                    if (trialEnd < new Date()) {
                        effectiveStatus = 'past_due';
                        effectiveTier = 'starter';
                    }
                }

                setProStatus(effectiveStatus);
                setSubscriptionTier(effectiveTier);
                setHasStripeCustomer(!!team.stripe_customer_id);

                // Peut réactiver l'essai si expiré et pas encore utilisé la réactivation
                const MAX_REACTIVATIONS = 1;
                const isExpiredStatus = effectiveStatus === 'past_due' || effectiveStatus === 'canceled';
                const reactivationsUsed = team.trial_reactivation_count ?? 0;
                setCanReactivateTrial(isExpiredStatus && reactivationsUsed < MAX_REACTIVATIONS);
                if (team.subscription_trial_ends_at) {
                    setTrialEndsAt(new Date(team.subscription_trial_ends_at));
                }
            }

            if (tId) {
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
            }
          } catch (err) {
            console.error("[SubscriptionManager] Failed to load data:", err);
          } finally {
            setIsLoading(false);
          }
        };

        loadData();
    }, []);

    const handleUpgrade = async (planId: string) => {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/subscription/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planId,
                    interval: billingCycle,
                    currency: 'xof',
                }),
            });

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                toast.error(data.error || "Erreur lors de l'initialisation du paiement");
            }
        } catch {
            toast.error("Une erreur est survenue.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenPortal = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/subscription/portal", {
                method: "POST",
            });
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                toast.error(data.error || "Impossible d'accéder au portail de facturation");
            }
        } catch {
            toast.error("Une erreur est survenue.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReactivateTrial = async () => {
        setIsSubmitting(true);
        try {
            const result = await reactivateSubscription();
            if (result?.data?.success) {
                toast.success("Essai gratuit réactivé ! Vous avez 14 jours supplémentaires.");
                window.location.reload();
                return;
            } else {
                toast.error(result?.error || "Erreur lors de la réactivation.");
            }
        } catch (err: any) {
            toast.error(err.message || "Une erreur est survenue.");
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

    const isExpired = proStatus === "canceled" || proStatus === "past_due" || proStatus === "unpaid" || proStatus === "incomplete";
    const isTrial = proStatus === "trialing";
    const isActive = proStatus === "active";
    const daysLeft = trialEndsAt
        ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;

    // Nom du plan actuel pour l'affichage
    const currentPlanName = getAllPlans().find(p => p.id === subscriptionTier)?.name || 'Starter';

    return (
        <section className="p-6 md:p-8 bg-white dark:bg-gray-900/40 rounded-3xl border border-slate-200 dark:border-gray-800 space-y-8 shadow-sm dark:shadow-none">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                        <CreditCard className="w-6 h-6 text-primary" />
                        Mon Abonnement
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Gérez votre formule et vos factures</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Stripe Portal Button - for active and trialing Stripe subscribers */}
                    {(isActive || isTrial) && hasStripeCustomer && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleOpenPortal}
                            disabled={isSubmitting}
                            className="gap-2 text-xs"
                        >
                            <Receipt size={14} />
                            Gérer la facturation
                        </Button>
                    )}
                </div>
            </div>

            {/* Current Plan Summary - toujours visible */}
            <div className={`rounded-2xl p-5 border ${isExpired
                ? 'bg-red-500/5 border-red-500/20'
                : isTrial
                    ? 'bg-primary/5 border-primary/20'
                    : isActive
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'
                }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isExpired ? 'bg-red-500/10' : isTrial ? 'bg-primary/10' : isActive ? 'bg-emerald-500/10' : 'bg-slate-100 dark:bg-white/10'
                            }`}>
                            {isExpired ? <Warning size={20} className="text-red-400" /> :
                                isTrial ? <Clock size={20} className="text-primary" /> :
                                    isActive ? <Sparkle size={20} className="text-emerald-400" /> :
                                        <Rocket size={20} className="text-gray-400" />}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                Plan {currentPlanName}
                                {isTrial && <span className="ml-2 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Essai gratuit</span>}
                                {isActive && <span className="ml-2 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Actif</span>}
                                {isExpired && <span className="ml-2 text-xs font-medium text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Expiré</span>}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {isExpired && "Votre abonnement a expiré. Réactivez pour retrouver l'accès."}
                                {isTrial && trialEndsAt && `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''} — expire le ${trialEndsAt.toLocaleDateString('fr-FR')}`}
                                {isTrial && !trialEndsAt && "Essai gratuit en cours"}
                                {isActive && "Votre abonnement est actif et à jour."}
                            </p>
                        </div>
                    </div>
                    {stats.properties > 0 && (
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{stats.properties} bien{stats.properties > 1 ? 's' : ''}</span>
                            <span>{stats.leases} bail{stats.leases > 1 ? 'x' : ''} actif{stats.leases > 1 ? 's' : ''}</span>
                        </div>
                    )}
                </div>

                {/* Trial Progress Bar - Integrated */}
                {isTrial && trialEndsAt && (
                    <div className="mt-6 pt-6 border-t border-primary/10">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-medium text-primary">Progression de l&apos;essai gratuit</span>
                            <span className="text-xs text-gray-500">{Math.round(((TRIAL_DURATION_DAYS - daysLeft) / TRIAL_DURATION_DAYS) * 100)}% complété</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                                style={{ width: `${Math.min(100, Math.round(((TRIAL_DURATION_DAYS - daysLeft) / TRIAL_DURATION_DAYS) * 100))}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Reactivation CTA */}
                {isExpired && canReactivateTrial && (
                    <div className="mt-6 pt-6 border-t border-red-500/10">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">Réactiver l&apos;essai gratuit</p>
                                <p className="text-xs text-gray-500">Profitez de 14 jours supplémentaires avec toutes les fonctionnalités Pro.</p>
                            </div>
                            <Button
                                onClick={handleReactivateTrial}
                                disabled={isSubmitting}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold shrink-0"
                            >
                                <Clock size={16} className="mr-2" />
                                {isSubmitting ? "Réactivation..." : "Réactiver (14 jours)"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Billing Cycle Toggle */}
            {(!isActive || isTrial || isExpired) && (
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${billingCycle === 'monthly'
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-slate-100 dark:bg-white/5 text-gray-500 hover:text-gray-700 dark:hover:text-white'
                            }`}
                    >
                        Mensuel
                    </button>
                    <button
                        onClick={() => setBillingCycle('annual')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${billingCycle === 'annual'
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-slate-100 dark:bg-white/5 text-gray-500 hover:text-gray-700 dark:hover:text-white'
                            }`}
                    >
                        Annuel
                        <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold">-20%</span>
                    </button>
                </div>
            )}

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-6">
                {getAllPlans()
                    .filter(plan => plan.id !== 'enterprise')
                    .map((plan) => {
                        const isCurrentTier = subscriptionTier === plan.id;
                        const Icon = plan.id === 'starter' ? Rocket : Crown;
                        const price = billingCycle === 'annual'
                            ? plan.pricing.xof.annual.amount
                            : plan.pricing.xof.monthly.amount;
                        const monthlyEquivalent = billingCycle === 'annual'
                            ? Math.round(plan.pricing.xof.annual.amount / 12)
                            : null;
                        const savings = billingCycle === 'annual'
                            ? getAnnualSavings(plan.id, 'xof')
                            : 0;

                        return (
                            <div
                                key={plan.id}
                                className={`rounded-2xl border ${isCurrentTier
                                    ? 'border-primary bg-primary/5'
                                    : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5'
                                    } p-6 flex flex-col relative`}
                            >
                                {plan.popular && !isCurrentTier && (
                                    <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Recommandé
                                    </div>
                                )}

                                {isCurrentTier && (
                                    <div className={`absolute top-4 right-4 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isExpired ? 'bg-red-500 text-white' : isTrial ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                        {isExpired ? 'Expiré' : isTrial ? 'Essai en cours' : 'Plan Actuel'}
                                    </div>
                                )}

                                <div className="flex items-center gap-2 mb-4">
                                    <Icon size={24} className="text-primary" />
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                        {plan.name}
                                    </h3>
                                </div>

                                <div className="mb-6">
                                    {billingCycle === 'annual' ? (
                                        <>
                                            <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                                {formatPrice(monthlyEquivalent!)}
                                            </span>
                                            <span className="text-gray-500 text-xs ml-1">/ mois</span>
                                            <p className="text-xs text-emerald-600 mt-1">
                                                {formatPrice(price)} / an &middot; Économie de {formatPrice(savings)}
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                                {formatPrice(price)}
                                            </span>
                                            <span className="text-gray-500 text-xs ml-1">/ mois</span>
                                        </>
                                    )}
                                    {plan.id === 'starter' && isCurrentTier && isTrial && (
                                        <p className="text-xs text-amber-600 mt-1">
                                            Plan par défaut après l&apos;essai
                                        </p>
                                    )}
                                </div>

                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.highlightedFeatures.slice(0, 4).map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/70">
                                            <Check size={14} className="text-primary" /> {feature}
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    onClick={() => handleUpgrade(plan.id)}
                                    disabled={isSubmitting || (isCurrentTier && isActive)}
                                    className={`w-full h-10 text-sm ${isCurrentTier && isActive
                                        ? 'bg-zinc-800 text-white/50 cursor-not-allowed'
                                        : 'bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg shadow-primary/20'
                                        }`}
                                >
                                    {isCurrentTier && isActive
                                        ? "Plan actuel"
                                        : isTrial
                                            ? `Activer ${plan.name}`
                                            : subscriptionTier === 'pro' && plan.id === 'starter'
                                                ? "Rétrograder"
                                                : plan.id === 'starter'
                                                    ? "Choisir Starter"
                                                    : plan.ctaText
                                    }
                                </Button>
                            </div>
                        );
                    })}
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
