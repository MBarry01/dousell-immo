import { Metadata } from "next";
import { getUnifiedListings, getSimilarListings } from "@/services/gatewayService";
import { getActiveCities, getCityNameFromSlug } from "@/services/propertyService";
import { slugify, unslugify } from "@/lib/slugs";
import ProgrammaticPageTemplate from "@/components/seo/ProgrammaticPageTemplate";
import Link from "next/link";

// ISR: Met à jour toutes les heures
export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
    params: Promise<{
        city: string;
    }>;
    searchParams: Promise<{
        page?: string;
    }>;
}

const capitalize = (text: string) =>
    text.charAt(0).toUpperCase() + text.slice(1);

// 1. Génération des métadonnées dynamiques
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { city } = await params;
    const resolvedCity = await getCityNameFromSlug(city);
    const displayCity = resolvedCity || capitalize(unslugify(city));

    return {
        title: `Immobilier à ${displayCity} : Ventes et Locations au Sénégal`,
        description: `Trouvez votre bien immobilier à ${displayCity}. Villas, appartements et terrains vérifiés pour la diaspora et les résidents. Expertise Dousel Immo.`,
    };
}

// 2. Contenu profond pour Dakar (SEO Mastery)
const DakarSEOContent = () => (
    <div className="space-y-8">
        <section>
            <h2 className="text-3xl font-bold text-white mb-4">Le Marché Immobilier à Dakar : Entre Dynamisme et Opportunité</h2>
            <p>
                Dakar, la capitale du Sénégal, s'est imposée comme l'un des hubs immobiliers les plus dynamiques d'Afrique de l'Ouest. Que vous soyez un résident local ou un membre de la diaspora vivant en France, au Canada ou aux USA, Dakar offre des perspectives d'investissement exceptionnelles. Le marché dakarois se caractérise par une demande constante, portée par une croissance démographique forte et un développement urbain soutenu.
            </p>
        </section>

        <section>
            <h3 className="text-2xl font-semibold text-[#F4C430] mb-3">Les Quartiers Prisés pour Investir</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-bold text-white mb-1">Les Almadies & Ngor</h4>
                    <p className="text-sm text-white/70">Le secteur le plus huppé. Idéal pour le luxe et les expatriés. Rendements locatifs élevés pour les villas et appartements de standing.</p>
                </div>
                <div>
                    <h4 className="font-bold text-white mb-1">Mermoz & Sacré-Cœur</h4>
                    <p className="text-sm text-white/70">Zones résidentielles centrales, très demandées par la classe moyenne supérieure et les familles.</p>
                </div>
                <div>
                    <h4 className="font-bold text-white mb-1">Le Plateau</h4>
                    <p className="text-sm text-white/70">Le centre d'affaires. Parfait pour les investissements dans l'immobilier de bureau ou les appartements de type pied-à-terre.</p>
                </div>
                <div>
                    <h4 className="font-bold text-white mb-1">Diamniadio (Pôle Urbain)</h4>
                    <p className="text-sm text-white/70">L'avenir de Dakar. Idéal pour l'acquisition de terrains et les projets neufs à fort potentiel de plus-value.</p>
                </div>
            </div>
        </section>

        <section className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h3 className="text-2xl font-semibold text-[#F4C430] mb-3">Pourquoi Investir à Dakar avec Dousel ?</h3>
            <ul className="list-disc pl-5 space-y-2 text-white/80">
                <li><strong>Sécurisation Juridique</strong> : Nous vérifions systématiquement les titres de propriété (Titre Foncier, Bail, etc.) pour éviter tout litige.</li>
                <li><strong>Accompagnement Diaspora</strong> : Un processus digitalisé permettant d'acheter ou de louer depuis l'étranger en toute sérénité.</li>
                <li><strong>Expertise Locale</strong> : Une connaissance fine des prix du marché pour vous garantir le juste prix, sans "taxe diaspora".</li>
            </ul>
        </section>

        <section>
            <h3 className="text-2xl font-semibold text-white mb-3">Prix de l'Immobilier à Dakar (Estimation 2025)</h3>
            <p>
                Les prix varient énormément selon le quartier. Aux Almadies, comptez entre 800 000 et 1 500 000 FCFA le m² pour un terrain. Dans des zones en développement comme Jaxaay ou Keur Massar, on trouve encore des opportunités abordables pour la construction de maisons individuelles.
            </p>
        </section>
    </div>
);

// 3. Composant Page
export default async function ImmobilierCityPage({ params, searchParams }: PageProps) {
    const { city } = await params;
    const resolvedCity = await getCityNameFromSlug(city);
    const displayCity = resolvedCity || capitalize(unslugify(city));

    const res = await searchParams;
    const currentPage = Number(res.page) || 1;
    const limit = 12;

    // Récupération des biens unifiés
    const resUnified = await getUnifiedListings({
        citySlug: city,
        status: "disponible",
        page: currentPage,
        limit: limit,
    });

    const properties = resUnified?.listings || [];
    const total = resUnified?.total || 0;

    const isDakar = city.toLowerCase().includes("dakar");

    const similarProperties = await getSimilarListings({
        transactionType: "vente", // Fallback similarity for global page
        city: displayCity,
        limit: 6,
        excludeIds: properties.slice(0, 10).map(p => p.id)
    });

    const activeCities = await getActiveCities();

    return (
        <ProgrammaticPageTemplate
            mode="immobilier"
            city={city}
            displayCity={displayCity}
            properties={properties}
            totalCount={total}
            currentPage={currentPage}
            limit={limit}
            similarProperties={similarProperties}
            nearbyCities={activeCities}
            seoContent={isDakar ? <DakarSEOContent /> : undefined}
        />
    );
}

export async function generateStaticParams() {
    const cities = await getActiveCities();
    return cities.map((city) => ({
        city: slugify(city),
    }));
}
