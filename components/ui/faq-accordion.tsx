"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  /**
   * Question
   */
  question: string;
  /**
   * Réponse
   */
  answer: string;
}

interface FAQAccordionProps {
  /**
   * Titre de la section
   */
  heading?: string;
  /**
   * Sous-titre de la section
   */
  caption?: string;
  /**
   * Liste des questions/réponses
   */
  items: FAQItem[];
  /**
   * Classes CSS additionnelles
   */
  className?: string;
}

/**
 * Section FAQ avec accordéon animé
 * Inspiré de saasable-ui/Faq6
 *
 * @example
 * ```tsx
 * <FAQAccordion
 *   heading="Questions fréquentes"
 *   items={[
 *     { question: "Comment acheter ?", answer: "..." },
 *   ]}
 * />
 * ```
 */
export const FAQAccordion = ({
  heading,
  caption,
  items,
  className = "",
}: FAQAccordionProps) => {
  return (
    <section className={`py-16 md:py-24 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          {(heading || caption) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-10 text-center"
            >
              {heading && (
                <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                  {heading}
                </h2>
              )}
              {caption && (
                <p className="text-lg text-white/60">{caption}</p>
              )}
            </motion.div>
          )}

          {/* Accordion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Accordion type="single" collapsible className="space-y-3">
              {items.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.4,
                    delay: 0.1 * index,
                  }}
                >
                  <AccordionItem
                    value={`item-${index}`}
                    className="overflow-hidden rounded-xl border border-white/10 bg-white/5 px-5 backdrop-blur-sm data-[state=open]:border-[#F4C430]/20 data-[state=open]:bg-white/[0.07]"
                  >
                    <AccordionTrigger className="py-5 text-left text-base font-medium text-white hover:no-underline [&[data-state=open]>svg]:text-[#F4C430] [&>svg]:text-white/50">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-white/60">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
