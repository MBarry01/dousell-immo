"use client";

import { useState } from "react";
import {
  Bath,
  Bed,
  Home,
  MapPin,
  Info,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";

import { AgentCard } from "@/components/property/agent-card";
import { CostSimulator } from "@/components/property/cost-simulator";
import { ProximitiesSection } from "@/components/property/proximities-section";
import { SimilarProperties } from "@/components/property/similar-properties";
import { StaticMap } from "@/components/property/static-map";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import type { Property } from "@/types/property";

type PropertyInfoProps = {
  property: Property;
  similar: Property[];
};

const specCards = [
  {
    label: "Surface",
    icon: Home,
    value: (property: Property) => `${property.specs.surface} m²`,
  },
  {
    label: "Pièces",
    icon: Bed,
    value: (property: Property) => `${property.specs.rooms} pièces`,
  },
  {
    label: "Salles d'eau",
    icon: Bath,
    value: (property: Property) => `${property.specs.bathrooms} sdb`,
  },
];

export const PropertyInfo = ({ property, similar }: PropertyInfoProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.section
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" as const }}
      className="relative z-10 -mt-6 rounded-t-[32px] bg-white px-6 pb-28 pt-8 text-gray-900 shadow-2xl dark:bg-[#080b11] dark:text-white"
    >
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold leading-tight lg:text-4xl">
              {property.title}
            </h1>
            <span className="rounded-full bg-emerald-500/15 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-500">
              Disponible
            </span>
          </div>
          <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/70">
            <MapPin className="h-4 w-4" />
            {property.location.address}
          </p>
          <p className="text-sm text-gray-400 dark:text-white/60">
            {property.location.landmark}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl bg-gray-50 p-6 dark:bg-white/5">
          <p className="text-sm uppercase tracking-[0.4em] text-gray-400 dark:text-white/40">
            Prix
          </p>
          <p className="text-4xl font-extrabold text-amber-500">
            {formatCurrency(property.price)}
          </p>
        </div>

        <CostSimulator price={property.price} type={property.transaction} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {specCards.map(({ label, icon: Icon, value }) => (
            <div
              key={label}
              className="rounded-2xl bg-gray-50 p-4 text-center shadow-sm dark:bg-white/5"
            >
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 dark:bg-white/10 dark:text-white">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {value(property)}
              </p>
              <p className="text-sm text-gray-500 dark:text-white/60">{label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-gray-400 dark:text-white/40">
            <Info className="h-4 w-4" /> Description
          </div>
          <p
            className={cn(
              "text-base leading-relaxed text-gray-600 dark:text-white/70",
              !expanded && "line-clamp-3"
            )}
          >
            {property.description}
          </p>
          <Button
            variant="ghost"
            className="px-0 text-sm text-amber-500 hover:text-amber-400"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? "Réduire" : "Lire plus"}
          </Button>
        </div>

        <div className="rounded-2xl border border-gray-100 p-4 dark:border-white/10 dark:bg-white/5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Détails techniques
          </h3>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              ["Type", property.details.type],
              ["Année", property.details.year],
              ["Chauffage", property.details.heating],
              ["Charges", property.details.charges && formatCurrency(property.details.charges)],
              [
                "Taxe foncière",
                property.details.taxeFonciere &&
                formatCurrency(property.details.taxeFonciere),
              ],
              ["Parking", property.details.parking ?? "—"],
            ]
              .filter(([, value]) => Boolean(value))
              .map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-col rounded-xl bg-gray-50 p-3 dark:bg-white/5"
                >
                  <dt className="text-xs uppercase tracking-widest text-gray-400">
                    {label}
                  </dt>
                  <dd className="text-sm font-semibold text-gray-900 dark:text-white">
                    {value}
                  </dd>
                </div>
              ))}
          </dl>
        </div>

        {property.proximites && (
          <ProximitiesSection proximites={property.proximites} />
        )}

        <StaticMap
          city={property.location.city}
          coords={property.location.coords}
          address={property.location.address}
          landmark={property.location.landmark}
        />

        <AgentCard
          agent={property.agent}
          property={property}
          propertyId={property.id}
          propertyTitle={property.title}
        />

        {similar.length > 0 && <SimilarProperties properties={similar} />}

        {(property.details.hasBackupGenerator ||
          property.details.hasWaterTank ||
          property.details.security) && (
            <div className="flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white">
              {property.details.hasBackupGenerator && (
                <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1 text-xs">
                  ⚡ Groupe électrogène
                </span>
              )}
              {property.details.hasWaterTank && (
                <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1 text-xs">
                  💧 Réservoir / Surpresseur
                </span>
              )}
              {property.details.security && (
                <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1 text-xs">
                  🛡 Gardiennage 24/7
                </span>
              )}
            </div>
          )}

        <div className="flex items-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5" />
          Visites privées disponibles sous 24h avec conciergerie dédiée.
        </div>
      </div>
    </motion.section>
  );
};

