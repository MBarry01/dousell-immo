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
import { getSimilarListings } from '@/services/gatewayService';
import { getActiveCities, getCityNameFromSlug } from '@/services/propertyService';
import ProgrammaticPageTemplate from '@/components/seo/ProgrammaticPageTemplate';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { capitalize } from '@/lib/slugs';

export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ city: string; district: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city, district } = await params;
  const districtData = await getCachedDistrictBySlug(district, city);

  if (!districtData) {
    return {
      title: 'Page non trouvée',
      robots: { index: false, follow: false },
    };
  }

  const cityName = (await getCityNameFromSlug(city)) ?? capitalize(city.replace(/-/g, ' '));
  const title = `Immobilier à ${districtData.name_fr}, ${cityName} | Doussel Immo`;
  const description = `Trouvez les meilleures annonces immobilières à ${districtData.name_fr}. ${
    districtData.description || 'Appartements, villas, terrains en vente et location.'
  }`;

  return {
    title,
    description,
    alternates: { canonical: `/immobilier/${city}/${district}` },
    robots: { index: true, follow: true },
  };
}

export async function generateStaticParams() {
  // Task 5 will populate this from RPC results
  return [];
}

export default async function ImmobilierDistrictPage({ params, searchParams }: PageProps) {
  const { city, district } = await params;
  const { page = '1' } = await searchParams;

  const districtData = await getCachedDistrictBySlug(district, city);
  if (!districtData) notFound();

  const currentPage = Math.max(1, parseInt(page as string) || 1);
  const limit = 12;
  const offset = (currentPage - 1) * limit;

  const cityName = (await getCityNameFromSlug(city)) ?? capitalize(city.replace(/-/g, ' '));

  const [{ properties, total }, similarProperties, nearbyCities] = await Promise.all([
    getCachedPropertiesByDistrict(district, city, undefined, undefined, limit, offset),
    getSimilarListings({
      transactionType: 'vente',
      city: cityName,
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
          { label: districtData.name_fr },
        ]}
      />
      <ProgrammaticPageTemplate
        mode="immobilier"
        city={city}
        displayCity={districtData.name_fr}
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
