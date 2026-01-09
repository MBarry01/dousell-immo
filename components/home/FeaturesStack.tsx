"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const features = [
  {
    title: "Quittances Automatiques",
    description: "Génération et envoi automatique des quittances de loyer chaque mois.",
    icon: "📄",
    color: "from-amber-500 to-yellow-600",
  },
  {
    title: "Encaissements Suivis",
    description: "Tableau de bord en temps réel de tous vos paiements et retards.",
    icon: "💰",
    color: "from-emerald-500 to-teal-600",
  },
  {
    title: "Maintenance Centralisée",
    description: "Gestionnaire de tickets pour les incidents et réparations.",
    icon: "🔧",
    color: "from-blue-500 to-cyan-600",
  },
  {
    title: "Documents Légaux",
    description: "Stockage sécurisé de tous vos contrats et baux.",
    icon: "📋",
    color: "from-purple-500 to-pink-600",
  },
];

export default function FeaturesStack() {
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    cardsRef.current.forEach((card, index) => {
      if (!card) return;

      gsap.fromTo(
        card,
        {
          y: 100,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          scrollTrigger: {
            trigger: card,
            start: "top 80%",
            end: "top 50%",
            scrub: true,
          },
        }
      );

      // Sticky effect
      ScrollTrigger.create({
        trigger: card,
        start: "top 20%",
        end: "bottom top",
        pin: true,
        pinSpacing: false,
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div className="relative space-y-6">
      {features.map((feature, index) => (
        <div
          key={index}
          ref={(el) => {
            cardsRef.current[index] = el;
          }}
          className="relative"
        >
          <div
            className={`
              bg-gradient-to-br ${feature.color}
              p-8 rounded-3xl shadow-2xl
              transform transition-all duration-300
              hover:scale-105 hover:shadow-amber-500/20
              border border-white/20
            `}
          >
            <div className="text-6xl mb-4">{feature.icon}</div>
            <h3 className="text-2xl font-bold text-white mb-3">
              {feature.title}
            </h3>
            <p className="text-white/90 leading-relaxed">
              {feature.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
