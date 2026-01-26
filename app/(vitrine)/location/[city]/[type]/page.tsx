import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { getProperties, getActiveCities } from "@/services/propertyService";
import { getSimilarListings } from "@/services/gatewayService";
import { slugify, unslugify } from "@/lib/slugs";
import ProgrammaticPageTemplate from "@/components/seo/ProgrammaticPageTemplate";

// ISR: Update every hour
export const revalidate = 3600;
// Allow new pages to be generated on demand
export const dynamicParams = true;

interface PageProps {
    params: Promise<{
        city: string;
        type: string;
    }>;
}

const capitalize = (text: string) =>
    text.charAt(0).toUpperCase() + text.slice(1);

// 1. Generate Static Params (Rentals ONLY)
export async function generateStaticParams() {
    const { data: combinations, error } = await supabase
        .rpc('get_active_cities_and_types', { min_count: 1, target_transaction_type: 'location' });

    if (error || !combinations) return [];

    return combinations.map((item: { city: string; type: string }) => ({
        city: slugify(item.city),
        type: slugify(item.type),
    }));
}

// 2. Metadata Generator
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { city, type } = await params;
    const displayCity = capitalize(unslugify(city));
    const displayType = capitalize(unslugify(type));

    return {
        title: `Location ${displayType} à ${displayCity} : Les meilleures offres 2026`,
        description: `Consultez nos annonces de ${displayType}s à louer sur ${displayCity}. Visites virtuelles, prix vérifiés et gestion professionnelle avec Doussel Immo.`,
    };
}

// 3. Page Component
export default async function RentalPage({ params }: PageProps) {
    const { city, type } = await params;
    const searchCity = unslugify(city);
    const searchType = unslugify(type);

    const properties = await getProperties({
        citySlug: city,
        type: searchType,
        category: 'location', // Strict Filter
        status: "disponible",
        limit: 50,
    });

    const displayCity = capitalize(searchCity);
    const displayType = capitalize(searchType);

    // Determines the correct city name to search for (using real DB value if possible)
    const cityName = properties.length > 0 && properties[0].location ? properties[0].location.city : displayCity;

    const similarProperties = await getSimilarListings({
        transactionType: 'location',
        city: cityName,
        propertyType: searchType,
        excludeIds: properties.map(p => p.id),
        limit: 6
    });

    const activeCities = await getActiveCities();

    return (
        <ProgrammaticPageTemplate
            mode="location"
            city={city}
            type={type}
            displayCity={displayCity}
            displayType={displayType}
            properties={properties}
            similarProperties={similarProperties}
            nearbyCities={activeCities}
        />
    );
}
