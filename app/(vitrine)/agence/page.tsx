"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

const stats = [
  { label: "Années d'expérience", value: "10+" },
  { label: "Familles logées", value: "500+" },
  { label: "Biens en gestion", value: "50+" },
];

const team = [
  {
    name: "Mame Diarra Ndiaye",
    role: "Responsable Almadies",
    whatsapp: "221780000001",
    photo:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Ibrahima Sow",
    role: "Gestion Plateau",
    whatsapp: "221770000045",
    photo:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Fatou Camara",
    role: "Experte Mermoz/Sacré-Cœur",
    whatsapp: "221770000078",
    photo:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
  },
];

const valeurs = [
  {
    title: "Transparence",
    description: "Honoraires clairs, contrats sécurisés, reporting mensuel.",
  },
  {
    title: "Réactivité",
    description: "Réponse en -24h, WhatsApp first, visites 7/7.",
  },
  {
    title: "Expertise locale",
    description: "Experts par quartier, réseau artisans & notaires à Dakar.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export default function AgencePage() {
  return (
    <div className="space-y-10 py-10">
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.6 }}
        className="rounded-[36px] border border-white/10 bg-gradient-to-br from-card via-background to-background p-8 text-white shadow-2xl"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">
          À propos
        </p>
        <h1 className="mt-4 text-4xl font-semibold">
          L&apos;immobilier de confiance à Dakar
        </h1>
        <p className="mt-3 text-lg text-white/70">
          Une équipe locale qui accompagne propriétaires, investisseurs et
          expatriés avec des standards premium, du Plateau aux Almadies.
        </p>
      </motion.section>

      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="rounded-3xl border border-white/10 bg-background/5 p-6 text-center text-white"
          >
            <p className="text-4xl font-bold">{stat.value}</p>
            <p className="mt-2 text-sm text-white/60">{stat.label}</p>
          </motion.div>
        ))}
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            L&apos;équipe
          </p>
          <h2 className="text-3xl font-semibold text-white">
            Vos experts dédiés
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {team.map((member, index) => (
            <motion.div
              key={member.name}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="rounded-3xl border border-white/10 bg-background/5 p-4 text-white"
            >
              <div className="relative h-48 w-full overflow-hidden rounded-2xl">
                <Image
                  src={member.photo}
                  alt={member.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-xl font-semibold">{member.name}</p>
                <p className="text-sm text-white/60">{member.role}</p>
              </div>
              <Button
                variant="secondary"
                className="mt-4 w-full rounded-full border border-white/10 bg-emerald-500/10 text-emerald-500"
                asChild
              >
                <a
                  href={`https://wa.me/${member.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp Direct
                </a>
              </Button>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            ADN
          </p>
          <h2 className="text-3xl font-semibold text-white">Nos valeurs</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {valeurs.map((valeur, index) => (
            <motion.div
              key={valeur.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="rounded-3xl border border-white/10 bg-background/5 p-5 text-white"
            >
              <p className="text-lg font-semibold">{valeur.title}</p>
              <p className="mt-2 text-sm text-white/70">{valeur.description}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

