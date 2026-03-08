/**
 * Type-Filtered District Page — /immobilier/[city]/[district]/[type]
 *
 * ISR page for a specific property type within a city+district.
 * Tier 4 of the 4-tier SEO route structure (city → district → type → detail).
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getCachedDistrictBySlug,
  getCachedPropertiesByDistrict,
} from '@/services/districtService.cached';
import { getSimilarListings } from '@/services/gatewayService';
import { getActiveCities, getCityNameFromSlug } from '@/services/propertyService';
import ProgrammaticPageTemplate from '@/components/seo/ProgrammaticPageTemplate';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { unslugify, capitalize } from '@/lib/slugs';
import { generateCityDistrictTypeParams } from '@/lib/seo/generateStaticParams';
import { generateMetadata as generatePageMetadata } from '@/lib/seo/metadata';

export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ city: string; district: string; type: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city, district, type } = await params;
  const districtData = await getCachedDistrictBySlug(district, city);

  if (!districtData) {
    return {
      title: 'Page non trouvée',
      robots: { index: false, follow: false },
    };
  }

  const cityName = (await getCityNameFromSlug(city)) ?? capitalize(city.replace(/-/g, ' '));
  const typeLabel = capitalize(unslugify(type));
  const title = `${typeLabel} à ${districtData.name_fr}, ${cityName} | Doussel Immo`;
  const description = `Annonces de ${unslugify(type)} à ${districtData.name_fr}. Trouvez le bien idéal parmi nos ${unslugify(type)} disponibles.`;
  const keywords = [
    'immobilier',
    'senegal',
    cityName.toLowerCase(),
    districtData.name_fr.toLowerCase(),
    unslugify(type).toLowerCase(),
    'annonces',
    'proprietes',
  ];

  return generatePageMetadata({
    title,
    description,
    path: `/immobilier/${city}/${district}/${type}`,
    type: 'article',
    keywords,
  });
}

export async function generateStaticParams() {
  return await generateCityDistrictTypeParams();
}

export default async function ImmobilierDistrictTypePage({ params, searchParams }: PageProps) {
  const { city, district, type } = await params;
  const { page = '1' } = await searchParams;

  const districtData = await getCachedDistrictBySlug(district, city);
  if (!districtData) notFound();

  const currentPage = Math.max(1, parseInt(page) || 1);
  const limit = 12;
  const offset = (currentPage - 1) * limit;

  const cityName = (await getCityNameFromSlug(city)) ?? capitalize(city.replace(/-/g, ' '));
  const displayType = capitalize(unslugify(type));

  const [{ properties, total }, similarProperties, nearbyCities] = await Promise.all([
    getCachedPropertiesByDistrict(district, city, 'vente', type, limit, offset),
    getSimilarListings({
      transactionType: 'vente',
      city: cityName,
      propertyType: displayType,
      limit: 6,
    }),
    getActiveCities(),
  ]);

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Accueil', href: '/' },
          { label: 'Immobilier', href: '/recherche' },
          { label: cityName, href: `/immobilier/${city}` },
          { label: districtData.name_fr, href: `/immobilier/${city}/${district}` },
          { label: displayType },
        ]}
      />
      <ProgrammaticPageTemplate
        mode="immobilier"
        city={city}
        displayCity={`${displayType} à ${districtData.name_fr}`}
        type={type}
        displayType={displayType}
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
