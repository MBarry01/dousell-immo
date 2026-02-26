"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Amadou Diop",
    role: "Investisseur immobilier",
    location: "Dakar, Sénégal",
    image: null,
    rating: 5,
    text: "Dousel a complètement transformé ma façon de gérer mes 12 appartements à Dakar. Je gagne au moins 15 heures par semaine ! L'interface est intuitive et le support client est exceptionnel. Je recommande vivement.",
  },
  {
    name: "Fatou Sall",
    role: "Gestionnaire immobilier",
    location: "Saly, Sénégal",
    image: null,
    rating: 5,
    text: "Interface intuitive et support client exceptionnel. Le paiement via Mobile Money est un vrai plus pour mes locataires. Les documents générés sont conformes et professionnels. Un outil indispensable pour tout professionnel de l'immobilier.",
  },
  {
    name: "Jean-Marc Dubois",
    role: "Propriétaire expatrié",
    location: "Paris, France",
    image: null,
    rating: 5,
    text: "Je gère mes biens au Sénégal depuis la France grâce à Dousel. Les rapports financiers automatiques et la messagerie intégrée me permettent de suivre tout en temps réel. La tranquillité d'esprit n'a pas de prix !",
  },
  {
    name: "Aïssatou Ndiaye",
    role: "Agence immobilière",
    location: "Thiès, Sénégal",
    image: null,
    rating: 5,
    text: "Nous gérons plus de 50 biens avec Dousel. Le système de permissions multi-utilisateurs est parfait pour notre équipe. Nos clients apprécient particulièrement la vitrine en ligne pour leurs annonces.",
  },
  {
    name: "Moussa Sy",
    role: "Propriétaire",
    location: "Mbour, Sénégal",
    image: null,
    rating: 5,
    text: "La génération automatique des quittances et des rappels de loyer m'a fait gagner un temps fou. Plus besoin de courir après mes locataires ! Le système de paiement intégré est super pratique.",
  },
  {
    name: "Sophie Lambert",
    role: "Investisseuse",
    location: "Dakar, Sénégal",
    image: null,
    rating: 5,
    text: "J'utilise Dousel depuis 6 mois et je ne peux plus m'en passer. La comptabilité intégrée me permet de suivre précisément ma rentabilité. L'export PDF pour mon comptable est un vrai plus.",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 md:py-28 bg-black relative" id="testimonials">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#F4C430]/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-[#F4C430]/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-[clamp(1.875rem,4vw,3rem)] font-bold text-white mb-4">
            Ce que disent nos clients
          </h2>
          <p className="text-[clamp(1rem,1.5vw,1.25rem)] text-gray-400 max-w-2xl mx-auto">
            Rejoignez des milliers de propriétaires satisfaits qui ont simplifié leur gestion
            immobilière
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-[#F4C430]/30 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
            >
              {/* Quote Icon */}
              <div className="mb-4">
                <Quote className="h-8 w-8 text-[#F4C430]/30" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[#F4C430] text-[#F4C430]" />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-gray-300 leading-relaxed mb-6">{testimonial.text}</p>

              {/* Author Info */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                {/* Avatar Placeholder */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F4C430] to-[#FFD700] flex items-center justify-center text-black font-bold">
                  {testimonial.name.charAt(0)}
                </div>

                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-gray-400">
                    {testimonial.role} • {testimonial.location}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Stats */}
        <motion.div
          className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">4.9/5</div>
            <div className="text-gray-400">Note moyenne</div>
            <div className="flex justify-center gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-[#F4C430] text-[#F4C430]" />
              ))}
            </div>
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">2000+</div>
            <div className="text-gray-400">Utilisateurs actifs</div>
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">98%</div>
            <div className="text-gray-400">Taux de satisfaction</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
