"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Bed, Bath, Square, ArrowUpRight, Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Property } from "@/types/property";

interface PropertyCardUnifiedProps {
    property: Property;
    className?: string;
}

export const PropertyCardUnified = ({ property, className }: PropertyCardUnifiedProps) => {
    const isExternal = property.isExternal;

    return (
        <article
            className={`group relative flex w-72 flex-none flex-col overflow-hidden rounded-[28px] bg-background border border-white/10 p-3 text-white transition-all duration-200 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 active:scale-[0.99] isolate ${className || ""}`}
        >
            {/* Image Container */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[24px] z-10">
                {property.images[0] ? (
                    <Image
                        src={property.images[0]}
                        alt={property.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-white/5 text-white/40">
                        <span className="text-sm">Pas d&apos;image</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                {/* Badge Vente/Location */}
                <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-black shadow-lg uppercase">
                        {property.transaction}
                    </span>
                </div>

                {/* Badge Partenaire (Si Externe) */}
                {isExternal && (
                    <div className="absolute right-4 top-4 z-10">
                        <span className="rounded-full bg-black/70 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white border border-white/20">
                            Partenaire
                        </span>
                    </div>
                )}

                {/* Prix */}
                <div className="absolute bottom-4 left-4 rounded-full bg-black/80 backdrop-blur-sm px-4 py-2 border border-primary/30">
                    <p className="text-sm font-bold text-primary">{formatCurrency(property.price)}</p>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-20 space-y-3 px-1 pb-1 pt-4">
                <div>
                    <p className="flex items-center gap-1.5 text-xs text-white/60 mb-1">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {property.location.city}
                    </p>
                    <h3 className="line-clamp-2 text-lg font-bold tracking-tight leading-tight mb-1">
                        {property.title}
                    </h3>
                    {property.location.landmark && (
                        <p className="text-xs text-white/50 line-clamp-1">{property.location.landmark}</p>
                    )}
                </div>

                {/* Specs (pour annonces internes) */}
                {!isExternal && (
                    <div className="flex items-center gap-4 text-xs text-white/70">
                        <span className="inline-flex items-center gap-1.5">
                            <Bed className="h-4 w-4 text-primary/80" />
                            <span className="font-medium">{property.specs.bedrooms} ch.</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Bath className="h-4 w-4 text-primary/80" />
                            <span className="font-medium">{property.specs.bathrooms} sdb.</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Square className="h-4 w-4 text-primary/80" />
                            <span className="font-medium">{property.specs.surface}m²</span>
                        </span>
                    </div>
                )}

                {/* Message pour annonces externes */}
                {isExternal && (
                    <p className="text-xs text-white/50 italic">
                        Annonce partenaire · Voir sur {property.source_site || "CoinAfrique"}
                    </p>
                )}

                {/* Type de bien */}
                <div className="flex flex-wrap gap-2 text-[11px] text-white/60">
                    <span className="rounded-full border border-white/10 bg-background px-3 py-1">
                        {property.details.type}
                    </span>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                    {isExternal ? (
                        <a
                            href={property.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex w-full justify-between items-center rounded-2xl bg-white/10 border border-white/10 text-white hover:bg-white/20 font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg px-4 py-2.5"
                        >
                            <span>Voir l&apos;annonce</span>
                            <ArrowUpRight className="h-4 w-4" />
                        </a>
                    ) : (
                        <Button
                            variant="secondary"
                            className="w-full justify-between rounded-2xl bg-primary text-black hover:bg-primary/90 font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
                            asChild
                        >
                            <Link href={`/biens/${property.id}`}>
                                Découvrir
                                <span aria-hidden>→</span>
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </article>
    );
};
