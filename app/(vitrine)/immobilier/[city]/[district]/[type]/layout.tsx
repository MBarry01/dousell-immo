/**
 * Type Layout — Injects BreadcrumbList JSON-LD structured data
 *
 * Server component layout that adds schema.org BreadcrumbList to all type pages.
 * Runs in parallel with page.tsx, so no extra DB call cost (Next.js deduplicates).
 *
 * JSON-LD is injected via dangerouslySetInnerHTML — this is a legitimate pattern
 * because the data comes from internal DB lookups (district names, city names),
 * not from user-controlled input.
 */

import { getCachedDistrictBySlug } from '@/services/districtService.cached';
import { getCityNameFromSlug } from '@/services/propertyService';
import { unslugify } from '@/lib/slugs';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ city: string; district: string; type: string }>;
}

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

export default async function DistrictTypeLayout({ children, params }: LayoutProps) {
  const { city, district, type } = await params;
  const [districtData, cityName] = await Promise.all([
    getCachedDistrictBySlug(district, city),
    getCityNameFromSlug(city),
  ]);

  if (!districtData || !cityName) return <>{children}</>;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://doussel-immo.sn';
  const displayType = capitalize(unslugify(type));

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Accueil',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Immobilier',
        item: `${siteUrl}/recherche`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: cityName,
        item: `${siteUrl}/immobilier/${city}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: districtData.name_fr,
        item: `${siteUrl}/immobilier/${city}/${district}`,
      },
      {
        '@type': 'ListItem',
        position: 5,
        name: displayType,
      },
    ],
  };

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
