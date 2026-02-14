"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin, Bed, Bath, Move } from "lucide-react";
import Image from "next/image";
import { Property } from "@/types/property";

interface FeaturedPropertiesProps {
    properties: Property[];
}

export default function FeaturedProperties({ properties }: FeaturedPropertiesProps) {
    if (!properties || properties.length === 0) {
        return null;
    }

    return (
        <section className="py-24 bg-black">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <span className="inline-block text-[#F4C430] text-sm font-medium tracking-widest uppercase mb-4">
                        Sélection Exclusive
                    </span>
                    <h2 className="font-display text-4xl md:text-5xl text-white mb-4">
                        Nos biens <span className="gradient-text-animated">en vedette</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {properties.map((property, index) => {
                        const isExternal = property.isExternal;
                        const href = isExternal ? `/biens/ext/${property.id}` : `/biens/${property.id}`;
                        const LinkComponent = Link;
                        const linkProps = {};

                        return (
                            <motion.div
                                key={property.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="group rounded-2xl bg-zinc-900 border border-white/5 overflow-hidden hover:border-[#F4C430]/30 transition-all duration-300"
                            >
                                {/* Image Container */}
                                <div className="relative h-64 overflow-hidden">
                                    <LinkComponent href={href} {...linkProps} className="absolute inset-0 z-20" />
                                    <div className="absolute top-4 left-4 z-10 bg-[#F4C430] text-black text-xs font-bold px-3 py-1 rounded-full pointer-events-none">
                                        {property.transaction === 'vente' ? 'Vente' : 'Location'}
                                    </div>
                                    {property.images && property.images.length > 0 ? (
                                        <Image
                                            src={property.images[0]}
                                            alt={property.title}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600">
                                            <span className="text-sm">Image non disponible</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">
                                        <LinkComponent href={href} {...linkProps} className="hover:text-[#F4C430] transition-colors">
                                            {property.title}
                                        </LinkComponent>
                                    </h3>
                                    <div className="flex items-center text-gray-400 text-sm mb-4">
                                        <MapPin className="w-4 h-4 mr-1 text-[#F4C430]" />
                                        {property.location.city}, {property.location.address}
                                    </div>

                                    {/* Specs */}
                                    <div className="flex items-center justify-between border-t border-white/10 pt-4 mb-4 text-sm text-gray-300">
                                        <div className="flex items-center gap-1">
                                            <Bed className="w-4 h-4" /> {property.specs.bedrooms}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Bath className="w-4 h-4" /> {property.specs.bathrooms}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Move className="w-4 h-4" /> {property.specs.surface}m²
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-[#F4C430] font-bold">
                                            {new Intl.NumberFormat('fr-FR').format(property.price)} FCFA
                                            {property.transaction === 'location' && ' / mois'}
                                        </span>
                                        <LinkComponent
                                            href={href}
                                            {...linkProps}
                                            className="text-white text-sm font-medium hover:text-[#F4C430] transition-colors"
                                        >
                                            Voir détails →
                                        </LinkComponent>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
