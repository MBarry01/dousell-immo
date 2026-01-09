"use client";

import { motion } from "framer-motion";
import {
  Building2,
  Users,
  FileText,
  Euro,
  Clock,
  BarChart3,
  MessageSquare,
  Shield,
  Wrench,
  CreditCard,
  Globe,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "Gestion des biens",
    description:
      "Centralisez toutes les informations de vos propriétés à Dakar, Saly et sur la Petite Côte. Photos, documents, caractéristiques techniques.",
    category: "vitrine",
  },
  {
    icon: Users,
    title: "Gestion locataires",
    description:
      "Suivez les contrats, les paiements et communiquez efficacement avec vos locataires depuis une interface unifiée.",
    category: "gestion",
  },
  {
    icon: FileText,
    title: "Documents automatisés",
    description:
      "Générez baux, quittances, états des lieux et documents légaux conformes au droit sénégalais en quelques clics.",
    category: "gestion",
  },
  {
    icon: CreditCard,
    title: "Paiements en ligne",
    description:
      "Acceptez les loyers via Mobile Money (Wave, Orange Money, Free Money) et PayDunya. Suivi automatique des transactions.",
    category: "gestion",
  },
  {
    icon: BarChart3,
    title: "Comptabilité intégrée",
    description:
      "Suivez vos revenus, dépenses, et générez des rapports financiers détaillés. Exportez en PDF pour votre comptable.",
    category: "gestion",
  },
  {
    icon: MessageSquare,
    title: "Messagerie centralisée",
    description:
      "Communiquez avec vos locataires, suivez les demandes d'intervention et l'historique des échanges en un seul endroit.",
    category: "gestion",
  },
  {
    icon: Clock,
    title: "Rappels automatiques",
    description:
      "Ne manquez plus jamais une échéance. Notifications automatiques pour les loyers, renouvellements de bail et entretiens.",
    category: "gestion",
  },
  {
    icon: Wrench,
    title: "Suivi des interventions",
    description:
      "Gérez les demandes de maintenance, suivez l'état d'avancement et gardez l'historique complet des travaux effectués.",
    category: "gestion",
  },
  {
    icon: Globe,
    title: "Vitrine publique",
    description:
      "Diffusez vos annonces sur votre page dédiée. Photos HD, visite virtuelle, géolocalisation pour attirer les meilleurs locataires.",
    category: "vitrine",
  },
  {
    icon: Shield,
    title: "Sécurité maximale",
    description:
      "Données cryptées, sauvegardes automatiques et conformité RGPD. Vos informations sensibles sont protégées.",
    category: "vitrine",
  },
  {
    icon: Euro,
    title: "Multi-devises",
    description:
      "Gérez vos biens en FCFA, EUR ou USD. Idéal pour les propriétaires de la diaspora ou les investissements internationaux.",
    category: "gestion",
  },
  {
    icon: Zap,
    title: "Performance optimale",
    description:
      "Interface ultra-rapide, fonctionne même hors-ligne. Synchronisation automatique dès que la connexion est rétablie.",
    category: "vitrine",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 md:py-28 bg-black relative" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
            Une suite complète d'outils pour optimiser la gestion de vos biens immobiliers au
            Sénégal. De la vitrine publique à la gestion locative.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-[#F4C430]/30 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              {/* Category Badge */}
              <div className="absolute top-4 right-4">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    feature.category === "vitrine"
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                      : "bg-[#F4C430]/10 text-[#F4C430] border border-[#F4C430]/30"
                  }`}
                >
                  {feature.category === "vitrine" ? "Vitrine" : "Gestion"}
                </span>
              </div>

              {/* Icon */}
              <div className="w-12 h-12 bg-[#F4C430]/10 border border-[#F4C430]/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#F4C430]/20 transition-colors">
                <feature.icon className="h-6 w-6 text-[#F4C430]" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-gray-400 mb-6">
            Et bien plus encore... Découvrez toutes les fonctionnalités
          </p>
          <a
            href="#demo"
            className="inline-flex items-center gap-2 text-[#F4C430] hover:text-[#FFD700] transition-colors font-medium"
          >
            <span>Voir la démonstration complète</span>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
