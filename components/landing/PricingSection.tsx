"use client";

import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import Link from "next/link";

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "STARTER",
      price: isAnnual ? 15000 : 19000,
      features: [
        "Jusqu'à 10 biens",
        "Gestion locative de base",
        "Support sous 48h",
        "Documents standards",
        "Accès communauté",
      ],
      cta: "Essai Gratuit",
      href: "/auth/signup?plan=starter",
      description: "Parfait pour les propriétaires débutants",
    },
    {
      name: "PROFESSIONAL",
      price: isAnnual ? 35000 : 45000,
      popular: true,
      features: [
        "Biens illimités",
        "Analyses financières avancées",
        "Support sous 24h",
        "Gestion des incidents",
        "Support prioritaire",
        "Collaboration équipe",
        "Intégrations Wave/OM",
      ],
      cta: "Commencer",
      href: "/auth/signup?plan=professional",
      description: "Idéal pour les agences en croissance",
    },
    {
      name: "ENTERPRISE",
      price: isAnnual ? 95000 : 120000,
      features: [
        "Tout du plan Professional",
        "Solutions sur mesure",
        "Gestionnaire de compte dédié",
        "Support sous 1h",
        "Authentification SSO",
        "Sécurité avancée",
        "Contrats personnalisés",
        "SLA garanti",
      ],
      cta: "Contacter les ventes",
      href: "/contact?subject=enterprise",
      description: "Pour les grandes structures immobilières",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const cardVariants: any = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
    hover: {
      y: -8,
      transition: {
        duration: 0.3,
      },
    },
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-SN").format(price);
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

          {/* Toggle Mensuel/Annuel */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-4"
          >
            <span
              className={`text-sm font-medium transition-colors ${!isAnnual ? "text-[#F4C430]" : "text-gray-500"
                }`}
            >
              Mensuel
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-[#F4C430] data-[state=unchecked]:bg-white/20"
            />
            <span
              className={`text-sm font-medium transition-colors flex items-center gap-2 ${isAnnual ? "text-[#F4C430]" : "text-gray-500"
                }`}
            >
              Annuel
              <span className="text-xs bg-[#F4C430]/20 text-[#F4C430] px-2 py-0.5 rounded-full font-semibold">
                -20%
              </span>
            </span>
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
                  {formatPrice(plan.price)}
                </span>
                <span className="text-gray-500 ml-2 text-sm">FCFA/mois</span>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-500 mb-8">{plan.description}</p>

              {/* CTA Button */}
              <Link
                href={plan.href}
                className={`block w-full py-4 rounded-xl font-semibold text-sm text-center transition-all duration-300 ${plan.popular
                    ? "bg-[#F4C430] text-black hover:bg-[#FFD700] shadow-lg shadow-[#F4C430]/25 hover:shadow-[#F4C430]/40 hover:-translate-y-1"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                  }`}
              >
                {plan.cta}
              </Link>

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
