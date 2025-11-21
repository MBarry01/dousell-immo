"use client";

import { motion } from "framer-motion";

import { PropertyCard } from "@/components/property/property-card";
import type { Property } from "@/types/property";

type NewPropertiesProps = {
  properties: Property[];
};

export const NewProperties = ({ properties }: NewPropertiesProps) => {
  if (!properties.length) {
    return null;
  }

  return (
    <section className="mt-8 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Nouveautés
          </p>
          <h2 className="text-3xl font-semibold text-white">
            Sélection fraîchement ajoutée
          </h2>
        </div>
        <button
          type="button"
          className="text-sm font-semibold text-white/70 underline-offset-4 hover:text-white hover:underline"
        >
          Tout afficher
        </button>
      </div>
      {/* Mobile: Scroll horizontal */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        className="scrollbar-hide flex snap-x gap-4 overflow-x-auto pb-4 pt-2 sm:hidden"
      >
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </motion.div>
      
      {/* Desktop: Grid responsive */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        className="hidden grid-cols-1 gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [&>*]:w-full"
      >
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </motion.div>
    </section>
  );
};







