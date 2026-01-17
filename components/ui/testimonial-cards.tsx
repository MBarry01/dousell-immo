"use client";

import * as React from 'react';
import { motion, PanInfo } from 'framer-motion';

interface Testimonial {
  id: number;
  testimonial: string;
  author: string;
  role: string;
  avatarUrl: string;
}

interface TestimonialCardProps extends Testimonial {
  handleShuffle: () => void;
  position: "front" | "middle" | "back";
}

export function TestimonialCard({
  handleShuffle,
  testimonial,
  position,
  author,
  role,
  avatarUrl,
}: TestimonialCardProps) {
  const dragRef = React.useRef(0);
  const isFront = position === "front";

  return (
    <motion.div
      style={{
        zIndex: position === "front" ? "2" : position === "middle" ? "1" : "0",
      }}
      animate={{
        rotate: position === "front" ? "-6deg" : position === "middle" ? "0deg" : "6deg",
        x: position === "front" ? "0%" : position === "middle" ? "33%" : "66%",
        scale: position === "front" ? 1 : position === "middle" ? 0.96 : 0.92,
      }}
      drag={true}
      dragElastic={0.35}
      dragListener={isFront}
      dragConstraints={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      onDragStart={(event, info) => {
        dragRef.current = info.point.x;
      }}
      onDragEnd={(event, info) => {
        if (dragRef.current - info.point.x > 150) {
          handleShuffle();
        }
        dragRef.current = 0;
      }}
      transition={{ duration: 0.35 }}
      className={`absolute left-0 top-0 grid h-[450px] w-[350px] select-none place-content-center space-y-6 rounded-2xl border-2 border-white/10 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur-xl ${isFront ? "cursor-grab active:cursor-grabbing hover:border-[#F4C430]/50 transition-colors" : ""
        }`}
    >
      <img
        src={avatarUrl}
        alt={`Avatar of ${author}`}
        className="pointer-events-none mx-auto h-24 w-24 rounded-full border-2 border-[#F4C430] object-cover shadow-lg shadow-[#F4C430]/20"
      />
      <span className="text-center text-lg italic text-white/80 leading-relaxed">&quot;{testimonial}&quot;</span>
      <div className="flex flex-col items-center">
        <span className="text-center text-base font-bold text-white">{author}</span>
        <span className="text-center text-sm font-medium text-[#F4C430]">{role}</span>
      </div>
    </motion.div>
  );
}

// Données pour les PROPRIÉTAIRES
const ownerTestimonials: Testimonial[] = [
  {
    id: 1,
    testimonial: "Dousell a complètement transformé ma gestion locative. Les paiements automatiques sont une bénédiction.",
    author: "Aminata Diallo",
    role: "Propriétaire à Dakar",
    avatarUrl: "https://images.unsplash.com/photo-1507152832244-10d45c7eda57?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" // Professional Black Woman
  },
  {
    id: 2,
    testimonial: "Depuis que j'utilise Dousell, je n'ai plus aucun retard de paiement. Tout est clair et net.",
    author: "Pape Modou Ndiaye",
    role: "Propriétaire à Saly",
    avatarUrl: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" // Professional Black Man
  },
  {
    id: 3,
    testimonial: "Enfin un outil sérieux pour l'immobilier au Sénégal. La transparence des quittances rassure tout le monde.",
    author: "Fatou Ndiaye",
    role: "Investisseuse à Mermoz",
    avatarUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=250&auto=format&fit=crop" // Elegant Black Woman
  }
];

// Données pour les LOCATAIRES
const tenantTestimonials: Testimonial[] = [
  {
    id: 1,
    testimonial: "Trouver un appartement à Dakar n'a jamais été aussi simple. Le processus de visite virtuelle m'a fait gagner un temps précieux !",
    author: "Sophie Diop",
    role: "Locataire à Mermoz",
    avatarUrl: "https://prod.cdn-medias.jeuneafrique.com/cdn-cgi/image/q=auto,f=auto,metadata=none,width=1215,fit=cover/https://prod.cdn-medias.jeuneafrique.com/medias/2015/01/02/002012015174541000000folorunso.jpg" // Young Black Woman
  },
  {
    id: 2,
    testimonial: "Une transparence totale sur les frais et un état des lieux numérique très rassurant. Je recommande vivement.",
    author: "Cheikh Anta",
    role: "Locataire à Saly",
    avatarUrl: "https://images.unsplash.com/photo-1531384441138-2736e62e0919?q=80&w=250&auto=format&fit=crop" // Young Black Man
  },
  {
    id: 3,
    testimonial: "Le paiement du loyer par Wave intégré est un vrai plus. Plus besoin de courir après les reçus.",
    author: "Aminata Faye",
    role: "Locataire au Plateau",
    avatarUrl: "https://images.unsplash.com/photo-1507152832244-10d45c7eda57?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" // Friendly Black Woman
  }
];

interface ShuffleCardsProps {
  mode?: "owner" | "tenant";
}

export function ShuffleCards({ mode = "owner" }: ShuffleCardsProps) {
  const [positions, setPositions] = React.useState<("front" | "middle" | "back")[]>(["front", "middle", "back"]);

  const testimonials = mode === "owner" ? ownerTestimonials : tenantTestimonials;

  const handleShuffle = () => {
    setPositions((prev) => {
      const newPositions = [...prev];
      const last = newPositions.pop();
      if (last) newPositions.unshift(last);
      return newPositions;
    });
  };

  return (
    <div className="grid place-content-center overflow-hidden bg-black px-8 py-24 text-slate-50 w-full relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#F4C430]/10 via-black to-black opacity-50 pointer-events-none" />

      <div className="relative z-10 mb-12 text-center space-y-4">
        <h2 className="text-3xl md:text-5xl font-bold font-display text-white">
          {mode === "owner" ? (
            <>Ils nous font <span className="text-[#F4C430]">confiance</span></>
          ) : (
            <>Ils ont trouvé leur <span className="text-[#F4C430]">bonheur</span></>
          )}
        </h2>
        <p className="text-white/60 max-w-lg mx-auto">
          {mode === "owner"
            ? "Découvrez les retours de propriétaires qui automatisent leur gestion avec Dousell."
            : "Découvrez les expériences de locataires qui ont choisi Dousell pour leur logement."
          }
        </p>
      </div>

      <div className="relative -ml-[100px] h-[450px] w-[350px] md:-ml-[175px] z-10">
        {testimonials.map((testimonial, index) => (
          <TestimonialCard
            key={testimonial.id}
            {...testimonial}
            handleShuffle={handleShuffle}
            position={positions[index]}
          />
        ))}
      </div>
    </div>
  );
}
