/**
 * District Overview Page — /immobilier/[city]/[district]
 *
 * ISR page showing all property types for a city+district combination.
 * Tier 3 of the 4-tier SEO route structure (city → district → type → detail).
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getCachedDistrictBySlug,
  getCachedPropertiesByDistrict,
} from '@/services/districtService.cached';
import { getSimilarListings, getUnifiedListings } from '@/services/gatewayService';
import { getActiveCities, getCityNameFromSlug } from '@/services/propertyService';
import { trackPageView } from '@/lib/analytics/seoTracking';
import ProgrammaticPageTemplate from '@/components/seo/ProgrammaticPageTemplate';

import { capitalize } from '@/lib/slugs';
import { generateCityDistrictParams } from '@/lib/seo/generateStaticParams';
import { generateMetadata as generatePageMetadata } from '@/lib/seo/metadata';

export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ city: string; district: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city, district } = await params;

  const validCategories = ["appartement", "villa", "studio", "terrain", "commerce", "immeuble"];
  const isCategory = validCategories.includes(district.toLowerCase());

  const districtData = await getCachedDistrictBySlug(district, city);

  if (!districtData && !isCategory) {
    return {
      title: 'Page non trouvée',
      robots: { index: false, follow: false },
    };
  }

  const cityName = (await getCityNameFromSlug(city)) ?? capitalize(city.replace(/-/g, ' '));

  let title = "";
  let description = "";
  let keywords: string[] = [];

  if (isCategory) {
    const categoryName = capitalize(district);
    title = `${categoryName} à ${cityName} | Ventes et Locations | Doussel Immo`;
    description = `Trouvez les meilleures annonces pour : ${categoryName.toLowerCase()} à ${cityName}. Des biens vérifiés pour l'achat ou la location au Sénégal.`;
    keywords = [
      'immobilier',
      'senegal',
      cityName.toLowerCase(),
      categoryName.toLowerCase(),
      'annonces',
      'proprietes',
      'vente',
      'location',
    ];
  } else if (districtData) {
    title = `Immobilier à ${districtData.name_fr}, ${cityName} | Doussel Immo`;
    description = `Trouvez les meilleures annonces immobilières à ${districtData.name_fr}. ${districtData.description || 'Appartements, villas, terrains en vente et location.'}`;
    keywords = [
      'immobilier',
      'senegal',
      cityName.toLowerCase(),
      districtData.name_fr.toLowerCase(),
      'annonces',
      'proprietes',
      'vente',
      'location',
    ];
  }

  return generatePageMetadata({
    title,
    description,
    path: `/immobilier/${city}/${district}`,
    type: 'website',
    keywords,
  });
}

export async function generateStaticParams() {
  return await generateCityDistrictParams();
}

export default async function ImmobilierDistrictPage({ params, searchParams }: PageProps) {
  const { city, district } = await params;
  const { page = '1' } = await searchParams;

  // Verify if the 'district' is actually a property category
  const validCategories = ["appartement", "villa", "studio", "terrain", "commerce", "immeuble"];
  const isCategory = validCategories.includes(district.toLowerCase());

  // Track page view for analytics
  await trackPageView({
    city,
    district: isCategory ? undefined : district,
    type: isCategory ? district : undefined,
    url: `/immobilier/${city}/${district}`,
  });

  const currentPage = Math.max(1, parseInt(page as string) || 1);
  const limit = 12;
  const offset = (currentPage - 1) * limit;

  const cityName = (await getCityNameFromSlug(city)) ?? capitalize(city.replace(/-/g, ' '));

  let properties: any[] = [];
  let total = 0;
  let displayTitle = "";

  const districtData = await getCachedDistrictBySlug(district, city);

  if (isCategory) {
    // If it's a category, fetch unified listings for this city and category
    const resUnified = await getUnifiedListings({
      citySlug: city,
      status: "disponible",
      type: district, // e.g. 'appartement'
      page: currentPage,
      limit: limit,
    });
    properties = resUnified?.listings || [];
    total = resUnified?.total || 0;
    displayTitle = capitalize(district);
  } else if (districtData) {
    // If it's a valid district
    const districtRes = await getCachedPropertiesByDistrict(district, city, undefined, undefined, limit, offset);
    properties = districtRes.properties || [];
    total = districtRes.total || 0;
    displayTitle = districtData.name_fr;
  } else {
    // Neither a valid category nor a valid district
    notFound();
  }

  const [similarProperties, nearbyCities] = await Promise.all([
    getSimilarListings({
      transactionType: 'vente',
      city: cityName,
      propertyType: isCategory ? district : undefined,
      limit: 6,
    }),
    getActiveCities(),
  ]);

  return (
    <>

      <ProgrammaticPageTemplate
        mode="immobilier"
        city={city}
        displayCity={displayTitle}
        properties={properties || []}
        totalCount={total || 0}
        currentPage={currentPage}
        limit={limit}
        similarProperties={similarProperties || []}
        nearbyCities={nearbyCities || []}
      />
    </>
  );
}
