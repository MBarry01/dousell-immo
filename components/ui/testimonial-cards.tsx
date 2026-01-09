"use client";

import * as React from "react";
import { motion } from "framer-motion";

interface TestimonialCardProps {
  handleShuffle: () => void;
  testimonial: string;
  position: "front" | "middle" | "back";
  id: number;
  author: string;
}

export function TestimonialCard({
  handleShuffle,
  testimonial,
  position,
  id,
  author,
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
      onDragStart={(e) => {
        if ("clientX" in e) {
          dragRef.current = e.clientX;
        }
      }}
      onDragEnd={(e) => {
        if ("clientX" in e) {
          if (dragRef.current - e.clientX > 150) {
            handleShuffle();
          }
          dragRef.current = 0;
        }
      }}
      transition={{ duration: 0.35 }}
      className={`absolute left-0 top-0 grid h-[450px] w-[350px] select-none place-content-center space-y-6 rounded-2xl border-2 border-white/10 bg-black/40 p-6 shadow-xl backdrop-blur-md ${
        isFront ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <img
        src={`https://i.pravatar.cc/128?img=${id}`}
        alt={`Avatar de ${author}`}
        className="pointer-events-none mx-auto h-32 w-32 rounded-full border-2 border-[#F4C430]/30 bg-slate-200 object-cover"
      />
      <span className="text-center text-lg italic text-gray-300">"{testimonial}"</span>
      <span className="text-center text-sm font-medium text-[#F4C430]">{author}</span>
    </motion.div>
  );
}

interface ShuffleCardsProps {
  testimonials?: Array<{
    id: number;
    testimonial: string;
    author: string;
  }>;
}

export function ShuffleCards({ testimonials: customTestimonials }: ShuffleCardsProps) {
  const defaultTestimonials = [
    {
      id: 1,
      testimonial:
        "Dousell Immo a transformé ma gestion locative. Interface intuitive et gain de temps énorme !",
      author: "Amadou D. - Propriétaire à Dakar",
    },
    {
      id: 2,
      testimonial:
        "Le meilleur outil pour gérer mes biens au Sénégal depuis la France. Support exceptionnel.",
      author: "Sophie L. - Investisseuse expatriée",
    },
    {
      id: 3,
      testimonial:
        "Nos clients adorent la vitrine en ligne. Les paiements Mobile Money sont un vrai plus.",
      author: "Fatou S. - Agence immobilière",
    },
  ];

  const testimonials = customTestimonials || defaultTestimonials;
  const [positions, setPositions] = React.useState<Array<"front" | "middle" | "back">>([
    "front",
    "middle",
    "back",
  ]);

  const handleShuffle = () => {
    const newPositions = [...positions];
    const last = newPositions.pop();
    if (last) {
      newPositions.unshift(last);
    }
    setPositions(newPositions);
  };

  return (
    <div className="relative -ml-[100px] h-[450px] w-[350px] md:-ml-[175px]">
      {testimonials.map((testimonial, index) => (
        <TestimonialCard
          key={testimonial.id}
          {...testimonial}
          handleShuffle={handleShuffle}
          position={positions[index]}
        />
      ))}
    </div>
  );
}
