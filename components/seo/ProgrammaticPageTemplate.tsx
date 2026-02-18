"use client";

import { useEffect, useState, Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { Property } from "@/types/property";
import { PropertyCard } from "@/components/property/property-card";
import { Button } from "@/components/ui/button";
import { GripHorizontal, ArrowRight } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { slugify, cleanCityName } from "@/lib/slugs";
import { getCityImage } from "@/lib/cityImages";

import { SimilarListingsSection } from "@/components/seo/SimilarListingsSection";
import { ProgrammaticSectionFAQ } from "@/components/seo/ProgrammaticSectionFAQ";
import { OwnerCTA } from "@/components/property/OwnerCTA";

interface ProgrammaticPageTemplateProps {
    properties: Property[];
    similarProperties?: Property[]; // New prop
    city: string; // Slug (e.g. thies-region)
    displayCity: string; // Formatting (e.g. Thiès Region)
    type?: string; // Slug (e.g. appartement)
    displayType?: string; // Formatted
    mode: 'location' | 'vente';
    nearbyCities?: string[]; // New prop for mesh
}

export default function ProgrammaticPageTemplate({
    properties,
    similarProperties = [],
    city,
    displayCity,
    type,
    displayType,
    mode,
    nearbyCities = []
}: ProgrammaticPageTemplateProps) {
    const isRental = mode === 'location';
    const _actionText = isRental ? "Louer" : "Acheter";
    const _connector = isRental ? "à" : "à"; // Grammaire simple

    // SEO Title Logic
    const mainTitle = type
        ? `${isRental ? "Location" : "Vente"} ${displayType} à `
        : `Immobilier à `;

    const countText = `${properties.length} bien${properties.length > 1 ? 's' : ''}`;

    // Average Price (Loyer ou Prix Vente)
    const avgPrice = properties.length > 0
        ? Math.round(properties.reduce((sum, p) => sum + p.price, 0) / properties.length)
        : 0;

    // Available Types for Linking
    const availableTypes = Array.from(new Set(properties.map(p => p.details?.type).filter(Boolean)));

    if (properties.length === 0) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-3xl font-bold mb-4">
                    Pas encore de {type ? displayType : "bien"} en {isRental ? "location" : "vente"} à {displayCity}
                </h1>
                <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                    Nous n&apos;avons pas d&apos;annonce correspondant à ces critères pour le moment.
                    Mais nous avons d&apos;autres opportunités !
                </p>

                {/* Fallback Similar Listings if main list is empty */}
                {similarProperties.length > 0 && (
                    <div className="mt-12 text-left">
                        <SimilarListingsSection properties={similarProperties} />
                    </div>
                )}

                <div className="flex justify-center gap-4 mt-8">
                    <Button asChild variant="outline">
                        <Link href="/recherche">Voir toutes les annonces</Link>
                    </Button>
                    <Button asChild>
                        <Link href={`/${mode === 'location' ? 'location' : 'vente'}`}>
                            Tout voir en {isRental ? "Location" : "Vente"}
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Context Header */}
            <div className="bg-muted/30 border-b">
                <div className="container mx-auto px-4 py-10">

                    <h1 className="text-3xl md:text-5xl font-display font-bold mb-4 capitalize">
                        {mainTitle} <span className="text-[#F4C430]">{cleanCityName(displayCity)}</span>
                        <span className="text-muted-foreground text-lg md:text-2xl ml-3 font-normal">
                            ({countText})
                        </span>
                    </h1>

                    <p className="text-muted-foreground max-w-3xl text-lg leading-relaxed mb-8">
                        {isRental
                            ? `Trouvez votre future location à ${cleanCityName(displayCity)}. Loyer moyen : `
                            : `Investissez à ${cleanCityName(displayCity)}. Prix moyen : `}
                        <span className="font-bold text-[#F4C430]">{formatCurrency(avgPrice)}</span>.
                        Expertise locale et accompagnement complet avec Doussel Immo.
                    </p>

                    {/* Type Filter Quick Links (Only on city page) */}
                    {!type && availableTypes.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {availableTypes.map(t => (
                                <Link
                                    key={t}
                                    href={`/${mode}/${city}/${slugify(t as string)}`}
                                    className="px-4 py-1.5 rounded-full bg-background border hover:border-[#F4C430] hover:text-[#F4C430] transition-colors text-sm font-medium"
                                >
                                    {t} à {cleanCityName(displayCity)}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Grid */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {properties.map((property) => (
                        <PropertyCard key={property.id} property={property} />
                    ))}
                </div>

                {/* Simple Inline CTA for Owners */}
                <div className="mt-12 py-6 text-center border-t border-border/30">
                    <p className="text-muted-foreground text-base">
                        <span className="text-foreground font-semibold">Propriétaire à {cleanCityName(displayCity)} ?</span>{" "}
                        Publiez gratuitement votre annonce et trouvez un locataire en 48h.{" "}
                        <Link
                            href="/compte/deposer"
                            className="text-primary font-bold hover:underline"
                        >
                            Déposer une annonce →
                        </Link>
                    </p>
                </div>

                {/* Similar Listings Section */}
                <SimilarListingsSection properties={similarProperties} />

                {/* FAQ Automatisée SEO */}
                <ProgrammaticSectionFAQ
                    properties={[...properties, ...similarProperties]}
                    city={displayCity}
                    mode={mode}
                />

                {/* Internal Linking Footer (Maillage Type) */}
                {type && (
                    <div className="mt-20 pt-10 border-t border-border/50">
                        <div className="flex items-center gap-2 text-xl font-bold mb-6">
                            <GripHorizontal className="h-6 w-6 text-primary" />
                            <h3>Autres recherches {isRental ? "locatives" : "immobilières"} à {displayCity}</h3>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {['Appartement', 'Villa', 'Studio', 'Terrain', 'Bureau'].map((otherType) => {
                                if (otherType.toLowerCase() === displayType?.toLowerCase()) return null;
                                return (
                                    <Link
                                        key={otherType}
                                        href={`/${mode}/${city}/${slugify(otherType)}`}
                                        className="px-5 py-2.5 rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all text-sm font-medium"
                                    >
                                        {otherType} à {cleanCityName(displayCity)}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Internal Linking Geographic (Maillage Villes - Design Postcard Grid) */}
                {nearbyCities.length > 0 && (
                    <section className="mt-20 py-16 -mx-4 px-4 sm:px-8">
                        <div className="container mx-auto max-w-6xl">

                            <div className="text-center mb-12">
                                <h3 className="text-3xl font-bold text-foreground mb-3">
                                    Destinations populaires
                                </h3>
                                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                    Élargissez votre recherche. Découvrez les opportunités immobilières dans les villes les plus prisées.
                                </p>
                            </div>

                            {/* GRILLE DE CARTES POSTALES */}
                            {/* GRILLE DE CARTES POSTALES (Flex centered) */}
                            <div className="flex flex-wrap justify-center gap-6">
                                {nearbyCities.map((cityName) => {
                                    const imageUrl = getCityImage(cityName);
                                    const citySlug = slugify(cityName);

                                    return (
                                        <Link
                                            key={cityName}
                                            href={`/${mode}/${citySlug}`}
                                            className="group relative h-72 w-full sm:w-80 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block"
                                        >
                                            {/* 1. L'Image de fond */}
                                            <Image
                                                src={imageUrl}
                                                alt={`Immobilier à ${cleanCityName(cityName)}`}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                            />

                                            {/* 2. L'Overlay sombre */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                                            {/* 3. Le Contenu Texte */}
                                            <div className="absolute bottom-0 left-0 p-6 w-full">
                                                <h4 className="text-2xl font-bold text-white capitalize mb-2">
                                                    {cleanCityName(cityName)}
                                                </h4>
                                                <div className="flex items-center text-white/90 text-sm font-medium gap-2 group/btn">
                                                    <span>Explorer les offres</span>
                                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>

                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
