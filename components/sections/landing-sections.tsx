"use client";

import { HeroPremium } from "./hero-premium";
import { MetricsSection } from "./metrics-section";
import { FeatureGrid } from "@/components/ui/feature-grid";
import { TestimonialMasonry } from "@/components/ui/testimonial-masonry";
import { CTASection } from "@/components/ui/cta-section";
import { FAQAccordion } from "@/components/ui/faq-accordion";

import {
  heroData,
  metricsData,
  featuresData,
  testimonialsData,
  ctaData,
  faqData,
} from "@/data/landing-data";

/**
 * Composant client regroupant toutes les sections de landing page animées
 * Inspiré de saasable-ui - Adapté au Design System "Luxe & Teranga"
 */
export const LandingSections = () => {
  return (
    <>
      {/* Hero Premium avec parallax */}
      <HeroPremium {...heroData} />

      {/* Métriques avec compteurs animés */}
      <MetricsSection {...metricsData} />

      {/* Grille de features */}
      <FeatureGrid {...featuresData} />

      {/* Témoignages en masonry */}
      <TestimonialMasonry {...testimonialsData} />

      {/* Call-to-Action */}
      <CTASection {...ctaData} />

      {/* FAQ */}
      <FAQAccordion {...faqData} />
    </>
  );
};

/**
 * Version allégée avec seulement Hero + Metrics + CTA
 * Pour les pages qui ont déjà du contenu dynamique
 */
export const LandingHeroSection = () => {
  return (
    <>
      <HeroPremium {...heroData} />
      <MetricsSection {...metricsData} />
    </>
  );
};

/**
 * Section de confiance (Features + Testimonials + FAQ)
 * À placer après les listes de propriétés
 */
export const TrustSections = () => {
  return (
    <>
      <FeatureGrid {...featuresData} />
      <TestimonialMasonry {...testimonialsData} />
      <CTASection {...ctaData} />
      <FAQAccordion {...faqData} />
    </>
  );
};
