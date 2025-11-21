"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type StaggerListProps = {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
};

/**
 * Composant pour afficher des listes avec animation en cascade
 * Standard iOS/Android pour les grilles de résultats
 */
export function StaggerList({
  children,
  className,
  staggerDelay = 0.1,
}: StaggerListProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Variante pour les items individuels du StaggerList
 */
export const staggerListItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
};

/**
 * Composant wrapper pour un item de liste avec animation stagger
 */
export function StaggerListItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={staggerListItem}
      className={className}
    >
      {children}
    </motion.div>
  );
}

