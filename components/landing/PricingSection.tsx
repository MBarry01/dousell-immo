"use client";

import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import {
  getAllPlans,
  formatPrice,
  type Currency,
} from "@/lib/subscription/plans-config";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Assuming sonner is used, or alert/console

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [currency, setCurrency] = useState<Currency>('xof');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const router = useRouter();

  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);

      if (user) {
        const { data: teamMembership } = await supabase
          .from("team_members")
          .select("team:teams(subscription_tier, subscription_status)")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        const team = teamMembership?.team as { subscription_tier?: string; subscription_status?: string } | null;
        if (team) {
          setCurrentPlan(team.subscription_tier || null);
          setSubscriptionStatus(team.subscription_status || null);
        }
      }
    };
    checkAuth();
  }, []);

  const handleUpgrade = async (planId: string) => {
    if (!isLoggedIn) {
      router.push(`/register?plan=${planId}&interval=${isAnnual ? 'annual' : 'monthly'}`);
      return;
    }

    // Check if user is already on this plan (active or trial)
    if (currentPlan === planId && (subscriptionStatus === 'active' || subscriptionStatus === 'trialing')) {
      router.push('/gestion/abonnement');
      return;
    }

    // Direct Stripe Checkout for logged-in users
    try {
      setLoadingPlanId(planId);
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          interval: isAnnual ? 'annual' : 'monthly',
          currency,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.redirect) {
        router.push(data.redirect);
      } else {
        console.error('Checkout error:', data.error);
        toast.error("Erreur lors de l'initialisation du paiement");
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error("Une erreur inattendue est survenue");
    } finally {
      setLoadingPlanId(null);
    }
  };

  // Transformation des plans depuis plans-config
  const plans = getAllPlans().map((plan) => {
    // Pricing logic based on currency and interval
    const pricing = plan.pricing[currency];
    const rawPrice = isAnnual ? pricing.annual.amount : pricing.monthly.amount;

    // Display logic: show monthly equivalent if annual
    const displayPrice = isAnnual
      ? Math.round(pricing.annual.amount / 12)
      : pricing.monthly.amount;

    return {
      name: plan.name.toUpperCase(),
      price: displayPrice,
      rawPrice, // Keep raw for calculation if needed
      popular: plan.popular,
      features: plan.highlightedFeatures,
      cta: plan.ctaText,
      // For enterprise, specific logic usually applies (contact sales)
      // but here we align with the config cta
      isEnterprise: plan.id === 'enterprise',
      id: plan.id,
      description: plan.tagline,
    };
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 100, damping: 15 } },
    hover: { y: -8, transition: { duration: 0.3 } },
  };

  return (
    <section id="pricing" className="relative py-24 md:py-32 bg-black overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(244,196,48,0.05)_0%,_transparent_50%)]" />
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-[#F4C430]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-[#F4C430]/3 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-[#F4C430] text-sm font-medium tracking-widest uppercase mb-4"
          >
            Tarifs
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white"
          >
            Simple et{" "}
            <span className="gradient-text-animated">transparent</span>
          </motion.h2>
          <div className="gold-divider w-24 mx-auto mb-6" />
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto mb-10"
          >
            Choisissez le plan adapté à vos besoins. Sans engagement, annulez à tout moment.
          </motion.p>

          {/* Controls Container (Currency + Interval) */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col md:flex-row items-center justify-center gap-6" // Increased gap and flex-col for mobile
          >

            {/* Currency Toggle */}
            <div className="bg-white/5 p-1 rounded-full flex relative">
              <button
                onClick={() => setCurrency('xof')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${currency === 'xof' ? 'bg-[#F4C430] text-black shadow-lg' : 'text-gray-400 hover:text-white'
                  }`}
              >
                FCFA (XOF)
              </button>
              <button
                onClick={() => setCurrency('eur')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${currency === 'eur' ? 'bg-[#F4C430] text-black shadow-lg' : 'text-gray-400 hover:text-white'
                  }`}
              >
                EUR (€)
              </button>
            </div>

            {/* Interval Toggle */}
            <div className="flex items-center gap-4">
              <span className={`text-sm font-medium transition-colors ${!isAnnual ? "text-[#F4C430]" : "text-gray-500"}`}>
                Mensuel
              </span>
              <Switch
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
                className="data-[state=checked]:bg-[#F4C430] data-[state=unchecked]:bg-white/20"
              />
              <span className={`text-sm font-medium transition-colors flex items-center gap-2 ${isAnnual ? "text-[#F4C430]" : "text-gray-500"}`}>
                Annuel
                <span className="text-xs bg-[#F4C430]/20 text-[#F4C430] px-2 py-0.5 rounded-full font-semibold">
                  -20%
                </span>
              </span>
            </div>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-6 lg:gap-8"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={cardVariants}
              whileHover="hover"
              className={`relative rounded-2xl p-8 backdrop-blur-sm transition-all duration-300 ${plan.popular
                ? "bg-gradient-to-b from-[#F4C430]/10 to-transparent border-2 border-[#F4C430]/50 shadow-2xl shadow-[#F4C430]/10"
                : "bg-white/5 border border-white/10 hover:border-[#F4C430]/30"
                }`}
            >
              {/* Badge Populaire */}
              {plan.popular && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#F4C430] text-black px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg"
                >
                  <Star className="w-3.5 h-3.5 fill-current" /> Populaire
                </motion.div>
              )}

              {/* Plan Name */}
              <h3 className="text-sm font-bold tracking-wider text-gray-400 mb-4">
                {plan.name}
              </h3>

              {/* Price */}
              <div className="mb-2 flex items-baseline">
                <span className={`text-4xl lg:text-5xl font-bold tracking-tight ${plan.popular ? "text-[#F4C430]" : "text-white"}`}>
                  {formatPrice(plan.price, currency)}
                </span>
                <span className="text-gray-500 ml-2 text-sm">{currency === 'xof' ? '/mois' : '€/mois'}</span>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-500 mb-8">{plan.description}</p>

              {/* CTA Button */}
              {plan.isEnterprise ? (
                <Link
                  href="/contact?subject=enterprise"
                  className="block w-full py-4 rounded-xl font-semibold text-sm text-center transition-all duration-300 bg-white/10 text-white hover:bg-white/20 border border-white/10"
                >
                  {plan.cta}
                </Link>
              ) : currentPlan === plan.id && (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') ? (
                <button
                  onClick={() => router.push('/gestion/abonnement')}
                  className="block w-full py-4 rounded-xl font-semibold text-sm text-center transition-all duration-300 bg-white/10 text-white hover:bg-white/20 border border-white/10"
                >
                  Gérer l&apos;abonnement
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loadingPlanId === plan.id}
                  className={`block w-full py-4 rounded-xl font-semibold text-sm text-center transition-all duration-300 ${plan.popular
                    ? "bg-[#F4C430] text-black hover:bg-[#FFD700] shadow-lg shadow-[#F4C430]/25 hover:shadow-[#F4C430]/40 hover:-translate-y-1"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                    } ${loadingPlanId === plan.id ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {loadingPlanId === plan.id ? 'Chargement...' : plan.cta}
                </button>
              )}


              {/* Features */}
              <div className="mt-8 pt-8 border-t border-white/10">
                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className={`p-1 rounded-full mt-0.5 ${plan.popular ? "bg-[#F4C430]/20 text-[#F4C430]" : "bg-white/10 text-gray-400"}`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="text-sm text-gray-400">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-gray-600 text-sm mt-12"
        >
          Tous les prix sont en FCFA. TVA incluse. Paiement sécurisé via Wave, Orange Money ou carte bancaire.
        </motion.p>
      </div>
    </section>
  );
}
