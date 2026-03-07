/**
 * District Layout — Injects BreadcrumbList JSON-LD structured data
 *
 * Server component layout that adds schema.org BreadcrumbList to all district pages.
 * Runs in parallel with page.tsx, so no extra DB call cost (Next.js deduplicates).
 *
 * JSON-LD is injected via dangerouslySetInnerHTML — this is a legitimate pattern
 * because the data comes from internal DB lookups (district names, city names),
 * not from user-controlled input.
 */

import { getCachedDistrictBySlug } from '@/services/districtService.cached';
import { getCityNameFromSlug } from '@/services/propertyService';
import { capitalize } from '@/lib/slugs';
import { buildBreadcrumbSchema } from '@/lib/seo/schemaBuilders';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ city: string; district: string }>;
}

export default async function DistrictLayout({ children, params }: LayoutProps) {
  const { city, district } = await params;
  const [districtData, cityName] = await Promise.all([
    getCachedDistrictBySlug(district, city),
    getCityNameFromSlug(city),
  ]);

  if (!districtData || !cityName) return <>{children}</>;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://doussel-immo.sn';

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Accueil', url: siteUrl },
    { name: 'Immobilier', url: `${siteUrl}/recherche` },
    { name: cityName, url: `${siteUrl}/immobilier/${city}` },
    { name: districtData.name_fr }, // Current page, no URL
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
