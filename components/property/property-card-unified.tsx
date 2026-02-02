"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Bed, Bath, Square, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import type { Property } from "@/types/property";

interface PropertyCardUnifiedProps {
    property: Property;
    className?: string;
}

export const PropertyCardUnified = ({ property, className }: PropertyCardUnifiedProps) => {
    const isExternal = property.isExternal;
    // Ensure href is always a string (never undefined)
    const href = isExternal
        ? (property.source_url || '#')
        : `/biens/${property.id}`;

    const CardWrapper = isExternal ? 'a' : Link;
    const cardProps = isExternal
        ? { href, target: "_blank" as const, rel: "noopener noreferrer" }
        : { href };

    return (
        <CardWrapper
            {...cardProps}
            className={`group relative flex w-72 flex-none flex-col overflow-hidden rounded-[28px] bg-background border border-white/10 p-3 text-white transition-all duration-200 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 active:scale-[0.99] isolate cursor-pointer ${className || ""}`}
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
                    <p className="text-sm font-bold text-primary">
                        {property.price > 0 ? formatCurrency(property.price) : "Prix sur demande"}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-20 space-y-3 px-1 pb-1 pt-4">
                <div>
                    <p className="flex items-center gap-1.5 text-xs text-white/60 mb-1">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {property.location.district ||
                            (property.location.city && property.location.city.toLowerCase() !== "sénégal" && property.location.city.toLowerCase() !== "senegal" ? property.location.city : null) ||
                            property.location.region ||
                            property.location.city ||
                            "Sénégal"}
                    </p>
                    <h3 className="line-clamp-2 text-lg font-bold tracking-tight leading-tight mb-1 flex items-center gap-2">
                        {property.title}
                        {property.verification_status === "verified" && (
                            <VerifiedBadge variant="icon" size="sm" showTooltip={false} />
                        )}
                    </h3>
                    {property.location.landmark && (
                        <p className="text-xs text-white/50 line-clamp-1">{property.location.landmark}</p>
                    )}
                </div>

                {/* Specs (pour annonces internes) - Masquer les valeurs non renseignées */}
                {!isExternal && (property.specs.bedrooms > 0 || property.specs.bathrooms > 0 || property.specs.surface > 0) && (
                    <div className="flex items-center gap-4 text-xs text-white/70">
                        {property.specs.bedrooms > 0 && (
                            <span className="inline-flex items-center gap-1.5">
                                <Bed className="h-4 w-4 text-primary/80" />
                                <span className="font-medium">{property.specs.bedrooms} ch.</span>
                            </span>
                        )}
                        {property.specs.bathrooms > 0 && (
                            <span className="inline-flex items-center gap-1.5">
                                <Bath className="h-4 w-4 text-primary/80" />
                                <span className="font-medium">{property.specs.bathrooms} sdb.</span>
                            </span>
                        )}
                        {property.specs.surface > 0 && (
                            <span className="inline-flex items-center gap-1.5">
                                <Square className="h-4 w-4 text-primary/80" />
                                <span className="font-medium">{property.specs.surface}m²</span>
                            </span>
                        )}
                    </div>
                )}

                {/* Message pour annonces externes */}
                {isExternal && (
                    <p className="text-xs text-white/50 italic">
                        Annonce partenaire · Voir sur {property.source_site || "CoinAfrique"}
                    </p>
                )}

                {/* Type de bien + indicateur externe */}
                <div className="flex flex-wrap gap-2 text-[11px] text-white/60">
                    <span className="rounded-full border border-white/10 bg-background px-3 py-1">
                        {property.details.type}
                    </span>
                    {isExternal && (
                        <span className="rounded-full border border-white/10 bg-background px-3 py-1 inline-flex items-center gap-1">
                            <ArrowUpRight className="h-3 w-3" />
                            Externe
                        </span>
                    )}
                </div>
            </div>
        </CardWrapper>
    );
};
