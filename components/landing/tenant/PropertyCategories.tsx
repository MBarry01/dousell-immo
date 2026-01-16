"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type CategoryData = {
    id: string;
    name: string;
    count: number;
    image: string | null;
    searchType: string;
};

const CATEGORY_CONFIG: Record<string, { colSpan: string; fallbackImage: string }> = {
    villas: {
        colSpan: "md:col-span-2",
        fallbackImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    },
    appartements: {
        colSpan: "md:col-span-1",
        fallbackImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    },
    terrains: {
        colSpan: "md:col-span-1",
        fallbackImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
    },
    studios: {
        colSpan: "md:col-span-2",
        fallbackImage: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    },
};

export default function PropertyCategories() {
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCategories() {
            try {
                const response = await fetch("/api/properties/categories");
                const data = await response.json();
                if (data.categories) {
                    setCategories(data.categories);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchCategories();
    }, []);

    return (
        <section className="py-20 bg-zinc-950">
            <div className="container mx-auto px-6">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">Parcourir par catégorie</h2>
                        <p className="text-gray-400">Trouvez le type de bien qui correspond à votre style de vie.</p>
                    </div>
                    <Link
                        href="/recherche"
                        className="hidden md:flex items-center gap-2 text-[#F4C430] hover:text-[#FFD700] transition-colors"
                    >
                        Voir tout <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {loading ? (
                        // Skeleton loading
                        [...Array(4)].map((_, index) => (
                            <div
                                key={index}
                                className={`relative h-64 rounded-2xl overflow-hidden bg-zinc-800 animate-pulse ${
                                    index === 0 || index === 3 ? "md:col-span-2" : "md:col-span-1"
                                }`}
                            />
                        ))
                    ) : (
                        categories.map((cat, index) => {
                            const config = CATEGORY_CONFIG[cat.id] || {
                                colSpan: "md:col-span-1",
                                fallbackImage: "",
                            };
                            const imageUrl = cat.image || config.fallbackImage;

                            return (
                                <motion.div
                                    key={cat.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`relative h-64 rounded-2xl overflow-hidden group cursor-pointer ${config.colSpan}`}
                                >
                                    <Link href={`/recherche?type=${cat.searchType}`} className="absolute inset-0 z-30" />

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10" />

                                    {/* Background Image */}
                                    {imageUrl ? (
                                        <Image
                                            src={imageUrl}
                                            alt={cat.name}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                            sizes="(max-width: 768px) 100vw, 66vw"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-zinc-800 transition-transform duration-700 group-hover:scale-105" />
                                    )}

                                    {/* Content */}
                                    <div className="absolute bottom-6 left-6 z-20">
                                        <h3 className="text-2xl font-bold text-white mb-1">{cat.name}</h3>
                                        <p className="text-gray-300 text-sm flex items-center gap-2 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                            {cat.count} {cat.count > 1 ? "biens" : "bien"} <ArrowRight className="w-3 h-3" />
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>
        </section>
    );
}
