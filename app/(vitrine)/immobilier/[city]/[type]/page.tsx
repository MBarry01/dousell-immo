import { Metadata } from "next";
import { getUnifiedListings, getSimilarListings } from "@/services/gatewayService";
import { getActiveCities, getCityNameFromSlug } from "@/services/propertyService";
import { slugify, unslugify } from "@/lib/slugs";
import ProgrammaticPageTemplate from "@/components/seo/ProgrammaticPageTemplate";
import { supabase } from "@/lib/supabase";

// ISR: Met à jour toutes les heures
export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
    params: Promise<{
        city: string;
        type: string;
    }>;
    searchParams: Promise<{
        page?: string;
    }>;
}

const capitalize = (text: string) =>
    text.charAt(0).toUpperCase() + text.slice(1);

// 1. Génération des métadonnées dynamiques (Longue traîne)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { city, type } = await params;
    const resolvedCity = await getCityNameFromSlug(city);
    const displayCity = resolvedCity || capitalize(unslugify(city));
    const displayType = capitalize(unslugify(type));

    return {
        title: `${displayType} à vendre ou à louer à ${displayCity} | Dousel Immo`,
        description: `Trouvez votre ${displayType.toLowerCase()} à ${displayCity}. Annonces vérifiées, photos HD et accompagnement pour la diaspora sénégalaise.`,
    };
}

// 2. Composant Page
export default async function ImmobilierTypeCityPage({ params, searchParams }: PageProps) {
    const { city, type } = await params;
    const resolvedCity = await getCityNameFromSlug(city);
    const displayCity = resolvedCity || capitalize(unslugify(city));
    const displayType = capitalize(unslugify(type));

    const res = await searchParams;
    const currentPage = Number(res.page) || 1;
    const limit = 12;

    // Récupération des biens filtrés par type
    const resUnified = await getUnifiedListings({
        citySlug: city,
        type: displayType as any,
        status: "disponible",
        page: currentPage,
        limit: limit,
    });

    const properties = resUnified?.listings || [];
    const total = resUnified?.total || 0;

    const similarProperties = await getSimilarListings({
        transactionType: "vente",
        city: displayCity,
        propertyType: displayType,
        limit: 6,
        excludeIds: properties.slice(0, 10).map(p => p.id)
    });

    const activeCities = await getActiveCities();

    return (
        <ProgrammaticPageTemplate
            mode="immobilier"
            city={city}
            displayCity={displayCity}
            type={type}
            displayType={displayType}
            properties={properties}
            totalCount={total}
            currentPage={currentPage}
            limit={limit}
            similarProperties={similarProperties}
            nearbyCities={activeCities}
        />
    );
}

// 3. Paramètres statiques pour toutes les combinaisons actives
export async function generateStaticParams() {
    const { data: combinations, error } = await supabase
        .rpc('get_active_cities_and_types', { min_count: 1 });

    if (error || !combinations) return [];

    return combinations.map((c: any) => ({
        city: slugify(c.city),
        type: slugify(c.type),
    }));
}
