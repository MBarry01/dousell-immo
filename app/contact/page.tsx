"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const MapView = dynamic(
  () => import("@/components/search/map-view").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[70vh] items-center justify-center rounded-[32px] border border-white/10 bg-white/5 text-white/70">
        Chargement de la carte…
      </div>
    ),
  }
);

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Property } from "@/types/property";

const officeProperty: Property = {
  id: "office-dousell",
  title: "Bureau Dousell Immo",
  price: 0,
  transaction: "location",
  location: {
    city: "Dakar",
    address: "Sacré-Cœur 3, VDN",
    landmark: "Face au rond-point Sacré-Cœur",
    coords: { lat: 14.7083, lng: -17.4658 },
  },
  images: [
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80",
  ],
  specs: {
    surface: 0,
    rooms: 0,
    bedrooms: 0,
    bathrooms: 0,
    dpe: "B",
  },
  details: {
    type: "Appartement",
    year: 2020,
    heating: "Climatisation",
    charges: 0,
    taxeFonciere: 0,
    parking: "Parking visiteurs",
    hasBackupGenerator: true,
    hasWaterTank: true,
    security: true,
  },
  description: "",
  disponibilite: "",
  agent: {
    name: "Équipe Dousell",
    photo:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
    phone: "+221338600000",
  },
  proximites: {
    transports: [],
    ecoles: [],
    commerces: [],
  },
};

const faq = [
  {
    question: "Quels documents fournir pour louer ?",
    answer:
      "Pièce d'identité, 3 derniers bulletins de salaire ou attestations de revenus, et garant si nécessaire.",
  },
  {
    question: "Faites-vous de la gestion locative ?",
    answer:
      "Oui, nous gérons vos biens de A à Z : mise en location, perception loyers, suivi technique.",
  },
  {
    question: "Accompagnez-vous les expatriés ?",
    answer:
      "Bien sûr, nous offrons un service conciergerie pour les expatriés (visites vidéo, signature à distance).",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export default function ContactPage() {
  return (
    <div className="space-y-10 py-10">
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.5 }}
        className="grid gap-8 rounded-[36px] border border-white/10 bg-white/5 p-6 text-white md:grid-cols-2"
      >
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Contact
          </p>
          <h1 className="text-4xl font-semibold">
            Parlez directement à un expert terrain
          </h1>
          <p className="text-white/70">
            Pour un partenariat, une estimation multi-biens ou des questions sur
            notre gestion locative, contactez le siège Dousell Immo.
          </p>
          <div className="space-y-3 text-sm text-white/80">
            <div>
              <p className="text-white/40">Adresse</p>
              <p>Sacré-Cœur 3, VDN, Dakar</p>
            </div>
            <div>
              <p className="text-white/40">Téléphone</p>
              <p>+221 33 860 00 00</p>
            </div>
            <div>
              <p className="text-white/40">Email</p>
              <p>contact@dousell.immo</p>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-[28px] border border-white/10">
          <MapView properties={[officeProperty]} showCarousel={false} />
        </div>
      </motion.section>

      <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 text-white">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">
          FAQ
        </p>
        <h2 className="mt-2 text-3xl font-semibold">Questions fréquentes</h2>
        <Accordion type="single" collapsible className="mt-4">
          {faq.map((item) => (
            <AccordionItem value={item.question} key={item.question}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}

