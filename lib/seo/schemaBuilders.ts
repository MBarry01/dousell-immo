/**
 * Schema.org JSON-LD Builders
 *
 * Pure functions that generate schema.org JSON-LD objects.
 * These are deterministic, testable builders with no I/O.
 *
 * Suitable for injection via dangerouslySetInnerHTML in server components.
 */

import { FaqItem } from './faqItems';

// ============================================================================
// BreadcrumbList Schema
// ============================================================================

export interface BreadcrumbItem {
  name: string;
  url?: string; // Omit for the last item (current page)
}

/**
 * Build BreadcrumbList schema.org JSON-LD object.
 *
 * The last item in the list should have no `url` field (current page).
 *
 * @param items - Array of breadcrumb items, last item is current page
 * @returns BreadcrumbList schema object
 */
export function buildBreadcrumbSchema(items: BreadcrumbItem[]): Record<string, unknown> {
  const itemListElement = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    ...(item.url && { item: item.url }),
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}

// ============================================================================
// AggregateOffer Schema
// ============================================================================

export interface PropertyForSchema {
  prix?: number; // Price in centimes (XOF)
  type?: string;
}

/**
 * Build AggregateOffer schema.org JSON-LD object for properties in a district.
 *
 * Summarizes price range and offering information for a collection of properties.
 * Useful for SEO when displaying multiple listings (e.g., "Apartments in Plateau from 50M XOF").
 *
 * @param properties - Array of properties with prix and type
 * @param city - City name (e.g., "Dakar")
 * @param district - District name (e.g., "Plateau")
 * @returns AggregateOffer schema object
 */
export function buildAggregateOfferSchema(
  properties: PropertyForSchema[],
  city: string,
  district: string
): Record<string, unknown> {
  const validPrices = properties
    .map((p) => p.prix)
    .filter((prix): prix is number => typeof prix === 'number' && prix > 0);

  if (validPrices.length === 0) {
    // No valid price data, return minimal schema
    return {
      '@context': 'https://schema.org',
      '@type': 'AggregateOffer',
      priceCurrency: 'XOF',
      offerCount: properties.length,
      availability: 'https://schema.org/InStock',
      areaServed: `${district}, ${city}`,
    };
  }

  const minPrice = Math.min(...(validPrices as number[]));
  const maxPrice = Math.max(...(validPrices as number[]));
  const avgPrice = Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length);

  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateOffer',
    priceCurrency: 'XOF',
    lowPrice: (minPrice / 100).toLocaleString('fr-FR'),
    highPrice: (maxPrice / 100).toLocaleString('fr-FR'),
    price: (avgPrice / 100).toLocaleString('fr-FR'),
    offerCount: properties.length,
    availability: 'https://schema.org/InStock',
    areaServed: `${district}, ${city}`,
  };
}

// ============================================================================
// FAQPage Schema
// ============================================================================

/**
 * Build FAQPage schema.org JSON-LD object.
 *
 * Structures FAQ questions and answers for rich snippet display in search results.
 * Each item becomes a separate "People also ask" candidate.
 *
 * @param items - Array of FAQ items with question and answer
 * @returns FAQPage schema object
 */
export function buildFaqSchema(items: FaqItem[]): Record<string, unknown> {
  const mainEntity = items.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  };
}
