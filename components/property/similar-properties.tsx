"use client";

import { motion } from "framer-motion";

import { PropertyCard } from "@/components/property/property-card";
import type { Property } from "@/types/property";

type SimilarPropertiesProps = {
  properties: Property[];
};

export const SimilarProperties = ({ properties }: SimilarPropertiesProps) => {
  if (!properties.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-white/50">
            Découvrir aussi
          </p>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Biens similaires
          </h3>
        </div>
      </div>
      <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-4 pt-2">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            className="bg-white/10"
          />
        ))}
      </div>
    </motion.section>
  );
};

