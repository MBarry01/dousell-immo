/**
 * FAQ Items Generator
 *
 * Produces FAQ question/answer pairs for both UI rendering and JSON-LD schema.
 * Extracted from ProgrammaticSectionFAQ to be a shared source of truth.
 *
 * Why extracted here:
 * - Both the client-side accordion UI and server-side JSON-LD schemas need identical questions
 * - A single source of truth prevents drift between the visible FAQ and the schema
 * - Pure function (no I/O, no React) enables deterministic unit tests via npx tsx
 */

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Generate FAQ items for a city/property context.
 *
 * The `answer` field contains plain text only — safe to inject into JSON-LD.
 * The caller (ProgrammaticSectionFAQ) may enrich the UI display with HTML
 * pricingBreakdown separately via dangerouslySetInnerHTML.
 *
 * @param city             - Display name of city or district (e.g. "Plateau", "Dakar")
 * @param pricingBreakdown - Optional HTML string with per-room averages (signals caveat)
 * @param globalAverage    - Average property price in centimes (XOF)
 */
export function buildFaqItems(
  city: string,
  pricingBreakdown: string | null,
  globalAverage: number
): FaqItem[] {
  const priceFormatted = (globalAverage / 100).toLocaleString('fr-FR');

  return [
    {
      question: `Quel est le prix moyen d'un bien à ${city}?`,
      answer: `Le prix moyen actuellement est ${priceFormatted} XOF.${
        pricingBreakdown
          ? ' Les prix varient selon le type de bien et le quartier.'
          : ''
      }`,
    },
    {
      question: `Comment acheter un bien à ${city} sur Doussel Immo?`,
      answer:
        'Parcourez nos annonces sur Doussel Immo, contactez directement les agents immobiliers, et finalisez votre achat via leur assistance.',
    },
    {
      question: `Quelle est la meilleure période pour acheter à ${city}?`,
      answer:
        "Le marché immobilier sénégalais est actif toute l'année. Nous vous recommandons de consulter régulièrement nos annonces pour trouver la meilleure opportunité.",
    },
  ];
}
