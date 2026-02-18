"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import {
  getAllPlans,
  formatPrice,
  type BillingCycle,
  type Currency,
} from "@/lib/subscription/plans-config";

const BILLING_PERIODS = [
  { label: "Mensuel", key: "monthly" as const, saving: null },
  { label: "Annuel", key: "annual" as const, saving: "2 mois offerts" },
];

const CURRENCIES = [
  { label: "XOF", key: "xof" as const, flag: "🇸🇳", name: "FCFA" },
  { label: "EUR", key: "eur" as const, flag: "🇪🇺", name: "€" },
];

export default function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<BillingCycle>("monthly");
  const [currency, setCurrency] = useState<Currency>("xof");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();
  }, []);

  // Transformation dynamique des plans selon la devise sélectionnée
  const plans = getAllPlans().map((plan) => ({
    name: plan.name,
    description: plan.tagline,
    pricing: {
      monthly: {
        amount: plan.pricing[currency].monthly.amount,
        formattedPrice: formatPrice(plan.pricing[currency].monthly.amount, currency),
      },
      annual: {
        amount: plan.pricing[currency].annual.amount,
        formattedPrice: formatPrice(plan.pricing[currency].annual.amount, currency),
      },
    },
    features: plan.highlightedFeatures,
    cta: plan.ctaText,
    popular: plan.popular || false,
    tier: plan.id,
  }));

  return (
    <section className="py-20 md:py-28 bg-black relative" id="pricing">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F4C430]/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-[clamp(1.875rem,4vw,3rem)] font-bold text-white mb-4">
            Tarifs transparents et adaptés
          </h2>
          <p className="text-[clamp(1rem,1.5vw,1.25rem)] text-gray-400 max-w-2xl mx-auto mb-8">
            Choisissez le plan qui correspond à vos besoins. Tous les plans incluent 14 jours
            d&apos;essai gratuit.
          </p>

          {/* Controls: Currency + Billing Period */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            {/* Currency Toggle */}
            <div className="inline-flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-full">
              {CURRENCIES.map((curr) => (
                <button
                  key={curr.key}
                  onClick={() => setCurrency(curr.key)}
                  className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                    currency === curr.key
                      ? "bg-[#F4C430] text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title={`Afficher les prix en ${curr.name}`}
                >
                  <span>{curr.flag}</span>
                  <span>{curr.label}</span>
                </button>
              ))}
            </div>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-3 p-1 bg-white/5 border border-white/10 rounded-full">
              {BILLING_PERIODS.map((period) => (
                <button
                  key={period.key}
                  onClick={() => setBillingPeriod(period.key)}
                  className={`relative px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    billingPeriod === period.key
                      ? "bg-[#F4C430] text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {period.label}
                  {period.saving && billingPeriod === period.key && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-[#F4C430] whitespace-nowrap">
                      ✨ {period.saving}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`relative bg-white/5 border rounded-3xl p-8 ${
                plan.popular
                  ? "border-[#F4C430] shadow-[0_0_40px_rgba(244,196,48,0.2)] md:scale-105"
                  : "border-white/10"
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-[#F4C430] text-black text-sm font-semibold px-4 py-1 rounded-full">
                    Le plus populaire
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </div>

              {/* Pricing */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">
                    {plan.pricing[billingPeriod].formattedPrice}
                  </span>
                  <span className="text-gray-400">
                    /{billingPeriod === "monthly" ? "mois" : "an"}
                  </span>
                </div>
                {billingPeriod === "annual" && (
                  <p className="text-sm text-gray-400 mt-2">
                    Soit {formatPrice(Math.round(plan.pricing.annual.amount / 12), currency)}/mois
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#F4C430]/10 border border-[#F4C430]/30 flex items-center justify-center mt-0.5">
                      <Check className="h-3 w-3 text-[#F4C430]" />
                    </div>
                    <span className="text-gray-300 text-sm leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link
                href={
                  plan.tier === "enterprise"
                    ? "/contact?subject=enterprise"
                    : isLoggedIn
                      ? "/gestion/config?tab=subscription"
                      : `/register?plan=${plan.tier}`
                }
                className={`block w-full text-center py-3 px-6 rounded-full font-semibold transition-all ${
                  plan.popular
                    ? "bg-[#F4C430] text-black hover:bg-[#FFD700] shadow-[0_0_20px_rgba(244,196,48,0.3)]"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom Note */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-gray-400">
            Tous les plans incluent : Sécurité SSL • Sauvegardes automatiques • Mises à jour
            gratuites
          </p>
          <p className="text-gray-500 text-sm mt-2">
            💳 Paiement sécurisé via Wave, Orange Money ou carte bancaire
          </p>
        </motion.div>
      </div>
    </section>
  );
}
