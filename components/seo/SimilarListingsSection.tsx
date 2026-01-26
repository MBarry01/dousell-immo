"use client";

import { Property } from "@/types/property";
import { PropertyCard } from "@/components/property/property-card";
import { Sparkles } from "lucide-react";

interface SimilarListingsSectionProps {
    properties: Property[];
}

export function SimilarListingsSection({ properties }: SimilarListingsSectionProps) {
    if (!properties || properties.length === 0) return null;

    return (
        <div className="container mx-auto px-4 py-12 border-t border-border/50">
            <h2 className="text-2xl font-bold font-display mb-6">
                Ces annonces pourraient vous intéresser
            </h2>

            <div className="flex overflow-x-auto pb-6 gap-6 -mx-4 px-4 scrollbar-hide snap-x">
                {properties.map((property) => (
                    <div key={property.id} className="min-w-[280px] md:min-w-[320px] snap-center">
                        <PropertyCard property={property} />
                    </div>
                ))}
            </div>
        </div>
    );
}

