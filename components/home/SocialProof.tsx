"use client";

import { useEffect, useState } from "react";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";

export default function SocialProof() {
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });

  const [startCount, setStartCount] = useState(false);

  useEffect(() => {
    if (inView) {
      setStartCount(true);
    }
  }, [inView]);

  const stats = [
    {
      value: 350000000,
      suffix: " FCFA",
      label: "de loyers sécurisés ce mois",
      format: true,
    },
    {
      value: 1250,
      suffix: "+",
      label: "propriétés gérées",
      format: false,
    },
    {
      value: 98,
      suffix: "%",
      label: "de satisfaction client",
      format: false,
    },
  ];

  return (
    <div ref={ref} className="py-16 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-amber-500/20 shadow-2xl">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-amber-500 font-bold tracking-widest uppercase text-sm">
            Résultats Concrets
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4">
            Des chiffres qui parlent
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-amber-500/50 transition-all duration-300"
            >
              <div className="text-5xl md:text-6xl font-bold bg-gradient-to-br from-amber-500 to-yellow-600 bg-clip-text text-transparent mb-4">
                {startCount ? (
                  <CountUp
                    end={stat.value}
                    duration={2.5}
                    separator=" "
                    suffix={stat.suffix}
                  />
                ) : (
                  "0"
                )}
              </div>
              <p className="text-slate-300 text-lg">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-400 italic">
            Mis à jour en temps réel • Données certifiées
          </p>
        </div>
      </div>
    </div>
  );
}
