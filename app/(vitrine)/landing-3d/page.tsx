"use client";

import { PricingCard } from "@/components/landing/PricingCard";
import { ComparisonTable } from "@/components/landing/ComparisonTable";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function LandingPricingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ========== HERO SECTION (Dark) ========== */}
      <section className="bg-slate-900 text-white pt-24 pb-32 px-6 text-center rounded-b-[3rem] shadow-2xl">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Quel plan Dousell est <br />
            <span className="text-amber-500">fait pour vous ?</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Que vous ayez un seul appartement ou un empire immobilier, nous avons les outils pour simplifier votre gestion.
          </p>

          <div className="pt-8">
            <Tabs defaultValue="personnel" className="w-full max-w-md mx-auto">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800 p-1 rounded-full">
                <TabsTrigger
                  value="personnel"
                  className="rounded-full data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 font-bold"
                >
                  Propriétaire
                </TabsTrigger>
                <TabsTrigger
                  value="professionnel"
                  className="rounded-full data-[state=active]:bg-white data-[state=active]:text-slate-900 font-bold"
                >
                  Agence / Pro
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </section>

      {/* ========== PRICING CARDS ========== */}
      <section className="px-6 -mt-20 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

            {/* FREE TIER */}
            <PricingCard
              title="Gratuit"
              price="0 FCFA"
              description="L'essentiel pour démarrer sereinement avec votre premier bien."
              color="#64748B" // Slate
              ctaText="Commencer Gratuitement"
              features={[
                { name: "1 Bien immobilier", included: true },
                { name: "Suivi des loyers basique", included: true },
                { name: "Rapports mensuels PDF", included: true },
                { name: "Relances automatiques", included: false },
                { name: "Contrats de bail", included: false },
              ]}
            />

            {/* PRO TIER (Popular) */}
            <PricingCard
              title="Premium"
              price="13.000 FCFA"
              isPopular={true}
              description="Automatisation complète pour les propriétaires exigeants."
              color="#F59E0B" // Amber
              ctaText="Essayer Gratuitement"
              features={[
                { name: "Jusqu'à 10 Biens", included: true },
                { name: "Relances automatiques (SMS/Email)", included: true },
                { name: "Génération de contrats de bail", included: true },
                { name: "Tableau de bord financier avancé", included: true },
                { name: "Gestion des incidents", included: true },
              ]}
            />

            {/* AGENCY TIER */}
            <PricingCard
              title="Agence"
              price="Sur Mesure"
              period=""
              description="Solutions dédiées pour les professionnels de l'immobilier."
              color="#0F172A" // Dark Blue
              ctaText="Contacter l'équipe"
              features={[
                { name: "Biens illimités", included: true },
                { name: "Marque blanche", included: true },
                { name: "Accès multi-utilisateurs", included: true },
                { name: "API & Intégrations", included: true },
                { name: "Support dédié 24/7", included: true },
              ]}
            />

          </div>
        </div>
      </section>

      {/* ========== COMPARISON TABLE ========== */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Comparatif détaillé des fonctionnalités
          </h2>
          <ComparisonTable />
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <section className="py-20 px-6 bg-slate-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Questions Fréquentes
          </h2>
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="bg-white px-6 rounded-lg border border-slate-200">
              <AccordionTrigger className="font-semibold text-lg hover:no-underline">
                Puis-je changer d'offre à tout moment ?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Oui, vous pouvez passer de l'offre Gratuite à l'offre Premium instantanément depuis votre tableau de bord. La facturation sera ajustée au prorata.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-white px-6 rounded-lg border border-slate-200">
              <AccordionTrigger className="font-semibold text-lg hover:no-underline">
                Les contrats de bail sont-ils conformes au Sénégal ?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Absolument. Nos modèles de baux sont rédigés par des juristes sénégalais et mis à jour régulièrement pour respecter la législation en vigueur.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-white px-6 rounded-lg border border-slate-200">
              <AccordionTrigger className="font-semibold text-lg hover:no-underline">
                Comment sont sécurisées mes données ?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Vos données sont chiffrées et stockées sur des serveurs sécurisés. Nous ne revendra jamais vos informations personnelles ou celles de vos locataires.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="py-24 px-6 bg-slate-900 text-white text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-4xl font-bold">
            Prêt à simplifier votre gestion ?
          </h2>
          <p className="text-xl text-slate-300">
            Rejoignez plus de 1200 propriétaires qui font confiance à Dousell.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-14 px-8 rounded-full text-lg">
              Essayer gratuitement
            </Button>
            <Button size="lg" variant="outline" className="border-slate-600 hover:bg-slate-800 text-white h-14 px-8 rounded-full text-lg">
              Parler à un expert
            </Button>
          </div>
          <p className="text-sm text-slate-500 mt-6">
            Aucune carte de crédit requise pour l'inscription.
          </p>
        </div>
      </section>

    </div>
  );
}
