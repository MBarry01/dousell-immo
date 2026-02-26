"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: 1,
    question: "Comment fonctionne l'essai gratuit de 14 jours ?",
    answer:
      "Vous pouvez tester toutes les fonctionnalités de Dousel pendant 14 jours sans engagement. Aucune carte bancaire n'est requise lors de l'inscription. À la fin de l'essai, vous pouvez choisir le plan qui vous convient ou continuer gratuitement avec des fonctionnalités limitées.",
  },
  {
    id: 2,
    question: "Quels modes de paiement acceptez-vous ?",
    answer:
      "Nous acceptons les paiements via Mobile Money (Wave, Orange Money, Free Money), PayDunya, et cartes bancaires. Vos locataires peuvent également payer leur loyer via ces mêmes moyens directement depuis la plateforme.",
  },
  {
    id: 3,
    question: "Mes données sont-elles sécurisées ?",
    answer:
      "Absolument. Toutes vos données sont cryptées avec SSL/TLS, stockées sur des serveurs sécurisés avec sauvegardes automatiques quotidiennes. Nous sommes conformes aux normes RGPD et ne partageons jamais vos informations avec des tiers.",
  },
  {
    id: 4,
    question: "Puis-je changer de plan à tout moment ?",
    answer:
      "Oui ! Vous pouvez passer à un plan supérieur à tout moment et bénéficier immédiatement des nouvelles fonctionnalités. Si vous rétrogradez, le changement prendra effet à la fin de votre période de facturation en cours.",
  },
  {
    id: 5,
    question: "Les documents générés sont-ils conformes au droit sénégalais ?",
    answer:
      "Oui, tous nos modèles de documents (baux, quittances, états des lieux) sont conformes à la législation sénégalaise en vigueur. Ils sont régulièrement mis à jour par nos experts juridiques pour refléter les dernières réglementations.",
  },
  {
    id: 6,
    question: "Comment fonctionne la vitrine publique pour mes annonces ?",
    answer:
      "Chaque propriétaire dispose d'une page vitrine personnalisée où vous pouvez publier vos biens disponibles à la location. Vos annonces incluent photos HD, description détaillée, visite virtuelle, géolocalisation et formulaire de contact. C'est idéal pour attirer des locataires qualifiés.",
  },
  {
    id: 7,
    question: "Puis-je inviter d'autres utilisateurs (comptable, assistant) ?",
    answer:
      "Oui, avec le plan Enterprise, vous pouvez inviter plusieurs utilisateurs avec des permissions personnalisées (consultation seule, gestion complète, comptabilité, etc.). C'est parfait pour les agences ou si vous travaillez avec un comptable.",
  },
  {
    id: 8,
    question: "L'application fonctionne-t-elle hors ligne ?",
    answer:
      "Oui ! L'application fonctionne en mode hors ligne pour les consultations et certaines actions. Dès que vous retrouvez une connexion internet, toutes vos modifications sont automatiquement synchronisées.",
  },
];

export default function FAQSection() {
  const [activeItem, setActiveItem] = useState<number | null>(1);

  const toggleItem = (itemId: number) => {
    setActiveItem(activeItem === itemId ? null : itemId);
  };

  return (
    <section className="py-20 md:py-28 bg-black" id="faq">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-[clamp(1.875rem,4vw,3rem)] font-bold text-white mb-4">
            Questions fréquentes
          </h2>
          <p className="text-lg text-gray-400">
            Vous avez une question ? Nous avons les réponses. Sinon, contactez-nous directement !
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <FAQItemComponent
                item={item}
                isActive={activeItem === item.id}
                onToggle={() => toggleItem(item.id)}
              />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-12 text-center p-8 bg-white/5 border border-white/10 rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-xl font-bold text-white mb-3">
            Vous ne trouvez pas la réponse à votre question ?
          </h3>
          <p className="text-gray-400 mb-6">
            Notre équipe est là pour vous aider. Contactez-nous et nous vous répondrons dans les
            24h.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#F4C430] text-black font-semibold rounded-full hover:bg-[#FFD700] transition-all"
          >
            Nous contacter
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function FAQItemComponent({
  item,
  isActive,
  onToggle,
}: {
  item: FAQItem;
  isActive: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#F4C430]/30 transition-colors">
      <button
        type="button"
        className="flex items-center justify-between w-full p-6 text-left"
        onClick={onToggle}
        aria-expanded={isActive}
      >
        <span className="text-lg font-semibold text-white pr-8">{item.question}</span>
        <span className="flex-shrink-0">
          {isActive ? (
            <Minus className="h-5 w-5 text-[#F4C430]" />
          ) : (
            <Plus className="h-5 w-5 text-gray-400" />
          )}
        </span>
      </button>

      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">
              <p className="text-gray-400 leading-relaxed">{item.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
