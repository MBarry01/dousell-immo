import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { getProperties, getActiveCities } from "@/services/propertyService";
import { getSimilarListings } from "@/services/gatewayService";
import { slugify, unslugify } from "@/lib/slugs";
import ProgrammaticPageTemplate from "@/components/seo/ProgrammaticPageTemplate";

// ISR: Update every hour
export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
    params: Promise<{
        city: string;
    }>;
}

const capitalize = (text: string) =>
    text.charAt(0).toUpperCase() + text.slice(1);

// 1. Generate Static Params (Rentals ONLY)
export async function generateStaticParams() {
    const { data: combinations, error } = await supabase
        .rpc('get_active_cities_and_types', { min_count: 1, target_transaction_type: 'location' });

    if (error || !combinations) return [];

    const uniqueCities = new Set(combinations.map((c: any) => slugify(c.city)));
    return Array.from(uniqueCities).map((city) => ({
        city: city,
    }));
}

// 2. Metadata Generator
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { city } = await params;
    const displayCity = capitalize(unslugify(city));

    return {
        title: `Immobilier à louer à ${displayCity} : Toutes les annonces`,
        description: `Découvrez toutes les locations disponibles à ${displayCity}. Appartements, villas, studios vérifiés par Doussel Immo.`,
    };
}

// 3. Page Component
export default async function RentalCityPage({ params }: PageProps) {
    const { city } = await params;
    const searchCity = unslugify(city);

    const properties = await getProperties({
        citySlug: city,
        category: 'location', // Strict Filter
        status: "disponible",
        limit: 50,
    });

    const displayCity = capitalize(searchCity);

    // Determines the correct city name to search for (using real DB value if possible)
    const cityName = properties.length > 0 ? properties[0].location.city : displayCity;

    const similarProperties = await getSimilarListings({
        transactionType: 'location',
        city: cityName,
        excludeIds: properties.map(p => p.id),
        limit: 6
    });

    const activeCities = await getActiveCities();

    return (
        <ProgrammaticPageTemplate
            mode="location"
            city={city}
            displayCity={displayCity}
            properties={properties}
            similarProperties={similarProperties}
            nearbyCities={activeCities}
        />
    );
}
