import Image from "next/image";
import Link from "next/link";
import {
    ArrowLeft,
    MapPin,
    ExternalLink,
    Bed,
    LayoutGrid,
    Tag,
    ArrowUpRight,
} from "lucide-react";

import { StaticMap } from "@/components/property/static-map";
import { SimilarProperties } from "@/components/property/similar-properties";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { formatCurrency } from "@/lib/utils";
import type { Property } from "@/types/property";

type ExternalPropertyTeaserProps = {
    property: Property;
    similar: Property[];
};

export const ExternalPropertyTeaser = ({
    property,
    similar,
}: ExternalPropertyTeaserProps) => {
    const breadcrumbItems = [
        { label: "Accueil", href: "/" },
        {
            label: property.transaction === "location" ? "Louer" : "Acheter",
            href: `/recherche?category=${encodeURIComponent(property.transaction)}`,
        },
        {
            label: property.location.city || "Sénégal",
            href: `/recherche?city=${encodeURIComponent(property.location.city || "Sénégal")}`,
        },
        { label: property.title },
    ];

    const sourceSite = property.source_site || "le site partenaire";
    const sourceUrl = property.source_url || "#";

    return (
        <div className="min-h-screen bg-white pb-32 text-gray-900 dark:bg-[#05080c] dark:text-white">
            {/* Hero Image */}
            <div className="relative h-[50vh] min-h-[320px] max-h-[500px] w-full overflow-hidden">
                {property.images[0] ? (
                    <Image
                        src={property.images[0]}
                        alt={property.title}
                        fill
                        className="object-cover"
                        priority
                        sizes="100vw"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-gray-200 dark:bg-white/5">
                        <span className="text-gray-400 dark:text-white/30">Image non disponible</span>
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />

                {/* Top Bar */}
                <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between">
                    <Link
                        href="/recherche"
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>

                    {/* Badge Partenaire */}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-white border border-white/20">
                        <ArrowUpRight className="h-4 w-4" />
                        Annonce partenaire
                    </span>
                </div>

                {/* Prix en overlay */}
                <div className="absolute bottom-6 left-6 z-20">
                    <div className="rounded-2xl bg-black/70 backdrop-blur-sm px-6 py-3 border border-white/10">
                        <p className="text-2xl font-bold text-primary md:text-3xl">
                            {property.price > 0 ? formatCurrency(property.price) : "Prix sur demande"}
                        </p>
                        {property.transaction === "location" && (
                            <p className="text-sm text-white/60">/ mois</p>
                        )}
                    </div>
                </div>

                {/* Badge transaction */}
                <div className="absolute bottom-6 right-6 z-20">
                    <span className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-black uppercase">
                        {property.transaction}
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto max-w-4xl px-4 pt-8 md:px-6">
                <Breadcrumbs items={breadcrumbItems} />

                {/* Header */}
                <div className="mt-4 mb-8 space-y-3">
                    <div className="flex items-center gap-3">
                        <span className="rounded-full bg-amber-500/15 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-amber-500">
                            {property.details.type}
                        </span>
                        <span className="rounded-full bg-blue-500/15 px-4 py-1 text-xs font-semibold text-blue-500">
                            Via {sourceSite}
                        </span>
                    </div>

                    <h1 className="text-3xl font-semibold text-gray-900 dark:text-white md:text-4xl">
                        {property.title}
                    </h1>

                    <div className="flex items-center gap-2 text-gray-600 dark:text-white/60">
                        <MapPin className="h-4 w-4" />
                        <span>
                            {[property.location.address, property.location.city]
                                .filter(Boolean)
                                .join(", ") || "Sénégal"}
                        </span>
                    </div>
                </div>

                {/* Specs disponibles */}
                {(property.specs.rooms > 0 || property.specs.bedrooms > 0) && (
                    <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {property.specs.rooms > 0 && (
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center dark:border-white/10 dark:bg-white/5">
                                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 dark:bg-white/10 dark:text-white">
                                    <LayoutGrid className="h-5 w-5" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {property.specs.rooms}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-white/60">Pièces</p>
                            </div>
                        )}
                        {property.specs.bedrooms > 0 && (
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center dark:border-white/10 dark:bg-white/5">
                                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 dark:bg-white/10 dark:text-white">
                                    <Bed className="h-5 w-5" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {property.specs.bedrooms}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-white/60">Chambres</p>
                            </div>
                        )}
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center dark:border-white/10 dark:bg-white/5">
                            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 dark:bg-white/10 dark:text-white">
                                <Tag className="h-5 w-5" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {property.details.type}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-white/60">Type</p>
                        </div>
                    </div>
                )}

                {/* CTA Principal */}
                <div className="mb-10">
                    <a
                        href={sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-center gap-3 rounded-2xl bg-primary px-8 py-5 text-lg font-bold text-black transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:scale-[0.98]"
                    >
                        <ExternalLink className="h-6 w-6 transition-transform group-hover:rotate-12" />
                        Voir l&apos;annonce complète sur {sourceSite}
                    </a>
                    <p className="mt-3 text-center text-sm text-gray-500 dark:text-white/40">
                        Vous serez redirigé vers {sourceSite} dans un nouvel onglet
                    </p>
                </div>

                {/* Info Box */}
                <div className="mb-10 rounded-xl border border-amber-500/20 bg-amber-50/50 p-5 dark:border-amber-500/10 dark:bg-amber-950/20">
                    <p className="text-sm text-amber-800 dark:text-amber-200/80">
                        <strong>📋 Annonce partenaire</strong> — Cette annonce provient de{" "}
                        <strong>{sourceSite}</strong>. Les détails complets (description, photos
                        supplémentaires, contact) sont disponibles sur le site source.
                    </p>
                </div>

                {/* Carte */}
                {property.location.coords && (
                    <div className="mb-12">
                        <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
                            Localisation
                        </h2>
                        <StaticMap
                            coords={property.location.coords}
                            city={property.location.city}
                            address={property.location.address}
                            landmark=""
                        />
                    </div>
                )}

                {/* CTA Secondaire (répétition en bas) */}
                <div className="mb-12 text-center">
                    <a
                        href={sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-8 py-3 text-base font-semibold text-primary transition-all hover:bg-primary/10 active:scale-[0.98]"
                    >
                        <ExternalLink className="h-5 w-5" />
                        Voir sur {sourceSite}
                    </a>
                </div>

                {/* Biens Similaires */}
                {similar.length > 0 && (
                    <div className="border-t border-gray-200 pt-12 dark:border-white/10">
                        <SimilarProperties properties={similar} />
                    </div>
                )}
            </div>
        </div>
    );
};
