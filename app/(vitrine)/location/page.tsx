import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { slugify, unslugify } from "@/lib/slugs";
import { getCityImage } from "@/lib/cityImages";


// ISR policy
export const revalidate = 3600;

const capitalize = (text: string) =>
    text.charAt(0).toUpperCase() + text.slice(1);

export const metadata: Metadata = {
    title: "Nos zones d'intervention - Immobilier Sénégal",
    description: "Découvrez toutes les villes où Doussel Immo est présent. Locations d'appartements, villas et studios au Sénégal.",
};

export default async function LocationRootPage() {
    // Récupérer toutes les villes actives via notre RPC (Uniquement LOCATION)
    const { data: combinations } = await supabase
        .rpc('get_active_cities_and_types', { min_count: 1, target_transaction_type: 'location' });

    const citiesMap = new Map<string, number>();

    if (combinations) {
        combinations.forEach((item: { city: string; count: number }) => {
            const citySlug = slugify(item.city);
            const currentCount = citiesMap.get(citySlug) || 0;
            citiesMap.set(citySlug, currentCount + Number(item.count));
        });
    }

    const cities = Array.from(citiesMap.entries())
        .map(([slug, count]) => ({
            slug,
            name: capitalize(unslugify(slug)),
            count
        }))
        .sort((a, b) => b.count - a.count);

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="bg-muted/30 border-b">
                <div className="container mx-auto px-4 py-10">

                    <h1 className="text-3xl md:text-5xl font-display font-bold mb-4">
                        Nos zones d&apos;intervention
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        Retrouvez toutes nos annonces de location par ville.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                {cities.length > 0 ? (
                    /* GRILLE DE CARTES POSTALES (Flex centered) pour Location */
                    <div className="flex flex-wrap justify-center gap-6">
                        {cities.map((city) => {
                            const imageUrl = getCityImage(city.name); // Using city name for mapping

                            return (
                                <Link
                                    key={city.slug}
                                    href={`/location/${city.slug}`}
                                    className="group relative h-72 w-full sm:w-80 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block"
                                >
                                    {/* 1. L'Image de fond */}
                                    <Image
                                        src={imageUrl}
                                        alt={`Location à ${city.name}`}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                    />

                                    {/* 2. L'Overlay sombre */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                                    {/* 3. Le Contenu Texte */}
                                    <div className="absolute bottom-0 left-0 p-6 w-full">
                                        <h3 className="text-2xl font-bold text-white capitalize mb-1">
                                            {city.name}
                                        </h3>
                                        <div className="flex items-center text-white/90 text-sm font-medium gap-2 group/btn">
                                            <span>{city.count} annonce{city.count > 1 ? 's' : ''}</span>
                                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <h3 className="text-xl font-medium mb-4">Chargement des secteurs...</h3>
                        <Button asChild>
                            <Link href="/recherche">Voir toutes les annonces</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
