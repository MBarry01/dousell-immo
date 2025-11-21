"use client";

import { motion } from "framer-motion";
import { Train, School, ShoppingBag } from "lucide-react";

import type { Property } from "@/types/property";

const iconMap = {
  transports: Train,
  ecoles: School,
  commerces: ShoppingBag,
};

type ProximitiesSectionProps = {
  proximites: NonNullable<Property["proximites"]>;
};

export const ProximitiesSection = ({
  proximites,
}: ProximitiesSectionProps) => {
  const entries = Object.entries(proximites) as [
    keyof typeof iconMap,
    string[],
  ][];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-6 dark:border-white/10 dark:bg-white/5"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-white/50">
          À proximité
        </p>
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Tout est accessible en quelques minutes
        </h3>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {entries.map(([category, items]) => {
          const Icon = iconMap[category];
          return (
            <div
              key={category}
              className="rounded-2xl bg-white p-4 text-gray-700 shadow-sm dark:bg-black/30 dark:text-white/80"
            >
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <Icon className="h-4 w-4" />
                {category === "transports"
                  ? "Transports"
                  : category === "ecoles"
                    ? "Écoles"
                    : "Commerces"}
              </div>
              <ul className="space-y-2 text-sm">
                {items.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500 dark:border-white/10 dark:text-white/70"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
};

